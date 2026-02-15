// 1. INITIALISATION PROPRE (Indispensable pour charger les questions)
// =========================================================
// 1. CONFIGURATION, SUPABASE & VARIABLES
// =========================================================
// =========================================================
// 1. INITIALISATION & VARIABLES GLOBALES
// =========================================================
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

// =========================================================
// 2. FONCTIONS DE CHARGEMENT ET MÉMOIRE
// =========================================================
async function loadData() {
    if (!navigator.onLine) {
        const cache = localStorage.getItem('cached_questions');
        if (cache) { allQuestions = JSON.parse(cache); displayComments(); return; }
    }
    const { data } = await _supabase.from('questions').select('*');
    if (data) {
        allQuestions = data;
        localStorage.setItem('cached_questions', JSON.stringify(data));
        displayComments();
    }
}

function saveProgress(questionId) {
    let answered = JSON.parse(localStorage.getItem('answered_questions') || "[]");
    if (!answered.includes(questionId)) {
        answered.push(questionId);
        localStorage.setItem('answered_questions', JSON.stringify(answered));
    }
}

function getNewQuestions(category) {
    let answered = JSON.parse(localStorage.getItem('answered_questions') || "[]");
    let fresh = allQuestions.filter(q => q.category.toLowerCase() === category.toLowerCase() && !answered.includes(q.id));
    if (fresh.length === 0) {
        localStorage.removeItem('answered_questions');
        return allQuestions.filter(q => q.category.toLowerCase() === category.toLowerCase());
    }
    return fresh;
}

// =========================================================
// 3. LOGIQUE DU QUIZ
// =========================================================
function startQuiz(cat) {
    currentQuestions = getNewQuestions(cat);
    if(currentQuestions.length === 0) return showNotice("INFO", "Bientôt disponible !");
    currentQuestions.sort(() => 0.5 - Math.random());
    currentIndex = 0; score = 0; lives = 3;
    document.getElementById('home-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    showQuestion();
}

function showQuestion() {
    let vType = localStorage.getItem('vip_type');
    
    // Blocage Niveaux
    if (!vType && currentIndex >= 10) {
        showCertificate("NIVEAU 1 : INITIÉ", "#009E60");
        return;
    }

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
        saveProgress(currentQuestions[currentIndex].id);
    } else {
        lives--;
    }
    
    document.getElementById('explanation-text').innerHTML = `
        <b style="color:${isCorrect?'#009E60':'#ff4444'}">${isCorrect?'✅ CORRECT':'❌ ERREUR'}</b><br>${expl || ""}
    `;
    document.getElementById('feedback-area').style.display = 'block';
    
    if(lives <= 0) {
        showNotice("💔 FINI", "Plus de vies ! Réessaie.");
        location.reload();
    }
}

function nextQuestion() {
    document.getElementById('feedback-area').style.display = 'none';
    currentIndex++;
    
    let vType = localStorage.getItem('vip_type');
    if (vType === '300' && currentIndex === 20) {
        showCertificate("CHAMPION NIVEAU 2", "#FCD116");
        return;
    }
    if (currentIndex >= currentQuestions.length) {
        showCertificate("EXPERT GABONAIS", "#3A75C4");
        return;
    }
    showQuestion();
}

// =========================================================
// 4. INTERFACE ET NOTIFICATIONS
// =========================================================
function showNotice(title, message) {
    const modal = document.createElement('div');
    modal.className = 'overlay-screen';
    modal.style.zIndex = "50000";
    modal.innerHTML = `
        <div style="background:#1a1a1a; border:2px solid #FCD116; padding:25px; border-radius:20px; text-align:center; width:85%; max-width:350px; color:white;">
            <h3 style="color:#FCD116;">${title}</h3><p>${message}</p>
            <button onclick="this.parentElement.parentElement.remove()" style="background:#FCD116; color:black; border:none; padding:12px; border-radius:10px; font-weight:bold; width:100%;">D'ACCORD</button>
        </div>
    `;
    document.body.appendChild(modal);
}

