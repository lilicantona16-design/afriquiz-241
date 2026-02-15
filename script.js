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
/* ============================================================
   EXTENSION PRO : NIVEAUX, CERTIFICATS ET FLUX VIP
   ============================================================ */

// Configuration des paliers de niveaux
const LEVEL_CONFIG = {
    1: { questions: 10, price: 0, label: "Débutant" },
    2: { questions: 20, price: 300, label: "Difficile" },
    3: { questions: 30, price: 0, label: "Expert Pro" } // Gratuit si Niveau 2 payé
};

let currentDifficultyLevel = parseInt(localStorage.getItem('game_level')) || 1;

// 1. REECRITURE DE showQuestion POUR GERER LES NIVEAUX
const originalShowQuestion = showQuestion;
showQuestion = function() {
    // Vérification du niveau
    if (currentDifficultyLevel === 1 && currentIndex >= 10) {
        showCustomCertificate(1);
        return;
    }
    if (currentDifficultyLevel === 2 && currentIndex >= 20) {
        showCustomCertificate(2);
        return;
    }
    if (currentDifficultyLevel === 3 && currentIndex >= 30) {
        showCustomCertificate(3);
        return;
    }

    // Affichage du badge de niveau dans l'interface
    const quizScreen = document.getElementById('quiz-screen');
    let badge = document.getElementById('level-tag');
    if(!badge) {
        badge = document.createElement('div');
        badge.id = 'level-tag';
        badge.className = 'level-indicator';
        quizScreen.prepend(badge);
    }
    badge.innerText = `NIVEAU ${currentDifficultyLevel} : ${LEVEL_CONFIG[currentDifficultyLevel].label}`;
    
    originalShowQuestion(); // Appelle le reste de ta fonction d'origine
};

// 2. SYSTEME DE CERTIFICAT ET REDIRECTION
function showCustomCertificate(level) {
    clearInterval(timer);
    const certContainer = document.getElementById('certificate-container');
    const certName = document.getElementById('cert-name');
    const certLevel = document.getElementById('cert-level');
    
    certName.innerText = currentUser || "Champion";
    certLevel.innerText = "NIVEAU " + level;
    certContainer.style.display = 'block';
    
    // Jouer un son ou confettis ici si tu veux
}

function closeCertAndNext() {
    document.getElementById('certificate-container').style.display = 'none';
    
    if (currentDifficultyLevel === 1) {
        // Rediriger vers boutique pour Niveau 2
        showGameNotification("Bravo ! Débloque le Niveau 2 (300F) pour continuer.");
        showShop(); 
    } else if (currentDifficultyLevel === 2) {
        // Passage au niveau 3 automatique
        currentDifficultyLevel = 3;
        localStorage.setItem('game_level', 3);
        startQuiz(currentQuestions[0].category); 
    } else {
        showGameNotification("Félicitations ! Tu as terminé le jeu !");
        location.reload();
    }
}

// 3. REECRITURE DU MANUEL (50% GRATUIT / 50% VIP)
async function showStudyMode() {
    document.getElementById('home-screen').style.display = 'none';
    const screen = document.getElementById('study-screen');
    screen.style.display = 'block';
    
    const { data } = await _supabase.from('questions').select('*').limit(100);
    const list = document.getElementById('study-list');
    
    list.innerHTML = data.map((q, index) => {
        const isLocked = index >= 40 && !isVip;
        return `
            <div class="manual-q ${isLocked ? 'manual-locked' : ''}">
                <b>${index + 1}. ${isLocked ? "CONTENU VIP BLOQUÉ" : q.question}</b><br>
                <span style="color:#009E60;">${isLocked ? "Payez 500F pour voir" : "R: " + q.correct_answer}</span>
                ${isLocked ? '<span class="vip-badge-small">VIP</span>' : ''}
            </div>
        `;
    }).join('');
}

