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
// =========================================================
// LOGIQUE DE NIVEAUX ET REDIRECTION PAIEMENT
// =========================================================

window.checkLevelProgression = function() {
    let vType = localStorage.getItem('vip_type'); // Peut être null, '300', ou '500'
    let currentCat = currentQuestions[0].category.toLowerCase();

    // BLOQUER APRÈS 10 QUESTIONS (Niveau 1 Gratuit terminé)
    if (!vType && currentIndex >= 10) {
        showNotice("🔒 NIVEAU 1 TERMINÉ", "Bravo ! Pour accéder au Niveau 2 (Difficile) et continuer l'aventure, le ticket est de 300F.");
        setTimeout(() => { showShop(); }, 2000); // Envoie direct à la boutique
        return true; // Bloque la suite
    }

    // BLOQUER LE PACK 300F S'IL JOUE DANS UNE AUTRE CATÉGORIE
    if (vType === '300') {
        let catAuth = localStorage.getItem('category_unlocked');
        if (currentCat !== catAuth && currentIndex >= 10) {
             showNotice("🔒 ACCÈS LIMITÉ", `Ton code 300F était uniquement pour ${catAuth}. Prends le PACK VIP TOTAL (500F) pour jouer partout !`);
             setTimeout(() => { showShop(); }, 2000);
             return true;
        }
    }
    return false;
};

// MISE À JOUR DE LA VALIDATION DES CODES (GAB300, AFR300, MON300, VIP500)
window.checkVipCode = function() {
    const val = document.getElementById('vip-code-input').value.toUpperCase().trim();
    
    if (val === "GAB300") {
        localStorage.setItem('isVip', 'true');
        localStorage.setItem('vip_type', '300');
        localStorage.setItem('category_unlocked', 'provinces');
        showNotice("💎 NIVEAU 2 DÉBLOQUÉ", "Gabon Master est débloqué !");
        location.reload();
    } 
    else if (val === "AFR300") {
        localStorage.setItem('isVip', 'true');
        localStorage.setItem('vip_type', '300');
        localStorage.setItem('category_unlocked', 'afrique');
        showNotice("💎 NIVEAU 2 DÉBLOQUÉ", "Afrique est débloqué !");
        location.reload();
    }
    else if (val === "MON300") {
        localStorage.setItem('isVip', 'true');
        localStorage.setItem('vip_type', '300');
        localStorage.setItem('category_unlocked', 'monde');
        showNotice("💎 NIVEAU 2 DÉBLOQUÉ", "Monde est débloqué !");
        location.reload();
    }
    else if (val === "VIP500" || val === "GABON2024") {
        localStorage.setItem('isVip', 'true');
        localStorage.setItem('vip_type', '500');
        showNotice("👑 PACK VIP TOTAL ACTIVÉ", "Accès illimité à tous les niveaux et au Manuel d'étude !");
        location.reload();
    } 
    else {
        showNotice("❌ CODE INVALIDE", "Vérifie ton code ou contacte le 076 36 73 82.");
    }
};

// On modifie la fonction nextQuestion pour inclure le blocage auto
const previousNext = window.nextQuestion;
window.nextQuestion = function() {
    const isBlocked = checkLevelProgression();
    if (!isBlocked && typeof previousNext === "function") {
        previousNext();
    }
};
// SAUVEGARDE DES QUESTIONS POUR LE MODE HORS-LIGNE
async function cacheQuestions() {
    if (allQuestions.length > 0) {
        localStorage.setItem('cached_questions', JSON.stringify(allQuestions));
    }
}

// Modifier la fonction loadData pour lire le cache si pas d'internet
const oldLoadData = window.loadData;
window.loadData = async function() {
    if (!navigator.onLine) {
        const cache = localStorage.getItem('cached_questions');
        if (cache) {
            allQuestions = JSON.parse(cache);
            console.log("Mode Hors-Ligne : Questions chargées depuis la mémoire.");
            displayComments(); // Affichera les anciens
            return;
        }
    }
    await oldLoadData();
    cacheQuestions(); // Sauvegarde pour la prochaine fois
};
// --- BLOC : RÉACTIVATION DU PSEUDO ---
function forceLogin() {
    const pseudoStored = localStorage.getItem('quiz_pseudo');
    if (!pseudoStored || pseudoStored === "") {
        document.getElementById('login-screen').style.display = 'flex';
    } else {
        currentUser = pseudoStored;
        document.getElementById('login-screen').style.display = 'none';
    }
}

