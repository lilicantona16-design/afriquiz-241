// 1. INITIALISATION PROPRE (Indispensable pour charger les questions)
/* ============================================================
   1. CONFIGURATION & ÉTAT INITIAL
   ============================================================ */
const SUPABASE_URL = 'https://cjxbsrudyqumeuvedozo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqeGJzcnVkeXF1bWV1dmVkb3pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMzkwNzcsImV4cCI6MjA4NTgxNTA3N30.GTK9BWO87eCf3IAf_8OTy4T59nFl8-vjnWDMApUOHAo'
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let allQuestions = [];
let currentQuestions = [];
let currentIndex = 0;
let score = 0;
let lives = 3;
let timer;
let isMusicOn = true;
let currentUser = localStorage.getItem('quiz_pseudo') || "";
function cleanText(text) {
    if (!text) return "";
    return text
        .replace(/\ufffd/g, 'é')      // Remplace le losange par 'é'
        .replace(/\u00e9/g, 'é')      // Assure que les 'é' sont corrects
        .replace(/â€TM/g, "'")       // Corrige les apostrophes Word
        .replace(/â€/g, '"');         // Corrige les guillemets Word
}
const musicMap = {
    'Provinces': 'https://cdn.pixabay.com/audio/2022/03/09/audio_c36e4f326c.mp3',
    'Afrique': 'https://cdn.pixabay.com/audio/2024/02/08/audio_1e3e7f3c1d.mp3',
    'Monde': 'https://cdn.pixabay.com/audio/2022/01/18/audio_d0a13f69d2.mp3'
};

/* ============================================================
   2. FONCTIONS SOCIALES & INFOS
   ============================================================ */
window.showHowToPlay = function() {
    const m = document.getElementById('info-modal');
    document.getElementById('info-title').innerText = "❓ COMMENT JOUER";
    document.getElementById('info-body').innerHTML = "• Réponds avant la fin du chrono ⏱️<br>• Tu as 3 vies ❤️<br>• Niveau 1 : 10 questions (Gratuit)<br>• Niveau 2 : 20 questions (Payant)<br>• Niveau 3 : 30 questions (Payant)";
    m.style.setProperty('display', 'flex', 'important');
    m.style.setProperty('display', 'flex', 'important');
};

window.showInstallGuide = function() {
    const m = document.getElementById('info-modal');
    document.getElementById('info-title').innerText = "📲 INSTALLATION";
    document.getElementById('info-body').innerHTML = "<b>Android :</b> Menu ⋮ > 'Installer l'appli'<br><br><b>iPhone :</b> Partager ⎋ > 'Sur l'écran d'accueil'";
    m.style.setProperty('display', 'flex', 'important');
};
window.shareGame = function() {
    const text = "Prouve que tu es un vrai Gabonais 🇬🇦 ! Joue ici : " + window.location.href;
    window.open("https://wa.me/?text=" + encodeURIComponent(text));
};

function showNote(msg) {
    const box = document.getElementById('game-alert');
    if(box) {
        box.innerText = msg; box.style.display = 'block';
        setTimeout(() => box.style.display = 'none', 3000);
    } else alert(msg);
}

/* ============================================================
   3. MOTEUR DE JEU (LOGIQUE DE PAIEMENT PAR CATÉGORIE)
   ============================================================ */
