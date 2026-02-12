// 1. Initialisation propre
const SUPABASE_URL = 'https://cjxbsrudyqumeuvedozo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqeGJzcnVkeXF1bWV1dmVkb3pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMzkwNzcsImV4cCI6MjA4NTgxNTA3N30.GTK9BWO87eCf3IAf_8OTy4T59nFl8-vjnWDMApUOHAo';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Variables globales
let allQuestions = [];
let currentQuestions = [];
let currentIndex = 0;
let score = 0;
let lives = 5;
let timer;
let timeLeft = 25;
const FREE_LIMIT = 15; // Bloque après 15 questions pour le paiement

// 2. Chargement des données
async function loadData() {
    try {
        const { data, error } = await _supabase.from('questions').select('*');
        if (error) throw error;
        allQuestions = data;
        console.log("✅ Questions prêtes");
    } catch (e) { console.error("Erreur:", e.message); }
}

// 3. Fonctions de Navigation (Celles qui manquaient)
function showShop() {
    document.getElementById('home-screen').style.display = 'none';
    const shop = document.getElementById('shop-screen');
    if(shop) shop.style.display = 'block';
    else alert("Section Boutique non trouvée dans le HTML");
}

function showStudyMode() {
    document.getElementById('home-screen').style.display = 'none';
    document.getElementById('study-screen').style.display = 'block';
    renderStudyList();
}

function showInstallGuide() {
    const guide = document.getElementById('install-guide');
    if(guide) guide.style.display = 'flex';
}

function closeInstallGuide() {
    document.getElementById('install-guide').style.display = 'none';
}

function showHowToPlay() {
    const modal = document.getElementById('how-to-play-modal');
    if(modal) modal.style.display = 'flex';
}

function closeHowToPlay() {
    document.getElementById('how-to-play-modal').style.display = 'none';
}

function showPayment() {
    document.querySelectorAll('#home-screen, #shop-screen, #quiz-screen, #study-screen')
            .forEach(s => s.style.display = 'none');
    document.getElementById('payment-section').style.display = 'block';
}

function quitGame() {
    if(confirm("Retourner au menu ?")) location.reload();
}

// 4. Logique du Quiz
function startQuiz(category) {
    if (lives <= 0) { alert("💔 Plus de vies ! Étudiez le manuel pour revenir."); return; }
    
    currentQuestions = allQuestions.filter(q => 
        q.category && q.category.trim().toLowerCase() === category.toLowerCase()
    );

    if(currentQuestions.length === 0) { alert("Bientôt disponible !"); return; }

    currentQuestions.sort(() => 0.5 - Math.random());
    currentIndex = 0; score = 0;
    
    document.getElementById('home-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    showQuestion();
}

function showQuestion() {
    // BLOCAGE NIVEAU PAYANT APRES 10 QUESTIONS
    if (currentIndex >= FREE_LIMIT) {
        clearInterval(timer);
        document.getElementById('quiz-screen').innerHTML = `
            <div style="background:white; color:black; padding:20px; border-radius:15px; text-align:center; border: 5px solid #FCD116;">
                <h2 style="color:#e11900;">🏅 NIVEAU 2 ATTEINT !</h2>
                <p>Bravo ! Pour continuer après la 10ème question et obtenir ton <b>Diplôme d'Expert</b>, débloque la version complète.</p>
                <button onclick="showPayment()" style="background:#009E60; color:white; padding:15px; border:none; border-radius:10px; width:100%; font-weight:bold; cursor:pointer;">DÉBLOQUER LE JEU (300F)</button>
                <p style="font-size:0.8em; margin-top:10px;" onclick="location.reload()">Retourner au menu</p>
            </div>
        `;
        return;
    }

    updateHearts();
    startTimer();
    const q = currentQuestions[currentIndex];
    document.getElementById('question-text').innerText = q.question;
    document.getElementById('feedback-area').style.display = 'none';
    
    const container = document.getElementById('options-container');
    container.innerHTML = '';

    [q.option1, q.option2, q.option3, q.option4].forEach(opt => {
        if (opt) {
            const btn = document.createElement('button');
            btn.innerText = opt;
            btn.className = 'option-btn';
            btn.onclick = () => {
                clearInterval(timer);
                const allBtns = container.querySelectorAll('button');
                allBtns.forEach(b => b.disabled = true);

                if (opt === q.correct_answer) {
                    score++; btn.style.background = "#009E60";
                    showFeedback(true, q.correct_answer, q.explanation);
                } else {
                    btn.style.background = "#ff4444";
                    handleWrongAnswer(q.correct_answer, q.explanation);
                }
            };
            container.appendChild(btn);
        }
    });
}

function startTimer() {
    clearInterval(timer);
    timeLeft = 15;
    const timerText = document.getElementById('timer-text');
    timerText.innerText = `⏱️ ${timeLeft}s`;
    timer = setInterval(() => {
        timeLeft--;
        timerText.innerText = `⏱️ ${timeLeft}s`;
        if (timeLeft <= 0) {
            clearInterval(timer);
            const q = currentQuestions[currentIndex];
            handleWrongAnswer(q.correct_answer, "Temps écoulé ! " + (q.explanation || ""));
        }
    }, 1000);
}

function handleWrongAnswer(correct, explanation) {
    lives--;
    updateHearts();
    showFeedback(false, correct, explanation);
    if (lives <= 0) {
        setTimeout(() => { 
            alert("💔 GAME OVER ! Utilise le Manuel d'étude pour apprendre les réponses."); 
            showStudyMode();
        }, 3000);
    }
}

function showFeedback(isCorrect, correct, explanation) {
    document.getElementById('explanation-text').innerHTML = `
        <b style="color:${isCorrect ? 'green':'red'}">${isCorrect ? '✅ BRAVO !':'❌ DOMMAGE...'}</b><br>
        La réponse était : <b>${correct}</b><br><br>
        <i>${explanation || ""}</i>
    `;
    document.getElementById('feedback-area').style.display = 'block';
}

function updateHearts() {
    let h = "";
    for(let i=0; i<3; i++) h += (i < lives) ? "❤️" : "🖤";
    document.getElementById('score-display').innerHTML = `Score: ${score} | ${h}`;
}

function nextQuestion() {
    currentIndex++;
    showQuestion();
}

function renderStudyList() {
    const container = document.getElementById('study-list');
    if(!container) return;
    container.innerHTML = allQuestions.slice(0, 20).map(q => `
        <div style="background:rgba(255,255,255,0.1); padding:10px; margin-bottom:10px; border-radius:10px; border-left:4px solid #FCD116; text-align:left;">
            <p style="margin:0;"><b>${q.question}</b></p>
            <p style="margin:5px 0 0 0; color:#009E60;">✔ ${q.correct_answer}</p>
        </div>
    `).join('');
}

function shareGame() {
    const text = "J'apprends l'histoire du Gabon sur Gabon Quiz VIP 🇬🇦 ! Teste tes connaissances : https://afrizquiz-241.vercel.app";
    if (navigator.share) {
        navigator.share({ title: 'Gabon Quiz', text: text, url: window.location.href });
    } else {
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
    }
}

function checkVipCode() {
    const val = document.getElementById('vip-code-input').value.trim().toUpperCase();
    if (val === "GABON2024" || val === "NIVEAU2") {
        alert("✅ ACCÈS COMPLET DÉBLOQUÉ !");
        // On augmente la limite pour laisser jouer tout le monde
        currentIndex = 0; score = 0; lives = 3;
        const tempLimit = 999; 
        // Relancer le quiz sans limite
        startQuiz('Provinces'); 
    } else { alert("❌ Code incorrect."); }
}

loadData();