// 1. INITIALISATION PROPRE (Indispensable pour charger les questions)
const SUPABASE_URL = 'https://cjxbsrudyqumeuvedozo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqeGJzcnVkeXF1bWV1dmVkb3pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMzkwNzcsImV4cCI6MjA4NTgxNTA3N30.GTK9BWO87eCf3IAf_8OTy4T59nFl8-vjnWDMApUOHAo';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let allQuestions = [];
let currentQuestions = [];
let currentIndex = 0;
let score = 0;
let lives = 3;
let timer;
let isVip = localStorage.getItem('isVip') === 'true';
let currentUser = localStorage.getItem('quiz_pseudo') || "";

// MESSAGES PERSONNALISÉS
function showHowToPlay() {
    alert("🎮 RÈGLES DU JEU :\n\n- Réponds en 15s ⏱️\n- Tu as 3 vies ❤️\n- Mode gratuit : limité à 10 questions.\n- Prends l'accès VIP pour le manuel complet !");
}

function showInstallGuide() {
    alert("📲 INSTALLER SUR TON MOBILE :\n\n- Sur Android : Clique sur les 3 points en haut à droite > 'Installer l'application'.\n- Sur iPhone : Clique sur le bouton 'Partager' en bas > 'Sur l'écran d'accueil'.");
}

// CHARGEMENT DES DONNÉES
async function loadData() {
    const { data, error } = await _supabase.from('questions').select('*');
    if (data) {
        allQuestions = data;
        displayComments();
    }
}

// MANUEL D'ÉTUDE (80+ Questions)
async function showStudyMode() {
    if (!isVip) {
        alert("🔒 Cet accès est réservé aux membres VIP (Pack 500F).");
        showShop();
        return;
    }
    document.getElementById('home-screen').style.display = 'none';
    const screen = document.getElementById('study-screen');
    screen.style.display = 'block';
    
    // On affiche jusqu'à 100 questions si elles existent
    const { data } = await _supabase.from('questions').select('*').limit(100);
    const list = document.getElementById('study-list');
    list.innerHTML = data.map(q => `
        <div class="study-card">
            <b>Q: ${q.question}</b><br>
            <span style="color:#FCD116;">R: ${q.correct_answer}</span>
        </div>
    `).join('');
}

