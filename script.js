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
  // originalShowQuestion = showQuestion;
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
/* ============================================================
   MOTEUR DE JEU FINAL : 300+ QUESTIONS ET PROGRESSION RÉELLE
   ============================================================ */

// 1. CHARGEMENT DU MANUEL (300 QUESTIONS)
window.showStudyMode = async function() {
    document.getElementById('home-screen').style.display = 'none';
    document.getElementById('study-screen').style.display = 'block';
    const list = document.getElementById('study-list');
    list.innerHTML = "<p style='text-align:center;'>Préparation du manuel complet (300 questions)...</p>";

    // On récupère 300 questions spécifiquement
    const { data, error } = await _supabase.from('questions').select('*').limit(300);

    if (data) {
        list.innerHTML = data.map((q, i) => {
            const isLocked = (i >= 50 && !isVip); // 50 questions gratuites, le reste VIP
            return `
                <div class="manual-q ${isLocked ? 'manual-locked' : ''}">
                    <small>Question n°${i+1}</small><br>
                    <b>${isLocked ? "CONTENU VIP (Pack 500F)" : q.question}</b><br>
                    <span style="color:#FCD116;">${isLocked ? "Débloquez pour lire la réponse" : "R: " + q.correct_answer}</span>
                </div>
            `;
        }).join('');
    }
};

// 2. GESTION DES NIVEAUX SANS RÉPÉTITION
let usedQuestions = JSON.parse(localStorage.getItem('used_questions')) || [];

