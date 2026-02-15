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
// --- GESTION MÉMOIRE ET PROGRESSION ---
function validerInscription() {
    const p = document.getElementById('user-pseudo-input').value.trim();
    if(p.length < 2) { 
        customAlert("Erreur", "Pseudo trop court !"); 
        return; 
    }
    localStorage.setItem('quiz_pseudo', p);
    currentUser = p;
    document.getElementById('login-screen').style.display = 'none';
    customAlert("Bienvenue", "Bonne chance " + p + " !");
}

function checkUserStatus() {
    if(!localStorage.getItem('quiz_pseudo')) {
        document.getElementById('login-screen').style.display = 'flex';
    }
}

// --- NOTIFICATIONS INTERNES (PAS DE NAVIGATEUR) ---
function customAlert(title, message) {
    document.getElementById('notice-title').innerText = title;
    document.getElementById('notice-text').innerHTML = message;
    document.getElementById('custom-notice').style.display = 'flex';
}

function closeNotice() {
    document.getElementById('custom-notice').style.display = 'none';
}

// --- SYSTÈME DE FILTRE POUR NE JAMAIS RÉPÉTER ---
function getSmartQuestions(cat) {
    let history = JSON.parse(localStorage.getItem('quiz_history') || "[]");
    // Filtre : même catégorie ET ID non présent dans l'historique
    let available = allQuestions.filter(q => q.category.toLowerCase() === cat.toLowerCase() && !history.includes(q.id));
    
    if(available.length === 0) {
        localStorage.removeItem('quiz_history'); // On recommence si tout est fini
        return allQuestions.filter(q => q.category.toLowerCase() === cat.toLowerCase());
    }
    return available;
}

// --- LOGIQUE DE NIVEAUX 1, 2, 3 ---
function checkLevelTransition() {
    let vType = localStorage.getItem('vip_type');
    
    // FIN NIVEAU 1 (Gratuit - 10 questions)
    if (!vType && currentIndex === 10) {
        showProCertificate("NIVEAU 1 : INITIÉ", "#009E60", "passerAuPaiement");
        return true;
    }
    // FIN NIVEAU 2 (VIP 300 - 30 questions)
    if (vType === '300' && currentIndex === 30) {
        showProCertificate("NIVEAU 2 : CHAMPION", "#FCD116", "rechargerNiveau3");
        return true;
    }
    // FIN NIVEAU 3 (Expert - Toutes les questions)
    if (currentIndex >= currentQuestions.length) {
        showProCertificate("NIVEAU 3 : EXPERT PRO", "#3A75C4", "retourMenu");
        return true;
    }
    return false;
}

function showProCertificate(titre, couleur, action) {
    clearInterval(timer);
    const modal = document.createElement('div');
    modal.className = "overlay-screen";
    modal.style.zIndex = "100001";
    modal.innerHTML = `
        <div class="certificat-container" style="border-color:${couleur}">
            <h1 style="color:${couleur}">DIPLÔME</h1>
            <p>Félicitations à <b>${currentUser}</b></p>
            <div style="background:${couleur}; color:white; padding:10px; margin:10px 0; border-radius:8px;">${titre}</div>
            <p style="font-size:12px">Validé le ${new Date().toLocaleDateString()}</p>
            <button onclick="${action}()" class="main-btn" style="width:100%; margin-top:10px;">CONTINUER</button>
        </div>
    `;
    document.body.appendChild(modal);
    if(typeof confetti === 'function') confetti();
}

// ACTIONS APRÈS CERTIFICAT
function passerAuPaiement() {
    location.reload(); // Pour revenir au menu et forcer le passage boutique
    setTimeout(() => { showShop(); }, 500);
}

// --- OVERRIDE DES FONCTIONS EXISTANTES POUR INTÉGRER LA MÉMOIRE ---
const originalCheck = window.checkAnswer;
window.checkAnswer = function(c, cor, e) {
    if(c === cor) {
        let history = JSON.parse(localStorage.getItem('quiz_history') || "[]");
        history.push(currentQuestions[currentIndex].id);
        localStorage.setItem('quiz_history', JSON.stringify(history));
    }
    if(typeof originalCheck === "function") originalCheck(c, cor, e);
};

// --- MODE HORS-LIGNE ---
window.addEventListener('online',  loadData);
window.addEventListener('offline', () => customAlert("Mode Offline", "Tu joues sur la mémoire locale du téléphone."));

// LANCEMENT
setTimeout(checkUserStatus, 1000);