// 4. GESTION DES CODES SPECIFIQUES (300F / 500F)
function checkVipCode() {
    const code = document.getElementById('vip-code-input').value.toUpperCase().trim();
    const btnWhatsapp = document.querySelector('.btn-whatsapp'); // Ton bouton vert
    
    let accessGranted = false;
    
    if (code === "GAB300" || code === "AFR300" || code === "MON300") {
        currentDifficultyLevel = 2;
        localStorage.setItem('game_level', 2);
        accessGranted = true;
    } else if (code === "VIP500" || code === "GABON2024") {
        isVip = true;
        localStorage.setItem('isVip', 'true');
        currentDifficultyLevel = 2;
        localStorage.setItem('game_level', 2);
        accessGranted = true;
    }

    if (accessGranted) {
        showGameNotification("✅ Code validé ! Niveau débloqué.");
        setTimeout(() => { location.reload(); }, 1500);
    } else {
        showGameNotification("❌ Code incorrect.");
    }
}

// 5. NOTIFICATIONS INTERNES (Remplace alert)
function showGameNotification(text) {
    const note = document.createElement('div');
    note.className = 'custom-game-notification';
    note.innerText = text;
    document.body.appendChild(note);
    setTimeout(() => { note.remove(); }, 3000);
}

// Remplacer les alertes par les notifications dans tes fonctions existantes
function showHowToPlay() { showGameNotification("Règles : 15s par question. 3 vies. Niveau 1 gratuit."); }
function showInstallGuide() { showGameNotification("Menu > Installer l'application (Android) ou Partager > Ecran d'accueil (iPhone)"); }

// 6. PERSISTENCE : Reprendre au dernier index
function saveCurrentProgress() {
    localStorage.setItem('quiz_current_index', currentIndex);
}

// Modifier checkAnswer pour sauvegarder
const originalCheckAnswer = checkAnswer;
checkAnswer = function(choice, correct, expl) {
    originalCheckAnswer(choice, correct, expl);
    saveCurrentProgress();
};

// Charger le pseudo au début si absent
if(!currentUser) {
    document.getElementById('login-screen').style.display = 'flex';
}
/* ============================================================
   LOGIQUE FINALE : NIVEAUX, CERTIFICATS ET NOTIFICATIONS PRO
   ============================================================ */

// 1. CONFIGURATION DES NIVEAUX
const GAME_LEVELS = {
    1: { name: "NIVEAU 1 : DÉBUTANT", qCount: 10, isFree: true },
    2: { name: "NIVEAU 2 : DIFFICILE", qCount: 20, isFree: false },
    3: { name: "NIVEAU 3 : EXPERT PRO", qCount: 30, isFree: false }
};

let currentLvl = parseInt(localStorage.getItem('user_game_level')) || 1;

// 2. NOTIFICATION PERSONNALISÉE (Remplace alert)
function showNote(msg) {
    const box = document.getElementById('game-alert');
    box.innerText = msg;
    box.style.display = 'block';
    setTimeout(() => { box.style.display = 'none'; }, 3500);
}

// Redéfinition des fonctions d'aide pour utiliser les notifications
window.showHowToPlay = () => showNote("⏱️ 15s par question. ❤️ 3 vies. Niveau 1 gratuit (10 questions) !");
window.showInstallGuide = () => showNote("📲 Android: 3 points > Installer. iPhone: Partager > Écran d'accueil.");

// 3. GESTION DE LA PROGRESSION DANS LE QUIZ
// On modifie la fonction showQuestion existante pour gérer les blocages
   originalShowQuestion = showQuestion;
showQuestion = function() {
    const config = GAME_LEVELS[currentLvl];

    // Si le joueur a fini les questions de son niveau actuel
    if (currentIndex >= config.qCount) {
        clearInterval(timer);
        displayCertificate(currentLvl);
        return;
    }

    // Affichage du Badge de Niveau
    const container = document.getElementById('quiz-screen');
    let badge = document.getElementById('lvl-badge');
    if(!badge) {
        badge = document.createElement('div');
        badge.id = 'lvl-badge';
        badge.className = 'level-indicator';
        container.prepend(badge);
    }
    badge.innerText = config.name;

    originalShowQuestion();
};