window.startQuiz = function(cat) {
    // Filtrer les questions par catégorie ET enlever celles déjà jouées
    currentQuestions = allQuestions.filter(q => 
        q.category.toLowerCase() === cat.toLowerCase() && 
        !usedQuestions.includes(q.id)
    );

    // Si plus de questions neuves, on réinitialise l'historique pour ce joueur
    if (currentQuestions.length < 10) {
        usedQuestions = [];
        localStorage.setItem('used_questions', JSON.stringify([]));
        currentQuestions = allQuestions.filter(q => q.category.toLowerCase() === cat.toLowerCase());
    }

    currentQuestions.sort(() => 0.5 - Math.random());
    currentIndex = 0; 
    score = 0; 
    lives = 3;
    
    document.getElementById('home-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    showQuestion();
};

// 3. LOGIQUE DE PROGRESSION (10 -> 20 -> TOUT)
window.showQuestion = function() {
    let currentLvl = parseInt(localStorage.getItem('user_game_level')) || 1;
    let limit = 10; // Niveau 1 par défaut

    if (currentLvl === 2) limit = 20; 
    if (currentLvl === 3) limit = 1000; // Pas de limite au niveau 3

    // Vérifier si on a atteint la fin du niveau
    if (currentIndex >= limit) {
        clearInterval(timer);
        displayCertificate(currentLvl);
        return;
    }

    // Protection : si on n'a plus de questions dans la liste filtrée
    if (!currentQuestions[currentIndex]) {
        showNote("Bravo ! Tu as épuisé toutes les nouvelles questions !");
        location.reload();
        return;
    }

    updateHeader();
    startTimer();
    
    const q = currentQuestions[currentIndex];
    // On enregistre que cette question a été vue
    usedQuestions.push(q.id);
    localStorage.setItem('used_questions', JSON.stringify(usedQuestions));

    document.getElementById('question-text').innerText = q.question;
    const container = document.getElementById('options-container');
    container.innerHTML = '';

    // Affichage du badge Niveau 1, 2 ou 3
    let badge = document.getElementById('lvl-badge');
    if(!badge) {
        badge = document.createElement('div');
        badge.id = 'lvl-badge';
        badge.className = 'level-indicator';
        document.getElementById('quiz-screen').prepend(badge);
    }
    badge.innerText = `NIVEAU ${currentLvl} (${currentIndex + 1}/${limit === 1000 ? '∞' : limit})`;

    [q.option1, q.option2, q.option3, q.option4].forEach(opt => {
        if(!opt) return;
        const btn = document.createElement('button');
        btn.innerText = opt;
        btn.className = 'main-btn';
        btn.onclick = () => checkAnswer(opt, q.correct_answer, q.explanation);
        container.appendChild(btn);
    });
};

// 4. RÉPARATION DU BOUTON CONTINUER APRÈS CERTIFICAT
window.closeCertAndNext = function() {
    document.getElementById('certificate-container').style.display = 'none';
    let currentLvl = parseInt(localStorage.getItem('user_game_level')) || 1;
    
    if (currentLvl === 1) {
        showNote("Passage au Niveau 2 (Paiement requis)");
        showShop(); // Ouvre la boutique pour payer les 300F
    } else if (currentLvl === 2) {
        localStorage.setItem('user_game_level', 3);
        showNote("Félicitations ! Niveau 3 Débloqué (Expert Pro)");
        location.reload(); // Relance pour appliquer le niveau 3
    } else {
        location.reload();
    }
};
/* ============================================================
   REPARATION FINALE : FIX TYPEERROR CONSTANT VARIABLE
   ============================================================ */

// 1. On utilise 'var' ou rien pour permettre la réassignation si nécessaire
var gameEngineActive = true;

// 2. On remplace la logique de showQuestion de manière sécurisée
const backupShowQuestion = window.showQuestion; 

window.showQuestion = function() {
    let currentLvl = parseInt(localStorage.getItem('user_game_level')) || 1;
    let limit = 10; 

    if (currentLvl === 2) limit = 20; 
    if (currentLvl === 3) limit = 1000; 

    // Vérifier si la limite du niveau est atteinte
    if (currentIndex >= limit) {
        if (typeof timer !== 'undefined') clearInterval(timer);
        if (typeof displayCertificate === 'function') {
            displayCertificate(currentLvl);
        } else {
            alert("Niveau " + currentLvl + " Terminé !");
            showShop();
        }
        return;
    }

    // Protection contre l'absence de questions
    if (!currentQuestions || !currentQuestions[currentIndex]) {
        console.log("Plus de questions disponibles");
        return;
    }

    // On appelle la fonction de base pour afficher la question
    // On utilise un try/catch pour éviter que l'erreur 'constant' ne bloque tout
    try {
        // Mise à jour du badge de niveau (Compteur 1/10, 1/20 etc)
        let badge = document.getElementById('lvl-badge');
        if(!badge && document.getElementById('quiz-screen')) {
            badge = document.createElement('div');
            badge.id = 'lvl-badge';
            badge.className = 'level-indicator';
            document.getElementById('quiz-screen').prepend(badge);
        }
        if(badge) {
            badge.innerText = `NIVEAU ${currentLvl} : ${currentIndex + 1} / ${limit === 1000 ? '∞' : limit}`;
        }

        // Exécution de la logique d'affichage originale
        // Note: On ne réassigne pas, on appelle juste.
        if (typeof updateHeader === 'function') updateHeader();
        if (typeof startTimer === 'function') startTimer();
        
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

    } catch (e) {
        console.error("Erreur dans le moteur de rendu :", e);
    }
};

// 3. Correction de la fonction saveUser pour s'assurer qu'elle est globale
window.saveUser = function() {
    const input = document.getElementById('user-pseudo');
    if(!input) return;
    const p = input.value.trim();
    if(p.length < 2) {
        if(typeof showNote === 'function') showNote("Pseudo trop court !");
        return;
    }
    localStorage.setItem('quiz_pseudo', p);
    currentUser = p;
    const loginScreen = document.getElementById('login-screen');
    if(loginScreen) loginScreen.style.display = 'none';
};
/* ============================================================
   MOTEUR DE JEU ULTIME : SON, AVIS RÉELS ET SYSTÈME ANTI-RÉPÉTITION
   ============================================================ */

// 1. GESTION DES COMMENTAIRES RÉELS (SUPABASE)
async function postComment() {
    const msg = document.getElementById('user-comment').value.trim();
    if(!msg || !currentUser) return showNote("Écris quelque chose !");

    // Envoi à Supabase
    const { error } = await _supabase.from('comments').insert([
        { pseudo: currentUser, text: msg, score: score }
    ]);

    if(!error) {
        document.getElementById('user-comment').value = "";
        showNote("Avis partagé avec la communauté !");
        loadGlobalComments(); // Recharge les avis de tout le monde
    }
}

async function loadGlobalComments() {
    const { data, error } = await _supabase
        .from('comments')
        .select('*')
        .order('id', { ascending: false })
        .limit(20);

    if (data) {
        const div = document.getElementById('comments-display');
        div.innerHTML = data.map(c => `
            <div class="comment-item">
                <b>${c.pseudo}</b> : ${c.text}
                <small>Score : ${c.score || 0} pts</small>
            </div>
        `).join('');
    }
}

// 2. MUSIQUE ET SONS
let isMusicOn = true;
const musicMap = {
    'Provinces': 'https://cdn.pixabay.com/audio/2022/03/09/audio_c36e4f326c.mp3', // Style Rythme Africain
    'Afrique': 'https://cdn.pixabay.com/audio/2024/02/08/audio_1e3e7f3c1d.mp3',
    'Monde': 'https://cdn.pixabay.com/audio/2022/01/18/audio_d0a13f69d2.mp3'
};

function toggleMusic() {
    const audio = document.getElementById('bg-music');
    isMusicOn = !isMusicOn;
    if(isMusicOn) {
        audio.play();
        document.getElementById('music-btn').innerText = "🔊 Musique : ON";
    } else {
        audio.pause();
        document.getElementById('music-btn').innerText = "🔈 Musique : OFF";
    }
}

// 3. FIX QUESTIONS NIVEAU 2 ET 3 (SANS RÉPÉTITION)
window.startQuiz = function(cat) {
    // Filtrer les questions qui n'ont PAS encore été répondues par ce joueur
    let history = JSON.parse(localStorage.getItem('quiz_history')) || [];
    
    currentQuestions = allQuestions.filter(q => 
        q.category.toLowerCase() === cat.toLowerCase() && 
        !history.includes(q.id)
    );

    // Si on a épuisé les questions, on vide l'historique pour recommencer
    if(currentQuestions.length < 5) {
        localStorage.setItem('quiz_history', JSON.stringify([]));
        currentQuestions = allQuestions.filter(q => q.category.toLowerCase() === cat.toLowerCase());
    }

    currentQuestions.sort(() => 0.5 - Math.random());
    currentIndex = 0; score = 0; lives = 3;

    // Lancer la musique de la catégorie
    const audio = document.getElementById('bg-music');
    audio.src = musicMap[cat] || musicMap['Provinces'];
    if(isMusicOn) audio.play();

    document.getElementById('home-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    showQuestion();
};

// Injection dans checkAnswer pour enregistrer l'historique
window.checkAnswer = function(choice, correct, expl) {
    const q = currentQuestions[currentIndex];
    let history = JSON.parse(localStorage.getItem('quiz_history')) || [];
    if(!history.includes(q.id)) {
        history.push(q.id);
        localStorage.setItem('quiz_history', JSON.stringify(history));
    }
    originalCheckAnswer(choice, correct, expl);
};

// Charger les avis au démarrage
loadGlobalComments();
/* ============================================================
   FIX FINAL : PROGRESSION RÉELLE ET ANTI-RÉPÉTITION
   ============================================================ */

// On écrase l'affichage de la question pour gérer la progression 10 -> 20 -> 30
window.showQuestion = function() {
    // 1. Déterminer la limite selon le niveau
    let currentLvl = parseInt(localStorage.getItem('user_game_level')) || 1;
    let limit = 10; // Niveau 1
    if (currentLvl === 2) limit = 20; // Niveau 2
    if (currentLvl === 3) limit = 500; // Niveau 3 (Illimité)

    // 2. Vérifier si on a atteint la fin du niveau
    if (currentIndex >= limit) {
        clearInterval(timer);
        displayCertificate(currentLvl);
        return;
    }

    // 3. Empêcher les mêmes questions (Mélange forcé)
    // On récupère les questions de la catégorie choisie
    if (currentIndex === 0) {
        // Au début de chaque partie, on mélange les questions
        currentQuestions.sort(() => Math.random() - 0.5);
    }

    const q = currentQuestions[currentIndex];
    if (!q) {
        showNote("Plus de questions disponibles !");
        location.reload();
        return;
    }

    // 4. Affichage du compteur (ex: 12/20)
    let badge = document.getElementById('lvl-badge');
    if(badge) {
        badge.innerText = `NIVEAU ${currentLvl} : ${currentIndex + 1} / ${limit}`;
    }

    // 5. Rendu visuel
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

// 6. Correction de la validation du code (Pour passer au niveau 2)
window.checkVipCode = function() {
    const code = document.getElementById('vip-code-input').value.toUpperCase().trim();
    
    // Codes Niveau 2 (300F) ou Niveau 3 (500F)
    if (["GAB300", "VIP500", "GABON2024"].includes(code)) {
        // On monte le niveau dans la mémoire du téléphone
        let nextLvl = (code === "GAB300") ? 2 : 3;
        localStorage.setItem('user_game_level', nextLvl);
        if(nextLvl === 3) localStorage.setItem('isVip', 'true');

        showNote("✅ NIVEAU " + nextLvl + " DÉBLOQUÉ !");
        
        // Redémarrage automatique pour appliquer les changements
        setTimeout(() => { location.reload(); }, 2000);
    } else {
        showNote("❌ Code incorrect.");
    }
};
/* ============================================================
   RÉPARATION MOTEUR : TIRAGE ALÉATOIRE SUR 500+ QUESTIONS
   ============================================================ */

window.startQuiz = function(cat) {
    // 1. On s'assure que 'allQuestions' contient bien toutes les questions Supabase
    if (allQuestions.length === 0) {
        showNote("Chargement des questions... Réessaye.");
        loadData();
        return;
    }

    // 2. Filtrer par catégorie
    let categoryPool = allQuestions.filter(q => q.category.toLowerCase() === cat.toLowerCase());

    if (categoryPool.length === 0) {
        showNote("Bientôt disponible pour cette catégorie !");
        return;
    }

    // 3. LE SECRET : Mélanger TOUT le stock de la catégorie avant de choisir
    // Cela garantit que les 10 ou 20 questions ne seront JAMAIS les mêmes
    categoryPool.sort(() => Math.random() - 0.5);

    // 4. On prépare la liste de jeu pour cette partie
    // On prend un grand échantillon pour être sûr de ne pas bloquer
    currentQuestions = categoryPool; 

    // 5. Réinitialiser les variables de jeu
    currentIndex = 0; 
    score = 0; 
    lives = 3;

    // 6. Lancer l'interface
    document.getElementById('home-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    
    // On force l'affichage de la première question
    showQuestion();
};

// RÉCRITURE DE LA LOGIQUE DE BLOCAGE
window.showQuestion = function() {
    let currentLvl = parseInt(localStorage.getItem('user_game_level')) || 1;
    
    // Définition STRICTE de la limite
    let limit = 10;
    if (currentLvl == 2) limit = 20;
    if (currentLvl == 3) limit = 50;

    // A. SI ON DÉPASSE LA LIMITE DU NIVEAU -> CERTIFICAT
    if (currentIndex >= limit) {
        clearInterval(timer);
        displayCertificate(currentLvl);
        return; 
    }

    // B. SI ON N'A PLUS DE QUESTIONS DANS LA BASE (Rare avec 500 questions)
    const q = currentQuestions[currentIndex];
    if (!q) {
        showNote("Fin des questions disponibles !");
        location.reload();
        return;
    }

    // C. AFFICHAGE DU COMPTEUR ET DE LA QUESTION
    updateHeader();
    startTimer();
    
    // Mise à jour du badge visuel (ex: 12 / 20)
    let badge = document.getElementById('lvl-badge');
    if(badge) {
        badge.innerText = `NIVEAU ${currentLvl} : ${currentIndex + 1} / ${limit}`;
    }

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