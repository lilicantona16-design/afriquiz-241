// 1. INITIALISATION PROPRE (Indispensable pour charger les questions)
/* ============================================================
   1. INITIALISATION & CONFIGURATION (SUPABASE + ETAT)
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
   2. FONCTIONS DE NAVIGATION ET D'INFO (BOUTONS HTML)
   ============================================================ */
window.showHowToPlay = function() {
    alert("🎮 RÈGLES DU JEU :\n\n- Réponds en 15s ⏱️\n- Tu as 3 vies ❤️\n- Niveau 1 (Gratuit) : 10 questions.\n- Niveau 2 (300F) : Jusqu'à 20 questions.\n- Pack VIP (500F) : Manuel complet + Accès total.");
};

window.showInstallGuide = function() {
    alert("📲 INSTALLER SUR MOBILE :\n\n- Android : Menu (3 points) > 'Installer'.\n- iPhone : Bouton 'Partager' > 'Sur l'écran d'accueil'.");
};

window.shareGame = function() {
    const text = "Prouve que tu es un vrai Gabonais 🇬🇦 ! Joue ici : " + window.location.href;
    window.open("https://wa.me/?text=" + encodeURIComponent(text));
};

function showNote(msg) {
    const box = document.getElementById('game-alert');
    if(box) {
        box.innerText = msg; box.style.display = 'block';
        setTimeout(() => { box.style.display = 'none'; }, 3000);
    } else { alert(msg); }
}

/* ============================================================
   3. MOTEUR DE JEU (QUIZ & LOGIQUE DE NIVEAUX)
   ============================================================ */
window.startQuiz = function(cat) {
    // Filtrage des questions par catégorie
    let pool = allQuestions.filter(q => q.category.toLowerCase() === cat.toLowerCase());
    
    if(pool.length === 0) return alert("Questions en cours de chargement, réessaie dans 2 secondes.");

    // Mélange des questions (Fisher-Yates)
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
        if (isMusicOn) audio.play().catch(e => console.log("Audio bloqué par le navigateur"));
    }

    document.getElementById('home-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    showQuestion();
};

window.showQuestion = function() {
    // LOGIQUE DE BLOCAGE PAR NIVEAU
    currentLvl = parseInt(localStorage.getItem('user_game_level')) || 1;
    let limit = 10; // Par défaut Niveau 1
    if (currentLvl === 2) limit = 20;
    if (currentLvl === 3) limit = 300;

    if (currentIndex >= limit) {
        clearInterval(timer);
        displayCertificate(currentLvl);
        return;
    }

    const q = currentQuestions[currentIndex];
    if (!q) {
        showNote("Félicitations ! Tu as fini toutes les questions.");
        location.reload();
        return;
    }

    // Mise à jour de l'interface
    const badge = document.getElementById('lvl-badge');
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
    
    document.getElementById('explanation-text').innerHTML = `
        <b style="color:${isCorrect?'#009E60':'#ff4444'}">${isCorrect?'✅ CORRECT':'❌ ERREUR'}</b><br>
        ${expl || ""}
    `;
    document.getElementById('feedback-area').style.display = 'block';
    
    if(lives <= 0) { 
        alert("💔 Plus de vies ! Ton score : " + score); 
        location.reload(); 
    }
};

window.nextQuestion = function() {
    document.getElementById('feedback-area').style.display = 'none';
    currentIndex++;
    showQuestion();
};

/* ============================================================
   4. VIP, BOUTIQUE ET CERTIFICATS
   ============================================================ */
window.checkVipCode = function() {
    const code = document.getElementById('vip-code-input').value.toUpperCase().trim();
    let success = false;

    // Codes Niveau 2 (300F)
    if (["GAB300", "AFR300", "MON300"].includes(code)) {
        localStorage.setItem('user_game_level', 2);
        success = true;
    } 
    // Codes VIP Complet (500F)
    else if (["VIP500", "GABON2024"].includes(code)) {
        localStorage.setItem('isVip', 'true');
        localStorage.setItem('user_game_level', 2);
        success = true;
    }

    if (success) {
        showNote("✅ CODE VALIDE ! Nouveau niveau débloqué.");
        setTimeout(() => { location.reload(); }, 1500);
    } else {
        showNote("❌ Code incorrect.");
    }
};