// SYSTÈME DE QUIZ (Simplifié pour mobile)
function startQuiz(cat) {
    currentQuestions = allQuestions.filter(q => q.category.toLowerCase() === cat.toLowerCase());
    if(currentQuestions.length === 0) return alert("Bientôt disponible !");
    currentQuestions.sort(() => 0.5 - Math.random());
    currentIndex = 0; score = 0; lives = 3;
    document.getElementById('home-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    showQuestion();
}

function showQuestion() {
    if (!isVip && currentIndex >= 10) {
        alert("🔒 Niveau 2 bloqué ! Deviens VIP pour continuer.");
        location.reload();
        return;
    }
    if (currentIndex === 4 && !localStorage.getItem('quiz_rated')) {
        document.getElementById('rating-screen').style.display = 'flex';
    }
    updateHeader();
    startTimer();
    const q = currentQuestions[currentIndex];
    document.getElementById('question-text').innerText = q.question;
    const container = document.getElementById('options-container');
    container.innerHTML = '';
    [q.option1, q.option2, q.option3, q.option4].forEach(opt => {
        if(!opt) return;
        const btn = document.createElement('button');
        btn.innerText = opt;
        btn.className = 'main-btn';
        btn.onclick = () => checkAnswer(opt, q.correct_answer, q.explanation);
        container.appendChild(btn);
    });
}

function checkAnswer(choice, correct, expl) {
    clearInterval(timer);
    const isCorrect = (choice === correct);
    if(isCorrect) score++; else lives--;
    
    document.getElementById('explanation-text').innerHTML = `
        <b style="color:${isCorrect?'#009E60':'#ff4444'}">${isCorrect?'✅ CORRECT':'❌ ERREUR'}</b><br>
        ${expl || ""}
    `;
    document.getElementById('feedback-area').style.display = 'block';
    if(lives <= 0) { alert("💔 Plus de vies !"); location.reload(); }
}

function nextQuestion() {
    document.getElementById('feedback-area').style.display = 'none';
    currentIndex++;
    showQuestion();
}

function startTimer() {
    clearInterval(timer);
    let timeLeft = 15;
    timer = setInterval(() => {
        timeLeft--;
        document.getElementById('timer-text').innerText = `⏱️ ${timeLeft}s`;
        if(timeLeft <= 0) { clearInterval(timer); lives--; nextQuestion(); }
    }, 1000);
}

function updateHeader() {
    let h = ""; for(let i=0; i<3; i++) h += (i < lives) ? "❤️" : "🖤";
    document.getElementById('score-display').innerHTML = `Score: ${score} | ${h}`;
}

// GESTION VIP
function showShop() {
    document.getElementById('home-screen').style.display = 'none';
    document.getElementById('shop-screen').style.display = 'block';
}

function checkVipCode() {
    const code = document.getElementById('vip-code-input').value.toUpperCase().trim();
    if(["GABON2024", "VIP500"].includes(code)) {
        localStorage.setItem('isVip', 'true');
        alert("💎 ACCÈS VIP ACTIVÉ !");
        location.reload();
    } else alert("Code invalide.");
}

// PSEUDO & COMMENTAIRES
function saveUser() {
    const p = document.getElementById('user-pseudo').value.trim();
    if(p.length < 2) return;
    localStorage.setItem('quiz_pseudo', p);
    currentUser = p;
    document.getElementById('login-screen').style.display = 'none';
}

function postComment() {
    const msg = document.getElementById('user-comment').value.trim();
    if(!msg) return;
    let comments = JSON.parse(localStorage.getItem('quiz_comments') || "[]");
    comments.unshift({pseudo: currentUser, text: msg, date: new Date().toLocaleDateString()});
    localStorage.setItem('quiz_comments', JSON.stringify(comments.slice(0,10)));
    displayComments();
    document.getElementById('user-comment').value = "";
}

function displayComments() {
    const div = document.getElementById('comments-display');
    const comments = JSON.parse(localStorage.getItem('quiz_comments') || "[]");
    div.innerHTML = comments.map(c => `<div><b>${c.pseudo}</b>: ${c.text}</div>`).join('');
}

// RATING
let rate = 0;
function setRate(v) {
    rate = v;
    const stars = document.querySelectorAll('#star-rating span');
    stars.forEach((s, i) => s.className = i < v ? 'active' : '');
}

function submitReview() {
    localStorage.setItem('quiz_rated', 'true');
    document.getElementById('rating-screen').style.display = 'none';
    alert("Merci pour ton avis !");
}

function shareGame() {
    const text = "Prouve que tu es un vrai Gabonais 🇬🇦 ! Joue ici : " + window.location.href;
    window.open("https://wa.me/?text=" + encodeURIComponent(text));
}

if(currentUser) document.getElementById('login-screen').style.display = 'none';
loadData();
// =========================================================
// DERNIÈRES MISES À JOUR : NOTIFICATIONS, VIP & ANTI-BUG
// =========================================================

// 1. Remplace les alertes moches par des fenêtres chic
function showNotice(title, message) {
    const modal = document.createElement('div');
    modal.className = 'custom-modal-overlay'; // Pour le fond sombre
    modal.innerHTML = `
        <div style="position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); 
                    background:#1a1a1a; border:2px solid #FCD116; padding:25px; 
                    border-radius:20px; text-align:center; z-index:10000; width:85%; max-width:350px;
                    box-shadow: 0 0 30px rgba(0,0,0,0.8); color:white;">
            <h3 style="color:#FCD116; margin-top:0;">${title}</h3>
            <p>${message}</p>
            <button onclick="this.parentElement.parentElement.remove()" 
                    style="background:#FCD116; color:black; border:none; padding:12px 25px; 
                    border-radius:10px; font-weight:bold; cursor:pointer; width:100%;">D'ACCORD</button>
        </div>
        <div style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:9999;"></div>
    `;
    document.body.appendChild(modal);
}

// 2. Redéfinition des boutons pour ne plus utiliser "alert"
window.showHowToPlay = function() {
    showNotice("❓ COMMENT JOUER", "Réponds aux questions avant la fin du chrono ⏱️. Tu as 3 ❤️. Le mode gratuit s'arrête à 10 questions. Prends le Pack VIP pour débloquer les 500 questions !");
};

window.showInstallGuide = function() {
    showNotice("📲 INSTALLATION", "Pour iPhone : Appuie sur 'Partager' puis 'Sur l'écran d'accueil'.<br><br>Pour Android : Appuie sur les 3 points puis 'Installer l'application'.");
};

// 3. Correction du Manuel (50% Gratuit / 50% VIP 500)
// Cette fonction va écraser l'ancienne si elle existe
window.showStudyMode = async function() {
    document.getElementById('home-screen').style.display = 'none';
    const screen = document.getElementById('study-screen');
    screen.style.display = 'block';
    
    const { data } = await _supabase.from('questions').select('*').limit(100);
    const list = document.getElementById('study-list');
    
    if (data) {
        let vipStatus = localStorage.getItem('vip_type'); // '300' ou '500'
        list.innerHTML = data.map((q, index) => {
            const isLocked = (vipStatus !== '500' && index > 20);
            return `
                <div style="background:#222; padding:12px; margin-bottom:10px; border-radius:10px; 
                            border-left:4px solid ${isLocked ? '#444' : '#FCD116'}; 
                            filter: ${isLocked ? 'blur(3px)' : 'none'}; opacity: ${isLocked ? '0.5' : '1'}">
                    <b>Q: ${q.question}</b><br>
                    <span style="color:#FCD116;">R: ${q.correct_answer}</span>
                    ${isLocked ? '<br><small style="color:red;">🔒 RÉSERVÉ VIP 500F</small>' : ''}
                </div>`;
        }).join('');
        
        if(vipStatus !== '500') {
            const lockMsg = document.createElement('div');
            lockMsg.innerHTML = `<button onclick="showShop()" class="vip-btn">DÉBLOQUER LES 80+ RÉPONSES (500F)</button>`;
            list.prepend(lockMsg);
        }
    }
};

// 4. Correction de la validation des codes (300F vs 500F)
window.checkVipCode = function() {
    const val = document.getElementById('vip-code-input').value.toUpperCase().trim();
    if (val === "GAB300") {
        localStorage.setItem('isVip', 'true');
        localStorage.setItem('vip_type', '300');
        showNotice("💎 VIP 300 ACTIVÉ", "Niveau 2 débloqué ! Tu peux maintenant dépasser les 10 questions.");
        setTimeout(() => location.reload(), 2000);
    } else if (val === "GAB500") {
        localStorage.setItem('isVip', 'true');
        localStorage.setItem('vip_type', '500');
        showNotice("👑 VIP 500 ACTIVÉ", "Accès Total ! Questions VIP et Manuel d'étude complet débloqués.");
        setTimeout(() => location.reload(), 2000);
    } else {
        showNotice("❌ ERREUR", "Code invalide. Contacte le support si besoin.");
    }
};

// 5. Sécurité Anti-Bug pour les 500 questions
// On s'assure que le jeu ne s'arrête pas par erreur
const originalNextQuestion = window.nextQuestion;
window.nextQuestion = function() {
    let vType = localStorage.getItem('vip_type');
    if (!vType && currentIndex >= 10) {
        showNotice("🔒 LIMITE GRATUITE", "Bravo ! Tu as fini le mode gratuit. Débloque le Pack VIP pour jouer aux 500 questions !");
        location.reload();
        return;
    }
    // Si on est VIP 300 ou 500, on continue sans limite
    if (typeof originalNextQuestion === "function") originalNextQuestion();
};
// =========================================================
// GESTION DU MUR DES CHAMPIONS (SUPABASE)
// =========================================================

// 1. Envoyer le commentaire sur Supabase au lieu du téléphone
window.postComment = async function() {
    const msgInput = document.getElementById('user-comment');
    const msg = msgInput.value.trim();
    
    if(!msg || !currentUser) {
        showNotice("⚠️ ATTENTION", "Tu dois entrer un message et avoir un pseudo !");
        return;
    }

    // On envoie à la table 'comments' que tu as créée sur Supabase
    const { error } = await _supabase
        .from('comments')
        .insert([{ 
            pseudo: currentUser, 
            text: msg, 
            score: score,
            created_at: new Date() 
        }]);

    if (!error) {
        msgInput.value = ""; // On vide le champ
        displayComments(); // On rafraîchit la liste pour tout le monde
    } else {
        console.error("Erreur Supabase:", error);
        // Si la table n'existe pas encore, on utilise l'ancien système de secours
        let localC = JSON.parse(localStorage.getItem('quiz_comments') || "[]");
        localC.unshift({pseudo: currentUser, text: msg, score: score});
        localStorage.setItem('quiz_comments', JSON.stringify(localC.slice(0,10)));
        displayComments();
    }
};

// 2. Récupérer les messages de TOUS les joueurs
window.displayComments = async function() {
    const div = document.getElementById('comments-display');
    if(!div) return;

    // On essaie de récupérer les 10 derniers messages sur Supabase
    const { data, error } = await _supabase
        .from('comments')
        .select('*')
        .order('id', { ascending: false })
        .limit(10);

    if (data && data.length > 0) {
        div.innerHTML = data.map(c => `
            <div style="border-bottom:1px solid #333; padding:8px; margin-bottom:5px;">
                <b style="color:#FCD116;">${c.pseudo}</b> : ${c.text} 
                <br><small style="color:#009E60;">🏆 Score: ${c.score || 0} pts</small>
            </div>
        `).join('');
    } else {
        // Système de secours si Supabase n'est pas encore configuré pour les commentaires
        const localC = JSON.parse(localStorage.getItem('quiz_comments') || "[]");
        div.innerHTML = localC.map(c => `<div><b>${c.pseudo}</b>: ${c.text}</div>`).join('');
    }
};

// On lance l'affichage au démarrage
setTimeout(() => { displayComments(); }, 2000);