// On force l'appel au démarrage
setTimeout(forceLogin, 500); 

// On écrase la fonction de sauvegarde pour être sûr
window.saveUser = function() {
    const p = document.getElementById('user-pseudo').value.trim();
    if(p.length < 2) {
        showNotice("⚠️ ERREUR", "Choisis un pseudo d'au moins 2 lettres.");
        return;
    }
    localStorage.setItem('quiz_pseudo', p);
    currentUser = p;
    document.getElementById('login-screen').style.display = 'none';
    showNotice("🇬🇦 BIENVENUE", `Bonne chance ${p} ! Prouve que tu connais le pays.`);
};
// --- BLOC : GÉNÉRATEUR DE CERTIFICATS ---
window.showCertificate = function(levelName, color) {
    const certModal = document.createElement('div');
    certModal.className = 'overlay-screen';
    certModal.style.zIndex = "20000";
    
    certModal.innerHTML = `
        <div style="width:90%; background:white; color:black; padding:30px; border-radius:15px; text-align:center; border:10px double ${color}; position:relative;">
            <h1 style="margin:0; color:${color};">CERTIFICAT</h1>
            <p style="font-size:1.2rem; margin:10px 0;">Félicitations à</p>
            <h2 style="text-decoration:underline; font-size:2rem; margin:10px 0;">${currentUser}</h2>
            <p>A terminé avec succès le</p>
            <h3 style="background:${color}; color:white; display:inline-block; padding:5px 15px; border-radius:5px;">${levelName}</h3>
            <p style="margin-top:20px; font-style:italic;">"La République Gabonaise te salue ! 🇬🇦"</p>
            <div style="margin-top:20px; border-top:1px solid #ccc; padding-top:10px;">
                <small>Délivré par Gabon Quiz VIP - ${new Date().toLocaleDateString()}</small>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" style="margin-top:20px; width:100%; padding:15px; background:#333; color:white; border:none; border-radius:10px; font-weight:bold;">RETOURNER AU MENU</button>
        </div>
    `;
    document.body.appendChild(certModal);
};