function displayCertificate(lvl) {
    const cert = document.getElementById('certificate-container');
    document.getElementById('cert-name').innerText = currentUser || "Champion";
    document.getElementById('cert-level').innerText = "NIVEAU " + lvl + " VALIDÉ";
    document.getElementById('cert-cat').innerText = currentQuestions[0]?.category || "Général";
    cert.style.display = 'block';
}

window.closeCertAndNext = function() {
    document.getElementById('certificate-container').style.display = 'none';
    if (currentLvl === 1) {
        showShop();
    } else if (currentLvl === 2) {
        localStorage.setItem('user_game_level', 3);
        location.reload();
    } else {
        location.reload();
    }
};

window.showShop = function() {
    document.getElementById('home-screen').style.display = 'none';
    document.getElementById('shop-screen').style.display = 'block';
};

/* ============================================================
   5. MANUEL D'ÉTUDE (LOGIQUE VIP)
   ============================================================ */
window.showStudyMode = async function() {
    document.getElementById('home-screen').style.display = 'none';
    document.getElementById('study-screen').style.display = 'block';
    const list = document.getElementById('study-list');
    list.innerHTML = "<p style='color:white;text-align:center;'>Chargement des données...</p>";

    const { data } = await _supabase.from('questions').select('*').limit(300);
    if (data) {
        list.innerHTML = data.map((q, i) => {
            const locked = (i >= 50 && !isVip); 
            return `
                <div class="manual-q ${locked ? 'manual-locked' : ''}" style="margin-bottom:15px; border-bottom:1px solid #333; padding-bottom:10px;">
                    <b style="color:white;">${i + 1}. ${locked ? "CONTENU VIP" : q.question}</b><br>
                    <span style="color:#FCD116;">${locked ? "Payez 500F pour débloquer" : "R: " + q.correct_answer}</span>
                </div>
            `;
        }).join('');
    }
};

/* ============================================================
   6. SYSTÈME (COMMENTAIRES, PSEUDO, AUDIO, TIMER)
   ============================================================ */
async function postComment() {
    const msg = document.getElementById('user-comment').value.trim();
    if(!msg || !currentUser) return;
    const { error } = await _supabase.from('comments').insert([{ pseudo: currentUser, text: msg, score: score }]);
    if(!error) {
        document.getElementById('user-comment').value = "";
        loadGlobalComments();
    }
}

async function loadGlobalComments() {
    const { data } = await _supabase.from('comments').select('*').order('id', { ascending: false }).limit(10);
    if (data) {
        const div = document.getElementById('comments-display');
        div.innerHTML = data.map(c => `<div style="margin-bottom:5px;"><b>${c.pseudo}</b>: ${c.text}</div>`).join('');
    }
}

function startTimer() {
    clearInterval(timer);
    let timeLeft = 15;
    const bar = document.getElementById('timer-bar');
    if(bar) bar.style.width = "100%";
    
    timer = setInterval(() => {
        timeLeft--;
        document.getElementById('timer-text').innerText = `⏱️ ${timeLeft}s`;
        if(bar) bar.style.width = (timeLeft / 15 * 100) + "%";
        if(timeLeft <= 0) { clearInterval(timer); lives--; nextQuestion(); }
    }, 1000);
}

function updateHeader() {
    let h = ""; for(let i=0; i<3; i++) h += (i < lives) ? "❤️" : "🖤";
    document.getElementById('score-display').innerHTML = `Score: ${score} | ${h}`;
}

window.saveUser = function() {
    const p = document.getElementById('user-pseudo').value.trim();
    if(p.length < 2) return alert("Pseudo trop court");
    localStorage.setItem('quiz_pseudo', p);
    currentUser = p;
    document.getElementById('login-screen').style.display = 'none';
};

window.toggleMusic = function() {
    const audio = document.getElementById('bg-music');
    isMusicOn = !isMusicOn;
    if(audio) {
        if(isMusicOn) audio.play().catch(e => {}); 
        else audio.pause();
    }
    document.getElementById('music-btn').innerText = isMusicOn ? "🔊 Musique : ON" : "🔈 Musique : OFF";
};

async function loadData() {
    const { data, error } = await _supabase.from('questions').select('*');
    if (data) allQuestions = data;
    loadGlobalComments();
}

// Lancement au démarrage
if(currentUser) document.getElementById('login-screen').style.display = 'none';
loadData();