// 4. AFFICHAGE ET GESTION DU CERTIFICAT
function displayCertificate(lvl) {
    const cert = document.getElementById('certificate-container');
    document.getElementById('cert-name').innerText = currentUser || "Champion";
    document.getElementById('cert-level').innerText = "NIVEAU " + lvl + " VALIDÉ";
    document.getElementById('cert-cat').innerText = currentQuestions[0].category;
    cert.style.display = 'block';
}

function closeCertAndNext() {
    document.getElementById('certificate-container').style.display = 'none';
    
    if (currentLvl === 1) {
        showNote("Félicitations ! Débloquez le Niveau 2 pour continuer.");
        showShop(); // Redirection automatique vers la boutique
    } else if (currentLvl === 2) {
        currentLvl = 3;
        localStorage.setItem('user_game_level', 3);
        showNote("Passage au Niveau 3 : EXPERT PRO !");
        startQuiz(currentQuestions[0].category);
    } else {
        showNote("Incroyable ! Vous avez terminé tout le jeu !");
        location.reload();
    }
}

// 5. VALIDATION DES CODES (300F et 500F)
window.checkVipCode = function() {
    const code = document.getElementById('vip-code-input').value.toUpperCase().trim();
    let success = false;

    // Codes pour Niveau 2 (300F)
    if (["GAB300", "AFR300", "MON300"].includes(code)) {
        currentLvl = 2;
        localStorage.setItem('user_game_level', 2);
        success = true;
    } 
    // Codes pour Accès Total + Manuel (500F)
    else if (["VIP500", "GABON2024"].includes(code)) {
        isVip = true;
        localStorage.setItem('isVip', 'true');
        currentLvl = 2;
        localStorage.setItem('user_game_level', 2);
        success = true;
    }

    if (success) {
        showNote("✅ CODE VALIDE ! Niveau débloqué.");
        setTimeout(() => { location.reload(); }, 2000);
    } else {
        showNote("❌ Code invalide. Vérifiez ou contactez le support.");
    }
};

// 6. MANUEL D'ÉTUDE (80 QUESTIONS AVEC 50% GRATUIT)
async function showStudyMode() {
    document.getElementById('home-screen').style.display = 'none';
    const screen = document.getElementById('study-screen');
    screen.style.display = 'block';
    const list = document.getElementById('study-list');
    list.innerHTML = "Chargement du manuel...";

    const { data } = await _supabase.from('questions').select('*').limit(80);
    
    if (data) {
        list.innerHTML = data.map((q, i) => {
            const locked = (i >= 40 && !isVip); // Bloque après la 40ème question
            return `
                <div class="manual-q ${locked ? 'manual-locked' : ''}">
                    <b>${i + 1}. ${locked ? "CONTENU RÉSERVÉ VIP" : q.question}</b><br>
                    <span style="color:#FCD116;">${locked ? "Payez 500F pour débloquer" : "R: " + q.correct_answer}</span>
                </div>
            `;
        }).join('');
    }
}

// 7. FIX : ÉTOILES ET COMMENTAIRES SUPABASE
async function postComment() {
    const msg = document.getElementById('user-comment').value.trim();
    if(!msg || !currentUser) return showNote("Entrez un message !");

    const { error } = await _supabase.from('comments').insert([
        { pseudo: currentUser, text: msg, score: score }
    ]);

    if(!error) {
        document.getElementById('user-comment').value = "";
        showNote("Message publié !");
        loadComments();
    }
}

async function loadComments() {
    const { data } = await _supabase.from('comments').select('*').order('id', { ascending: false }).limit(10);
    if (data) {
        const div = document.getElementById('comments-display');
        div.innerHTML = data.map(c => `
            <div>
                <span style="color:gold;">⭐</span> <b>${c.pseudo}</b>: ${c.text}
            </div>
        `).join('');
    }
}

// Charger les commentaires au démarrage
loadComments();