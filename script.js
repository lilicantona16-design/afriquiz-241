// 1. Initialisation propre
const SUPABASE_URL = 'https://cjxbsrudyqumeuvedozo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqeGJzcnVkeXF1bWV1dmVkb3pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMzkwNzcsImV4cCI6MjA4NTgxNTA3N30.GTK9BWO87eCf3IAf_8OTy4T59nFl8-vjnWDMApUOHAo';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let allQuestions = [];
let currentQuestions = [];
let currentIndex = 0;
let score = 0;
let lives = 3;
let timer;
let timeLeft = 15;
const FREE_LIMIT = 10;

// Chargement des données
async function loadData() {
    try {
        const { data, error } = await _supabase.from('questions').select('*');
        if (error) throw error;
        allQuestions = data;
        console.log("✅ Questions prêtes");
    } catch (e) { console.error("Erreur Supabase:", e); }
}

// Navigation
function hideAllScreens() {
    const screens = ['home-screen', 'shop-screen', 'study-screen', 'payment-section', 'quiz-screen'];
    screens.forEach(s => {
        const el = document.getElementById(s);
        if(el) el.style.display = 'none';
    });
}

function showShop() { hideAllScreens(); document.getElementById('shop-screen').style.display = 'block'; }
function showPayment() { hideAllScreens(); document.getElementById('payment-section').style.display = 'block'; }
function showStudyMode() { 
    hideAllScreens(); 
    document.getElementById('study-screen').style.display = 'block';
    renderStudy();
}

function startQuiz(category) {
    if (allQuestions.length === 0) return alert("Chargement...");
    currentQuestions = allQuestions.filter(q => q.category && q.category.toLowerCase() === category.toLowerCase());
    if (currentQuestions.length === 0) return alert("Bientôt disponible !");
    
    currentQuestions.sort(() => 0.5 - Math.random());
    currentIndex = 0; score = 0; lives = 3;
    hideAllScreens();
    document.getElementById('quiz-screen').style.display = 'block';
    showQuestion();
}

function showQuestion() {
    if (currentIndex >= FREE_LIMIT) {
        clearInterval(timer);
        document.getElementById('quiz-screen').innerHTML = `
            <div style="background:white; color:black; padding:20px; border-radius:15px; text-align:center;">
                <h2 style="color:#e11900;">🏅 NIVEAU 2 BLOQUÉ</h2>
                <p>Payez 300F pour débloquer les 200 questions suivantes et obtenir le Certificat d'Expert !</p>
                <button onclick="showPayment()" class="continue-btn">DÉBLOQUER (300F)</button>
            </div>`;
        return;
    }

    updateHeader();
    startTimer();
    const q = currentQuestions[currentIndex];
    document.getElementById('question-text').innerText = q.question;
    document.getElementById('feedback-area').style.display = 'none';
    const container = document.getElementById('options-container');
    container.innerHTML = '';

    [q.option1, q.option2, q.option3, q.option4].forEach(opt => {
        if(opt) {
            const btn = document.createElement('button');
            btn.innerText = opt;
            btn.className = 'option-btn';
            btn.onclick = () => {
                clearInterval(timer);
                const buttons = container.querySelectorAll('button');
                buttons.forEach(b => b.disabled = true);
                if(opt === q.correct_answer) {
                    score++; btn.style.background = "#009E60";
                    showFeedback(true, q.correct_answer, q.explanation);
                } else {
                    btn.style.background = "#ff4444";
                    handleWrong(q.correct_answer, q.explanation);
                }
            };
            container.appendChild(btn);
        }
    });
}

function startTimer() {
    clearInterval(timer);
    timeLeft = 15;
    const tText = document.getElementById('timer-text');
    timer = setInterval(() => {
        timeLeft--;
        tText.innerText = `⏱️ ${timeLeft}s`;
        if(timeLeft <= 0) {
            clearInterval(timer);
            handleWrong(currentQuestions[currentIndex].correct_answer, "Temps écoulé !");
        }
    }, 1000);
}

function handleWrong(correct, explanation) {
    lives--;
    updateHeader();
    showFeedback(false, correct, explanation);
    if(lives <= 0) {
        setTimeout(() => { alert("💔 GAME OVER ! Étudiez le manuel."); showStudyMode(); }, 2000);
    }
}

function showFeedback(isCorrect, correct, explanation) {
    const fb = document.getElementById('feedback-area');
    document.getElementById('explanation-text').innerHTML = `
        <b style="color:${isCorrect?'green':'red'}">${isCorrect?'✅ BRAVO':'❌ FAUX'}</b><br>
        La réponse était : <b>${correct}</b><br><i>${explanation||""}</i>`;
    fb.style.display = 'block';
}

function updateHeader() {
    let h = ""; for(let i=0; i<3; i++) h += (i < lives) ? "❤️" : "🖤";
    document.getElementById('score-display').innerHTML = `Score: ${score} | ${h}`;
}

function nextQuestion() { currentIndex++; showQuestion(); }

function renderStudy() {
    const list = document.getElementById('study-list');
    list.innerHTML = allQuestions.slice(0,20).map(q => `
        <div style="background:rgba(255,255,255,0.1); padding:10px; margin-bottom:10px; border-radius:10px;">
            <b>${q.question}</b><br><span style="color:#009E60;">R: ${q.correct_answer}</span>
        </div>`).join('');
}

// Fonctions utilitaires
function shareGame() {
    const text = "Deviens un expert du Gabon 🇬🇦 ! Joue ici : " + window.location.href;
    if (navigator.share) navigator.share({title: 'Gabon Quiz', text: text, url: window.location.href});
    else window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
}
function showInstallGuide() { document.getElementById('install-guide').style.display = 'flex'; }
function closeInstallGuide() { document.getElementById('install-guide').style.display = 'none'; }
function showHowToPlay() { document.getElementById('how-to-play-modal').style.display = 'flex'; }
function closeHowToPlay() { document.getElementById('how-to-play-modal').style.display = 'none'; }

function checkVipCode() {
    const val = document.getElementById('vip-code-input').value.toUpperCase();
    if(val === "GABON2024" || val === "NIVEAU2") {
        alert("✅ ACCÈS VIP DÉBLOQUÉ !");
        location.reload();
    } else alert("Code invalide");
}

loadData();