// Intégration à la fin du jeu
const originalFeedback = window.showFeedback;
window.showFeedback = function(isC, c, e) {
    // Si on arrive à la fin des questions de la catégorie
    if (currentIndex >= currentQuestions.length - 1 && lives > 0) {
        let vType = localStorage.getItem('vip_type');
        if (vType === '500') {
            showCertificate("EXPERT TOTAL (NIVEAU 3)", "#3A75C4"); // Bleu
        } else if (vType === '300') {
            showCertificate("CHAMPION NIVEAU 2", "#FCD116"); // Jaune
        } else {
            showCertificate("DIPLÔME NIVEAU 1", "#009E60"); // Vert
        }
    }
    if (typeof originalFeedback === "function") originalFeedback(isC, c, e);
};
// --- BLOC : EXPLOSION DE CONFETTIS GABONAIS ---
window.launchVictoryConfetti = function() {
    // Couleurs du drapeau : Vert, Jaune, Bleu
    var colors = ['#009E60', '#FCD116', '#3A75C4'];

    var end = Date.now() + (3 * 1000); // Explosion pendant 3 secondes

    (function frame() {
        confetti({
            particleCount: 3,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: colors
        });
        confetti({
            particleCount: 3,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: colors
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    }());
};

// On modifie l'affichage du certificat pour inclure l'explosion
const originalShowCertificate = window.showCertificate;
window.showCertificate = function(levelName, color) {
    if (typeof originalShowCertificate === "function") {
        originalShowCertificate(levelName, color);
        // On attend une demi-seconde pour que le certificat apparaisse, puis BOUM !
        setTimeout(launchVictoryConfetti, 500);
    }
};
// --- BLOC : INTERFACE DE NIVEAUX ET NOTIFICATIONS ---

// Fonction pour mettre à jour l'affichage du niveau en haut du jeu
window.updateLevelDisplay = function() {
    let levelTitle = "Niveau 1 : Facile";
    if (currentIndex >= 10 && currentIndex < 30) levelTitle = "Niveau 2 : Difficile";
    if (currentIndex >= 30) levelTitle = "Niveau 3 : Expert Pro";
    
    // On l'ajoute dans le header du quiz
    const header = document.querySelector('.quiz-header');
    if (header) {
        let lDiv = document.getElementById('level-indicator');
        if (!lDiv) {
            lDiv = document.createElement('div');
            lDiv.id = 'level-indicator';
            lDiv.style.color = '#FCD116';
            lDiv.style.fontWeight = 'bold';
            header.appendChild(lDiv);
        }
        lDiv.innerText = levelTitle;
    }
};

// On écrase l'affichage de la question pour intégrer le niveau
const oldShowQ = window.showQuestion;
window.showQuestion = function() {
    if (typeof oldShowQ === "function") oldShowQ();
    updateLevelDisplay();
};
// --- BLOC : PROGRESSION AUTOMATIQUE ET CERTIFICATS ---

window.checkLevelProgression = function() {
    let vType = localStorage.getItem('vip_type');

    // FIN NIVEAU 1 (10 questions)
    if (!vType && currentIndex === 10) {
        showCertificate("DIPLÔME NIVEAU 1", "#009E60"); // On donne le certificat d'abord
        setTimeout(() => {
            showNotice("🔒 NIVEAU 2 DÉBLOQUÉ", "Félicitations ! Pour accéder au Niveau 2 (20+ questions), le ticket est de 300F.");
            showShop(); // Direction la boutique automatiquement
        }, 4000);
        return true;
    }

    // FIN NIVEAU 2 (30 questions au total : 10+20)
    if (vType === '300' && currentIndex === 30) {
        showCertificate("CHAMPION NIVEAU 2", "#FCD116");
        showNotice("🏆 CAP VERS LE NIVEAU 3", "Tu es un chef ! Le Niveau 3 (Expert Pro) est maintenant ouvert.");
        return false; // On laisse continuer vers le niveau 3
    }

    // FIN NIVEAU 3 (Toutes les questions)
    if (currentIndex >= currentQuestions.length - 1) {
        showCertificate("EXPERT TOTAL GABONAIS", "#3A75C4");
        return true;
    }
    return false;
};
// --- BLOC : REDIRECTION POST-PAIEMENT ---

window.checkVipCode = function() {
    const val = document.getElementById('vip-code-input').value.toUpperCase().trim();
    let unlocked = false;
    let targetCat = "";

    if (val === "GAB300") { unlocked = true; targetCat = "Provinces"; localStorage.setItem('vip_type', '300'); }
    else if (val === "AFR300") { unlocked = true; targetCat = "Afrique"; localStorage.setItem('vip_type', '300'); }
    else if (val === "MON300") { unlocked = true; targetCat = "Monde"; localStorage.setItem('vip_type', '300'); }
    else if (val === "VIP500" || val === "GABON2024") { unlocked = true; localStorage.setItem('vip_type', '500'); }

    if (unlocked) {
        localStorage.setItem('isVip', 'true');
        showNotice("✅ CODE VALIDÉ", "Chargement de vos questions VIP...");
        
        setTimeout(() => {
            document.getElementById('shop-screen').style.display = 'none';
            // Si c'est un pack spécifique, on lance la catégorie, sinon on retourne au menu pour choisir
            if (targetCat !== "") {
                startQuiz(targetCat);
            } else {
                location.reload();
            }
        }, 2000);
    } else {
        showNotice("❌ ERREUR", "Code invalide. Réessayez.");
    }
};
// --- BLOC : PERSISTENCE ET HISTORIQUE ---

// Sauvegarde l'ID des questions déjà répondues pour ne plus les montrer
window.saveProgress = function(questionId) {
    let answered = JSON.parse(localStorage.getItem('answered_questions') || "[]");
    if (!answered.includes(questionId)) {
        answered.push(questionId);
        localStorage.setItem('answered_questions', JSON.stringify(answered));
    }
};

// Charge les questions en filtrant celles déjà réussies
window.getNewQuestions = function(category) {
    let answered = JSON.parse(localStorage.getItem('answered_questions') || "[]");
    // On filtre pour ne garder que les questions de la catégorie PAS ENCORE répondues
    let freshQuestions = allQuestions.filter(q => 
        q.category.toLowerCase() === category.toLowerCase() && 
        !answered.includes(q.id)
    );

    // Si on a tout fini, on vide l'historique pour recommencer ou on informe
    if (freshQuestions.length === 0) {
        localStorage.removeItem('answered_questions');
        return allQuestions.filter(q => q.category.toLowerCase() === category.toLowerCase());
    }
    return freshQuestions.sort(() => 0.5 - Math.random());
};
// --- BLOC : CERTIFICAT MOBILE ET REDIRECTION ---

window.showCertificate = function(levelName, color) {
    const certModal = document.createElement('div');
    certModal.className = 'overlay-screen';
    certModal.style.zIndex = "30000";
    
    certModal.innerHTML = `
        <div style="width:85%; max-width:320px; background:#fff; color:#000; padding:20px; border-radius:10px; text-align:center; border:5px solid ${color}; box-shadow: 0 0 20px rgba(0,0,0,0.5);">
            <h2 style="margin:0; color:${color}; font-size:1.5rem;">DIPLÔME</h2>
            <p style="margin:5px 0;">Félicitations</p>
            <h3 style="margin:5px 0; font-size:1.4rem;">${currentUser}</h3>
            <p style="font-size:0.9rem;">Tu as validé le</p>
            <div style="background:${color}; color:#fff; padding:5px; border-radius:5px; font-weight:bold; margin:10px 0;">${levelName}</div>
            <p style="font-style:italic; font-size:0.8rem;">"L'Union fait la Force 🇬🇦"</p>
            <button id="btn-next-step" style="margin-top:15px; width:100%; padding:12px; background:#222; color:#fff; border:none; border-radius:8px; font-weight:bold; cursor:pointer;">CONTINUER L'AVENTURE</button>
        </div>
    `;
    document.body.appendChild(certModal);

    // LOGIQUE DE REDIRECTION SUR LE BOUTON
    document.getElementById('btn-next-step').onclick = function() {
        certModal.remove();
        let vType = localStorage.getItem('vip_type');
        
        if (!vType) {
            // Fin Niveau 1 -> Direction Boutique
            showNotice("PROCHAINE ÉTAPE", "Direction la Boutique pour débloquer le Niveau 2 (300F)");
            showShop();
        } else {
            // Déjà VIP -> On relance le quiz pour les prochaines questions
            location.reload(); 
        }
    };
};
// --- BLOC : LOGIQUE DE TRANSITION DE NIVEAU ---

const originalCheckAnswer = window.checkAnswer;
window.checkAnswer = function(choice, correct, expl) {
    // On sauvegarde la progression si la réponse est juste
    if (choice === correct) {
        let qId = currentQuestions[currentIndex].id;
        saveProgress(qId);
    }
    
    // Appel de la fonction originale
    if (typeof originalCheckAnswer === "function") originalCheckAnswer(choice, correct, expl);
    
    // Vérification de la fin de niveau
    let vType = localStorage.getItem('vip_type');
    
    // Si fin Niveau 1 Gratuit
    if (!vType && currentIndex === 9) { 
        setTimeout(() => {
            showCertificate("NIVEAU 1 : INITIÉ", "#009E60");
        }, 1500);
    }
};
// --- CORRECTION DÉBLOCAGE AVIS COMPTE ---

window.submitReview = async function() {
    const feedback = document.getElementById('user-feedback').value.trim();
    const ratingScreen = document.getElementById('rating-screen');

    if (!feedback) {
        showNotice("⚠️ ATTENTION", "Dis-nous au moins un petit mot avant d'envoyer !");
        return;
    }

    // On tente l'envoi vers Supabase
    try {
        const { error } = await _supabase
            .from('comments')
            .insert([{ 
                pseudo: currentUser || "Anonyme", 
                text: feedback, 
                score: score || 0,
                type: 'review' 
            }]);

        if (error) throw error;
        
        showNotice("✅ MERCI !", "Ton avis a été bien reçu. Bon jeu !");
    } catch (err) {
        console.log("Mode local : Avis sauvegardé sur le téléphone.");
        // Secours si Supabase n'est pas prêt
        localStorage.setItem('last_review', feedback);
    }

    // FERMETURE AUTOMATIQUE DE LA FENÊTRE
    if (ratingScreen) {
        ratingScreen.style.display = 'none';
    }
    
    // On retourne au menu ou on continue
    location.reload(); 
};
// --- CORRECTION : AFFICHAGE DE L'AVIS UNIQUEMENT À LA FIN ---

// 1. On s'assure que la fenêtre est cachée au démarrage
document.addEventListener('DOMContentLoaded', () => {
    const ratingScreen = document.getElementById('rating-screen');
    if (ratingScreen) {
        ratingScreen.style.display = 'none';
    }
});

// 2. On modifie la fonction pour qu'elle ne s'active qu'après avoir joué
window.showRatingScreenIfNeeded = function() {
    // On ne demande l'avis que si le score est > 0 (donc après une partie)
    if (score > 0) {
        document.getElementById('rating-screen').style.display = 'flex';
    } else {
        console.log("Avis bloqué : Le joueur n'a pas encore fini de partie.");
    }
};

// 3. Correction du bouton "Passer" (pour être sûr qu'il ferme tout)
window.skipReview = function() {
    const ratingScreen = document.getElementById('rating-screen');
    if (ratingScreen) {
        ratingScreen.style.display = 'none';
        showNotice("INFO", "Tu pourras noter le jeu plus tard !");
    }
};
// --- SYSTÈME PRO D'AVIS (FIN DE NIVEAU UNIQUEMENT) ---

// 1. Fonction pour afficher l'avis (à appeler uniquement en fin de niveau)
window.triggerRating = function() {
    const ratingScreen = document.getElementById('rating-screen');
    if (ratingScreen) {
        ratingScreen.classList.add('active'); // On utilise la classe active du CSS
    }
};

// 2. Fonction pour envoyer l'avis et FERMER
window.submitReview = async function() {
    const feedback = document.getElementById('user-feedback').value.trim();
    const ratingScreen = document.getElementById('rating-screen');

    if (!feedback) {
        showNotice("⚠️ ATTENTION", "Donne-nous ton avis avant d'envoyer !");
        return;
    }

    // Envoi Supabase (si configuré)
    try {
        await _supabase.from('comments').insert([{ 
            pseudo: currentUser, text: feedback, score: score, type: 'review' 
        }]);
    } catch (e) { console.log("Avis sauvé localement"); }

    // FERMETURE RADICALE
    if (ratingScreen) {
        ratingScreen.classList.remove('active');
        ratingScreen.style.display = 'none'; // Double sécurité
    }
    showNotice("✅ MERCI", "Ton avis nous aide à améliorer le jeu !");
};

// 3. Fonction pour PASSER et FERMER
window.skipReview = function() {
    const ratingScreen = document.getElementById('rating-screen');
    if (ratingScreen) {
        ratingScreen.classList.remove('active');
        ratingScreen.style.display = 'none';
    }
};

// 4. Intégration à la fin du certificat
// On modifie le bouton "Continuer" du certificat pour qu'il propose l'avis
const oldShowCert = window.showCertificate;
window.showCertificate = function(level, color) {
    if (typeof oldShowCert === "function") oldShowCert(level, color);
    
    // On attend que l'utilisateur clique sur "Continuer" pour montrer l'avis
    const btnCert = document.getElementById('btn-next-step');
    if (btnCert) {
        const originalAction = btnCert.onclick;
        btnCert.onclick = function() {
            originalAction(); // Exécute la redirection (Boutique ou suite)
            setTimeout(triggerRating, 1000); // Affiche l'avis 1 sec après
        };
    }
};