window.showCertificate = function(levelName, color) {
    const certModal = document.createElement('div');
    certModal.className = 'overlay-screen';
    certModal.style.zIndex = "30000";
    certModal.innerHTML = `
        <div style="width:85%; max-width:320px; background:#fff; color:#000; padding:20px; border-radius:10px; text-align:center; border:5px solid ${color};">
            <h2 style="color:${color};">DIPLÔME</h2>
            <p>Félicitations</p><h3>${currentUser}</h3>
            <div style="background:${color}; color:#fff; padding:5px; border-radius:5px; font-weight:bold; margin:10px 0;">${levelName}</div>
            <button id="btn-next-step" style="margin-top:15px; width:100%; padding:12px; background:#222; color:#fff; border:none; border-radius:8px; font-weight:bold;">CONTINUER</button>
        </div>
    `;
    document.body.appendChild(certModal);
    launchVictoryConfetti();

    document.getElementById('btn-next-step').onclick = function() {
        certModal.remove();
        if (!localStorage.getItem('vip_type')) showShop();
        else location.reload();
    };
};

function launchVictoryConfetti() {
    var colors = ['#009E60', '#FCD116', '#3A75C4'];
    var end = Date.now() + 2000;
    (function frame() {
        confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors: colors });
        confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors: colors });
        if (Date.now() < end) requestAnimationFrame(frame);
    }());
}

// =========================================================
// 5. GESTION UTILISATEUR ET BOUTIQUE
// =========================================================
function saveUser() {
    const p = document.getElementById('user-pseudo').value.trim();
    if(p.length < 2) return showNotice("⚠️ ERREUR", "Pseudo trop court.");
    localStorage.setItem('quiz_pseudo', p);
    currentUser = p;
    document.getElementById('login-screen').style.display = 'none';
    showNotice("🇬🇦 BIENVENUE", `Bonne chance ${p} !`);
}

function showShop() {
    document.getElementById('home-screen').style.display = 'none';
    document.getElementById('shop-screen').style.display = 'block';
}

function checkVipCode() {
    const val = document.getElementById('vip-code-input').value.toUpperCase().trim();
    let type = "";
    if (["GAB300", "AFR300", "MON300"].includes(val)) type = "300";
    if (["VIP500", "GABON2024", "GAB500"].includes(val)) type = "500";

    if (type !== "") {
        localStorage.setItem('isVip', 'true');
        localStorage.setItem('vip_type', type);
        showNotice("✅ SUCCÈS", "Accès VIP activé !");
        setTimeout(() => location.reload(), 2000);
    } else showNotice("❌ ERREUR", "Code invalide.");
}

// =========================================================
// 6. COMMENTAIRES ET AVIS (SUPABASE)
// =========================================================
async function postComment() {
    const msgInput = document.getElementById('user-comment');
    const msg = msgInput.value.trim();
    if(!msg || !currentUser) return;
    const { error } = await _supabase.from('comments').insert([{ pseudo: currentUser, text: msg, score: score }]);
    if (!error) { msgInput.value = ""; displayComments(); }
}

async function displayComments() {
    const div = document.getElementById('comments-display');
    if(!div) return;
    const { data } = await _supabase.from('comments').select('*').order('id', { ascending: false }).limit(10);
    if (data) div.innerHTML = data.map(c => `<div style="border-bottom:1px solid #333; padding:5px;"><b>${c.pseudo}</b>: ${c.text}</div>`).join('');
}

// =========================================================
// 7. UTILITAIRES (TIMER, HEADER)
// =========================================================
function startTimer() {
    clearInterval(timer); let timeLeft = 15;
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

function updateLevelDisplay() {
    let title = "Niveau 1 : Facile";
    if (currentIndex >= 10) title = "Niveau 2 : Difficile";
    const header = document.querySelector('.quiz-header');
    if (header) {
        let lDiv = document.getElementById('level-indicator') || document.createElement('div');
        lDiv.id = 'level-indicator'; lDiv.innerText = title;
        header.appendChild(lDiv);
    }
}

// DÉMARRAGE
if(currentUser) document.getElementById('login-screen').style.display = 'none';
loadData();