window.startQuiz = function(cat) {
    window.currentPlayingCat = cat;
    let storageKey = 'level_' + cat;
    let categoryLevel = parseInt(localStorage.getItem(storageKey)) || 1;
    
    // Filtrage questions gratuites de la catégorie
    let pool = allQuestions.filter(q => q.category.toLowerCase() === cat.toLowerCase());
    
    // Ajout des questions VIP si payé pour CETTE catégorie
    if (categoryLevel >= 2) {
        let vipQuestions = allQuestions.filter(q => q.category.toUpperCase() === 'VIP');
        pool = pool.concat(vipQuestions); 
    }

    if(pool.length === 0) return alert("Chargement des questions...");

    pool.sort(() => Math.random() - 0.5);
    // On définit la limite selon le niveau actuel
let limit = (categoryLevel >= 3) ? 30 : (categoryLevel === 2 ? 20 : 10);
// On ne prend que le nombre de questions autorisé
currentQuestions = pool.slice(0, limit);
   
    currentIndex = 0; score = 0; lives = 3;

    // Musique
    const audio = document.getElementById('bg-music');
    if (audio && isMusicOn) {
        audio.src = musicMap[cat] || musicMap['Provinces'];
        audio.play().catch(() => {});
    }

    document.getElementById('home-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    showQuestion();
};

window.showQuestion = function() {
    let storageKey = 'level_' + window.currentPlayingCat;
let categoryLevel = parseInt(localStorage.getItem(storageKey)) || 1;

let limit = 10; // au 1
if (categoryLevel === 2) limit = 20; // Niveau 2
if (categoryLevel >= 3) limit = 30; // Niveau 3 (EXTRÊME)
    if (currentIndex >= limit) {
        clearInterval(timer);
        displayCertificate(categoryLevel);
        return;
    }

    const q = currentQuestions[currentIndex];
    if (!q) return location.reload();

    document.getElementById('lvl-badge').innerText = `${window.currentPlayingCat.toUpperCase()} - NIVEAU ${categoryLevel} : ${currentIndex + 1}/${limit}`;
    
    document.getElementById('question-text').innerText = cleanText(q.question);
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
    localStorage.setItem('totalScore_' + currentUser, (parseInt(localStorage.getItem('totalScore_' + currentUser)) || 0) + 1);

    
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

/* ============================================================
   4. BOUTIQUE & CODES VIP (PAR CATÉGORIE)
   ============================================================ */
window.showShop = function() {
    document.getElementById('home-screen').style.display = 'none';
    document.getElementById('shop-screen').style.display = 'block';
};

window.checkVipCode = function() {
    const code = document.getElementById('vip-code-input').value.toUpperCase().trim();
    let note = "";

    if (code === "GAB300") {
        localStorage.setItem('level_Provinces', 2);
        note = "✅ GABON NIVEAU 2 DÉBLOQUÉ (Prix: 300F)";
    } else if (code === "AFR300") {
        localStorage.setItem('level_Afrique', 2);
        note = "✅ AFRIQUE NIVEAU 2 DÉBLOQUÉ (Prix: 300F)";
    } else if (code === "MON300") {
        localStorage.setItem('level_Monde', 2);
        note = "✅ MONDE NIVEAU 2 DÉBLOQUÉ (Prix: 300F)";
    } else if (code === "EXTREME500") {
        localStorage.setItem('level_' + window.currentPlayingCat, 3);
        note = "🔥 NIVEAU 3 EXTRÊME ACTIVÉ (Prix: 500F)";
    } else if (code === "VIP500") {
        localStorage.setItem('isVip', 'true');
        localStorage.setItem('level_Provinces', 2);
        localStorage.setItem('level_Afrique', 2);
        localStorage.setItem('level_Monde', 2);
        note = "👑 PACK GLOBAL VIP ACTIVÉ (Prix: 500F)";
    } else {
        return showNote("❌ Code invalide. Payez 300F (Niv 2) ou 500F (Niv 3/VIP)");
    }

    showNote(note);
    setTimeout(() => { location.reload(); }, 2000);
};
/* ============================================================
   5. MANUEL D'ÉTUDE & CERTIFICATS
   ============================================================ */
window.showStudyMode = async function() {
    document.getElementById('home-screen').style.display = 'none';
    document.getElementById('study-screen').style.display = 'block';
    const list = document.getElementById('study-list');
    list.innerHTML = "Chargement...";
    
    const isFullVip = localStorage.getItem('isVip') === 'true';
    const { data } = await _supabase.from('questions').select('*').limit(300);
    
    if (data) {
        list.innerHTML = data.map((q, i) => {
            const locked = (i >= 50 && !isFullVip); 
            return `<div class="manual-q ${locked ? 'manual-locked' : ''}">
                <b>${i + 1}. ${locked ? "CONTENU VIP BLOQUÉ" : q.question}</b><br>
                <span style="color:#FCD116;">${locked ? "Payez 500F" : "R: " + q.correct_answer}</span>
            </div>`;
        }).join('');
    }
};

function displayCertificate(lvl) {
    const cert = document.getElementById('certificate-container');
    const btn = document.getElementById('cert-action-btn');
    
    document.getElementById('cert-name').innerText = currentUser || "Champion";
    document.getElementById('cert-level').innerText = "NIVEAU " + lvl + " VALIDÉ";
    document.getElementById('cert-cat').innerText = window.currentPlayingCat;

    // On change le texte du bouton selon le niveau atteint
    if (lvl === 1) {
        btn.innerText = "DÉBLOQUER LE NIVEAU 2 🔓";
    } else if (lvl === 2) {
        btn.innerText = "DÉBLOQUER LE NIVEAU 3 🔥";
    } else {
        btn.innerText = "RETOUR AU MENU PRINCIPAL";
    }

    cert.style.setProperty('display', 'flex', 'important');
}

window.closeCertAndNext = function() {
    let storageKey = 'level_' + window.currentPlayingCat;
    let categoryLevel = parseInt(localStorage.getItem(storageKey)) || 1;

    // Si le joueur vient de finir le niveau 1 ou 2, on l'envoie à la boutique
    if (categoryLevel < 3) {
        document.getElementById('certificate-container').style.display = 'none';
        showShop(); // Ouvre automatiquement la boutique
    } else {
        location.reload();
    }
};

/* ============================================================
   6. COMMENTAIRES & SYSTÈME
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
        document.getElementById('comments-display').innerHTML = data.map(c => `<div><b>${c.pseudo}</b>: ${c.text}</div>`).join('');
    }
}

window.toggleMusic = function() {
    const audio = document.getElementById('bg-music');
    isMusicOn = !isMusicOn;
    if(audio) isMusicOn ? audio.play() : audio.pause();
    document.getElementById('music-btn').innerText = isMusicOn ? "🔊 Musique : ON" : "🔈 Musique : OFF";
};

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
    let totalStored = localStorage.getItem('totalScore_' + currentUser) || 0;
    let h = ""; 
    for(let i=0; i<3; i++) h += (i < lives) ? "❤️" : "🖤";
    
    // Affiche le score de la partie actuelle et le cumul
    document.getElementById('score-display').innerHTML = `Score: ${score} (Total: ${totalStored}) | ${h}`;
}

window.saveUser = function() {
    const p = document.getElementById('user-pseudo').value.trim();
    if(p.length >= 2) { localStorage.setItem('quiz_pseudo', p); location.reload(); }
};

async function loadData() {
    const { data } = await _supabase.from('questions').select('*');
    if (data) allQuestions = data;
    loadGlobalComments();
}

loadData();
if(currentUser) document.getElementById('login-screen').style.display = 'none';