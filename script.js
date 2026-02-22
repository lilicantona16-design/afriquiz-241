// 1. INITIALISATION PROPRE (Indispensable pour charger les questions)
// 1. CONFIGURATION & VARIABLES GLOBALES
const SUPABASE_URL = 'https://cjxbsrudyqumeuvedozo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqeGJzcnVkeXF1bWV1dmVkb3pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMzkwNzcsImV4cCI6MjA4NTgxNTA3N30.GTK9BWO87eCf3IAf_8OTy4T59nFl8-vjnWDMApUOHAo';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let allQuestions = [];
let currentQuestions = [];
let currentIndex = 0;
let score = 0;
let lives = 3;
let timer;
let currentActiveCat = "Provinces";
let currentUser = localStorage.getItem('quiz_pseudo') || "";
let isMusicOn = true;

// 2. CHARGEMENT INITIAL
async function loadData() {
    const { data, error } = await _supabase.from('questions').select('*');
    if (data) allQuestions = data;
    loadGlobalComments();
}

// 3. MOTEUR DE JEU (START & SHOW)
window.startQuiz = function(cat) {
    currentActiveCat = cat;
    let catLevel = parseInt(localStorage.getItem('level_' + cat)) || 1;
    
    // Filtrage et Mélange (Anti-répétition)
    let pool = allQuestions.filter(q => q.category.toLowerCase() === cat.toLowerCase());
    if(pool.length === 0) return alert("Bientôt disponible !");
    
    pool.sort(() => Math.random() - 0.5);
    currentQuestions = pool;
    currentIndex = 0; score = 0; lives = 3;

    // Musique
    const audio = document.getElementById('bg-music');
    if(audio && isMusicOn) {
        audio.src = (cat === 'Afrique') ? 'https://cdn.pixabay.com/audio/2024/02/08/audio_1e3e7f3c1d.mp3' : 'https://cdn.pixabay.com/audio/2022/03/09/audio_c36e4f326c.mp3';
        audio.play().catch(e => console.log("Audio bloqué"));
    }

    document.getElementById('home-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    showQuestion();
};

window.showQuestion = function() {
    let catLevel = parseInt(localStorage.getItem('level_' + currentActiveCat)) || 1;
    let limit = (catLevel === 1) ? 10 : (catLevel === 2 ? 20 : 50);

    // FIN DE NIVEAU -> CERTIFICAT
    if (currentIndex >= limit) {
        clearInterval(timer);
        displayCertificate(catLevel);
        return;
    }

    const q = currentQuestions[currentIndex];
    if(!q) return;

    // Mise à jour interface
    updateHeader();
    startTimer();
    
    let badge = document.getElementById('lvl-badge');
    if(badge) badge.innerText = `${currentActiveCat.toUpperCase()} - NIVEAU ${catLevel} : ${currentIndex + 1}/${limit}`;

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
};

// 4. LOGIQUE DES RÉPONSES
window.checkAnswer = function(choice, correct, expl) {
    clearInterval(timer);
    const isCorrect = (choice === correct);
    if(isCorrect) score++; else lives--;
    
    document.getElementById('explanation-text').innerHTML = `
        <b style="color:${isCorrect?'#009E60':'#ff4444'}">${isCorrect?'✅ CORRECT':'❌ ERREUR'}</b><br>${expl || ""}
    `;
    document.getElementById('feedback-area').style.display = 'block';
    if(lives <= 0) { alert("💔 Plus de vies !"); location.reload(); }
};

window.nextQuestion = function() {
    document.getElementById('feedback-area').style.display = 'none';
    currentIndex++;
    showQuestion();
};

// 5. BOUTIQUE ET CODES
window.checkVipCode = function() {
    const code = document.getElementById('vip-code-input').value.toUpperCase().trim();
    const selectedCat = document.getElementById('shop-category-select') ? document.getElementById('shop-category-select').value : currentActiveCat;

    if (code === "GAB300") {
        localStorage.setItem('level_' + selectedCat, 2);
        alert("✅ Niveau 2 débloqué pour " + selectedCat);
        location.reload();
    } else if (code === "VIP500" || code === "GABON2024") {
        localStorage.setItem('level_Provinces', 3);
        localStorage.setItem('level_Afrique', 3);
        localStorage.setItem('level_Monde', 3);
        localStorage.setItem('isVip', 'true');
        alert("💎 ACCÈS TOTAL DÉBLOQUÉ !");
        location.reload();
    } else {
        alert("Code invalide");
    }
};

// 6. UTILITAIRES (Timer, Header, Certificat)
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

function displayCertificate(lvl) {
    const cert = document.getElementById('certificate-container');
    document.getElementById('cert-name').innerText = currentUser || "Champion";
    document.getElementById('cert-level').innerText = "NIVEAU " + lvl + " VALIDÉ";
    cert.style.display = 'block';
}

window.closeCertAndNext = function() {
    document.getElementById('certificate-container').style.display = 'none';
    location.reload();
};

// Initialisation
if(currentUser) document.getElementById('login-screen').style.display = 'none';
loadData();