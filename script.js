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