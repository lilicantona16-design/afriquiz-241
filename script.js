// 1. INITIALISATION PROPRE (Indispensable pour charger les questions)
/* ============================================================
   1. CONFIGURATION & INITIALISATION (SUPABASE + VARIABLES)
   ============================================================ */
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
let currentLvl = parseInt(localStorage.getItem('user_game_level')) || 1;
let isMusicOn = true;

const musicMap = {
    'Provinces': 'https://cdn.pixabay.com/audio/2022/03/09/audio_c36e4f326c.mp3',
    'Afrique': 'https://cdn.pixabay.com/audio/2024/02/08/audio_1e3e7f3c1d.mp3',
    'Monde': 'https://cdn.pixabay.com/audio/2022/01/18/audio_d0a13f69d2.mp3'
};

/* ============================================================
   2. MOTEUR DE JEU (QUIZ, NIVEAUX & MÉLANGE)
   ============================================================ */

window.startQuiz = function(cat) {
    // Filtrage et Historique pour éviter les répétitions
    let history = JSON.parse(localStorage.getItem('quiz_history')) || [];
    let pool = allQuestions.filter(q => q.category.toLowerCase() === cat.toLowerCase() && !history.includes(q.id));

    if (pool.length < 5) {
        localStorage.setItem('quiz_history', JSON.stringify([])); // Reset si épuisé
        pool = allQuestions.filter(q => q.category.toLowerCase() === cat.toLowerCase());
    }

    if(pool.length === 0) return alert("Bientôt disponible !");

    // Vrai mélange (Fisher-Yates)
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    currentQuestions = pool;
    currentIndex = 0; score = 0; lives = 3;

    // Musique
    const audio = document.getElementById('bg-music');
    if (audio) {
        audio.src = musicMap[cat] || musicMap['Provinces'];
        if (isMusicOn) audio.play();
    }

    document.getElementById('home-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    showQuestion();
};

window.showQuestion = function() {
    // Calcul de la limite dynamique (Niveau 1=10, Niveau 2=20, Niveau 3=100)
    currentLvl = parseInt(localStorage.getItem('user_game_level')) || 1;
    let limit = (currentLvl === 2) ? 20 : (currentLvl === 3 ? 100 : 10);

    if (currentIndex >= limit) {
        clearInterval(timer);
        displayCertificate(currentLvl);
        return;
    }

    const q = currentQuestions[currentIndex];
    if (!q) return location.reload();

    // Mise à jour du badge de progression
    let badge = document.getElementById('lvl-badge') || document.getElementById('level-tag');
    if(badge) badge.innerText = `NIVEAU ${currentLvl} : ${currentIndex + 1} / ${limit}`;

    updateHeader();
    startTimer();
    
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

window.checkAnswer = function(choice, correct, expl) {
    clearInterval(timer);
    const isCorrect = (choice === correct);
    if(isCorrect) score++; else lives--;
    
    // Historique pour ne plus revoir la question
    let history = JSON.parse(localStorage.getItem('quiz_history')) || [];
    const q = currentQuestions[currentIndex];
    if (q && !history.includes(q.id)) {
        history.push(q.id);
        localStorage.setItem('quiz_history', JSON.stringify(history));
    }

    document.getElementById('explanation-text').innerHTML = `
        <b style="color:${isCorrect?'#009E60':'#ff4444'}">${isCorrect?'✅ CORRECT':'❌ ERREUR'}</b><br>
        ${expl || ""}
    `;
    document.getElementById('feedback-area').style.display = 'block';
    
    if(lives <= 0) { 
        alert("💔 Plus de vies ! Score : " + score); 
        location.reload(); 
    }
};

window.nextQuestion = function() {
    document.getElementById('feedback-area').style.display = 'none';
    currentIndex++;
    showQuestion();
};

/* ============================================================
   3. CERTIFICATS & PROGRESSION
   ============================================================ */

function displayCertificate(lvl) {
    const cert = document.getElementById('certificate-container');
    if(!cert) return alert("Niveau " + lvl + " validé !");
    document.getElementById('cert-name').innerText = currentUser || "Champion";
    document.getElementById('cert-level').innerText = "NIVEAU " + lvl + " VALIDÉ";
    document.getElementById('cert-cat').innerText = currentQuestions[0]?.category || "Quiz";
    cert.style.display = 'block';
}

window.closeCertAndNext = function() {
    document.getElementById('certificate-container').style.display = 'none';
    if (currentLvl === 1) {
        showNote("Félicitations ! Débloque le Niveau 2 pour continuer.");
        showShop();
    } else if (currentLvl === 2) {
        localStorage.setItem('user_game_level', 3);
        showNote("Niveau 3 débloqué !");
        location.reload();
    } else {
        location.reload();
    }
};

/* ============================================================
   4. MANUEL D'ÉTUDE (300 QUESTIONS)
   ============================================================ */

window.showStudyMode = async function() {
    document.getElementById('home-screen').style.display = 'none';
    document.getElementById('study-screen').style.display = 'block';
    const list = document.getElementById('study-list');
    list.innerHTML = "Chargement du manuel...";

    const { data } = await _supabase.from('questions').select('*').limit(300);
    if (data) {
        list.innerHTML = data.map((q, i) => {
            const locked = (i >= 50 && !isVip); 
            return `
                <div class="manual-q ${locked ? 'manual-locked' : ''}">
                    <b>${i + 1}. ${locked ? "CONTENU VIP BLOQUÉ" : q.question}</b><br>
                    <span style="color:#FCD116;">${locked ? "Payez 500F pour débloquer" : "R: " + q.correct_answer}</span>
                </div>
            `;
        }).join('');
    }
};

/* ============================================================
   5. BOUTIQUE, CODES & VIP
   ============================================================ */

window.checkVipCode = function() {
    const code = document.getElementById('vip-code-input').value.toUpperCase().trim();
    let success = false;

    if (["GAB300", "AFR300", "MON300"].includes(code)) {
        localStorage.setItem('user_game_level', 2);
        success = true;
    } else if (["VIP500", "GABON2024"].includes(code)) {
        localStorage.setItem('isVip', 'true');
        localStorage.setItem('user_game_level', 2);
        success = true;
    }

    if (success) {
        showNote("✅ CODE VALIDE !");
        setTimeout(() => { location.reload(); }, 1500);
    } else {
        showNote("❌ Code invalide.");
    }
};

function showShop() {
    document.getElementById('home-screen').style.display = 'none';
    document.getElementById('shop-screen').style.display = 'block';
}

/* ============================================================
   6. SUPABASE : COMMENTAIRES & ÉTOILES
   ============================================================ */

async function postComment() {
    const msg = document.getElementById('user-comment').value.trim();
    if(!msg || !currentUser) return showNote("Écris un message !");
    const { error } = await _supabase.from('comments').insert([{ pseudo: currentUser, text: msg, score: score }]);
    if(!error) {
        document.getElementById('user-comment').value = "";
        showNote("Avis publié !");
        loadGlobalComments();
    }
}

async function loadGlobalComments() {
    const { data } = await _supabase.from('comments').select('*').order('id', { ascending: false }).limit(15);
    if (data) {
        const div = document.getElementById('comments-display');
        div.innerHTML = data.map(c => `<div><b>${c.pseudo}</b>: ${c.text} <small>(${c.score} pts)</small></div>`).join('');
    }
}

/* ============================================================
   7. UTILITAIRES (TIMER, PSEUDO, AUDIO)
   ============================================================ */

function startTimer() {
    clearInterval(timer);
    let timeLeft = 15;
    document.getElementById('timer-text').innerText = `⏱️ ${timeLeft}s`;
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

function showNote(msg) {
    const box = document.getElementById('game-alert');
    if(box) {
        box.innerText = msg; box.style.display = 'block';
        setTimeout(() => { box.style.display = 'none'; }, 3000);
    } else { alert(msg); }
}

window.saveUser = function() {
    const p = document.getElementById('user-pseudo').value.trim();
    if(p.length < 2) return;
    localStorage.setItem('quiz_pseudo', p);
    currentUser = p;
    document.getElementById('login-screen').style.display = 'none';
};

function toggleMusic() {
    const audio = document.getElementById('bg-music');
    isMusicOn = !isMusicOn;
    if(isMusicOn) audio.play(); else audio.pause();
    document.getElementById('music-btn').innerText = isMusicOn ? "🔊 Musique : ON" : "🔈 Musique : OFF";
}

// Initialisation au chargement
async function loadData() {
    const { data } = await _supabase.from('questions').select('*');
    if (data) allQuestions = data;
    loadGlobalComments();
}

if(currentUser) document.getElementById('login-screen').style.display = 'none';
loadData();