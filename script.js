// 1. INITIALISATION PROPRE (Indispensable pour charger les questions)
// 1. INITIALISATION & VARIABLES GLOBALES
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

// 2. SYSTÈME DE NOTIFICATIONS (UI)
function showNotice(title, message) {
    const modal = document.createElement('div');
    modal.className = 'custom-modal-overlay';
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

window.showHowToPlay = () => showNotice("❓ COMMENT JOUER", "Réponds aux questions avant la fin du chrono ⏱️. Tu as 3 ❤️. Le mode gratuit s'arrête à 10 questions. Prends le Pack VIP pour débloquer tout !");
window.showInstallGuide = () => showNotice("📲 INSTALLATION", "iPhone : 'Partager' > 'Sur l'écran d'accueil'.\nAndroid : '3 points' > 'Installer'.");

// 3. CHARGEMENT ET CACHE DES DONNÉES
async function loadData() {
    if (!navigator.onLine) {
        const cache = localStorage.getItem('cached_questions');
        if (cache) {
            allQuestions = JSON.parse(cache);
            displayComments();
            return;
        }
    }
    const { data, error } = await _supabase.from('questions').select('*');
    if (data) {
        allQuestions = data;
        localStorage.setItem('cached_questions', JSON.stringify(data));
        displayComments();
    }
}

// 4. LOGIQUE DU QUIZ
function startQuiz(cat) {
    currentQuestions = allQuestions.filter(q => q.category.toLowerCase() === cat.toLowerCase());
    if(currentQuestions.length === 0) return alert("Bientôt disponible !");
    
    // Filtrer les questions déjà réussies pour la progression
    let answered = JSON.parse(localStorage.getItem('answered_questions') || "[]");
    let freshQuestions = currentQuestions.filter(q => !answered.includes(q.id));
    
    currentQuestions = freshQuestions.length > 0 ? freshQuestions : currentQuestions;
    currentQuestions.sort(() => 0.5 - Math.random());
    
    currentIndex = 0; score = 0; lives = 3;
    document.getElementById('home-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    showQuestion();
}

function showQuestion() {
    if (checkLevelProgression()) return; // Arrête si niveau bloqué

    updateHeader();
    updateLevelDisplay();
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
    if(isCorrect) {
        score++;
        let qId = currentQuestions[currentIndex].id;
        let answered = JSON.parse(localStorage.getItem('answered_questions') || "[]");
        if (!answered.includes(qId)) {
            answered.push(qId);
            localStorage.setItem('answered_questions', JSON.stringify(answered));
        }
    } else {
        lives--;
    }
    
    document.getElementById('explanation-text').innerHTML = `
        <b style="color:${isCorrect?'#009E60':'#ff4444'}">${isCorrect?'✅ CORRECT':'❌ ERREUR'}</b><br>${expl || ""}
    `;
    document.getElementById('feedback-area').style.display = 'block';
    
    if(lives <= 0) { 
        showNotice("💔 PARTIE TERMINÉE", `Ton score : ${score}`);
        setTimeout(() => location.reload(), 3000); 
    }

    // Déclenchement Certificat Niveau 1
    let vType = localStorage.getItem('vip_type');
    if (!vType && currentIndex === 9 && isCorrect) {
        setTimeout(() => showCertificate("NIVEAU 1 : INITIÉ", "#009E60"), 1000);
    }
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

// 5. GESTION DES NIVEAUX & VIP
function checkLevelProgression() {
    let vType = localStorage.getItem('vip_type');
    if (!vType && currentIndex >= 10) {
        showNotice("🔒 NIVEAU 1 TERMINÉ", "Bravo ! Pour accéder au Niveau 2, le ticket est de 300F.");
        showShop();
        return true;
    }
    return false;
}

window.checkVipCode = function() {
    const val = document.getElementById('vip-code-input').value.toUpperCase().trim();
    let type = "";
    if (val === "GAB300") type = "300";
    else if (val === "VIP500" || val === "GABON2024") type = "500";

    if (type !== "") {
        localStorage.setItem('isVip', 'true');
        localStorage.setItem('vip_type', type);
        showNotice("✅ SUCCÈS", "Accès débloqué !");
        setTimeout(() => location.reload(), 2000);
    } else {
        showNotice("❌ ERREUR", "Code invalide.");
    }
};

function showShop() {
    document.getElementById('home-screen').style.display = 'none';
    document.getElementById('shop-screen').style.display = 'block';
}

// 6. CERTIFICATS ET EFFETS
window.showCertificate = function(levelName, color) {
    const certModal = document.createElement('div');
    certModal.className = 'overlay-screen';
    certModal.style.zIndex = "30000";
    certModal.innerHTML = `
        <div style="width:85%; max-width:320px; background:#fff; color:#000; padding:20px; border-radius:10px; text-align:center; border:5px solid ${color};">
            <h2 style="color:${color};">DIPLÔME</h2>
            <h3>${currentUser}</h3>
            <div style="background:${color}; color:#fff; padding:5px; margin:10px 0;">${levelName}</div>
            <button id="btn-next-step" style="width:100%; padding:12px; background:#222; color:#fff; border:none; border-radius:8px;">CONTINUER</button>
        </div>
    `;
    document.body.appendChild(certModal);
    launchVictoryConfetti();
    document.getElementById('btn-next-step').onclick = () => location.reload();
};

window.launchVictoryConfetti = function() {
    var colors = ['#009E60', '#FCD116', '#3A75C4'];
    var end = Date.now() + 3000;
    (function frame() {
        confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors: colors });
        confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors: colors });
        if (Date.now() < end) requestAnimationFrame(frame);
    }());
};

// 7. COMMENTAIRES & SUPABASE
window.postComment = async function() {
    const msgInput = document.getElementById('user-comment');
    const msg = msgInput.value.trim();
    if(!msg || !currentUser) return;

    const { error } = await _supabase.from('comments').insert([{ pseudo: currentUser, text: msg, score: score }]);
    if (!error) { msgInput.value = ""; displayComments(); }
};

window.displayComments = async function() {
    const div = document.getElementById('comments-display');
    const { data } = await _supabase.from('comments').select('*').order('id', { ascending: false }).limit(10);
    if (data) {
        div.innerHTML = data.map(c => `<div style="border-bottom:1px solid #333; padding:5px;"><b style="color:#FCD116;">${c.pseudo}</b>: ${c.text}</div>`).join('');
    }
};

// 8. INITIALISATION AU DÉMARRAGE
window.saveUser = function() {
    const p = document.getElementById('user-pseudo').value.trim();
    if(p.length < 2) return showNotice("⚠️ ERREUR", "Pseudo trop court.");
    localStorage.setItem('quiz_pseudo', p);
    currentUser = p;
    document.getElementById('login-screen').style.display = 'none';
    showNotice("🇬🇦 BIENVENUE", `Bonne chance ${p} !`);
};

if(currentUser) document.getElementById('login-screen').style.display = 'none';
loadData();