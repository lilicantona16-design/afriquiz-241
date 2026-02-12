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

async function loadData() {
    try {
        const { data, error } = await _supabase.from('questions').select('*');
        if (error) throw error;
        allQuestions = data;
        console.log("✅ Données prêtes");
    } catch (e) { console.error(e); }
}

function showScreen(id) {
    ['home-screen','shop-screen','study-screen','payment-section','quiz-screen'].forEach(s => {
        document.getElementById(s).style.display = (s === id) ? 'block' : 'none';
    });
}

function showShop() { showScreen('shop-screen'); }
function showPayment(title, price) { 
    document.getElementById('pay-title').innerText = `PAYER ${price}F (${title})`;
    showScreen('payment-section'); 
}

function showStudyMode() {
    showScreen('study-screen');
    const list = document.getElementById('study-list');
    const categories = ["Provinces", "Afrique", "Monde"];
    list.innerHTML = categories.map(cat => `
        <h3 style="color:#FCD116; border-bottom:1px solid #FCD116;">📍 ${cat}</h3>
        ${allQuestions.filter(q => q.category === cat).slice(0, 30).map(q => `
            <div style="margin-bottom:10px; font-size:0.9em;">
                <b>Q: ${q.question}</b><br><span style="color:#009E60;">R: ${q.correct_answer}</span>
            </div>
        `).join('')}
    `).join('');
}

function startQuiz(cat) {
    currentQuestions = allQuestions.filter(q => q.category === cat);
    if(currentQuestions.length === 0) return alert("Bientôt !");
    currentQuestions.sort(() => 0.5 - Math.random());
    currentIndex = 0; score = 0; lives = 3;
    showScreen('quiz-screen');
    showQuestion();
}

function showQuestion() {
    if (!isVip && currentIndex >= 10) {
        clearInterval(timer);
        document.getElementById('quiz-screen').innerHTML = `
            <div style="background:white; color:black; padding:20px; border-radius:15px; text-align:center;">
                <h2 style="color:red;">🔒 NIVEAU 2 BLOQUÉ</h2>
                <p>Paye 300F pour voir les prochaines questions ou 500F pour le Pack VIP Total !</p>
                <button onclick="showShop()" class="continue-btn">ALLER À LA BOUTIQUE</button>
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
        if(!opt) return;
        const btn = document.createElement('button');
        btn.innerText = opt; btn.className = 'option-btn';
        btn.onclick = () => {
            clearInterval(timer);
            const btns = container.querySelectorAll('button');
            btns.forEach(b => b.disabled = true);
            if(opt === q.correct_answer) {
                score++; btn.style.background = "#009E60";
                showFeedback(true, q.correct_answer, q.explanation);
            } else {
                btn.style.background = "#ff4444";
                handleWrong(q.correct_answer, q.explanation);
            }
        };
        container.appendChild(btn);
    });
}

function startTimer() {
    clearInterval(timer); timeLeft = 15;
    document.getElementById('timer-text').innerText = `⏱️ ${timeLeft}s`;
    timer = setInterval(() => {
        timeLeft--; document.getElementById('timer-text').innerText = `⏱️ ${timeLeft}s`;
        if(timeLeft <= 0) { clearInterval(timer); handleWrong(currentQuestions[currentIndex].correct_answer, "Temps écoulé !"); }
    }, 1000);
}

function handleWrong(c, e) {
    lives--; updateHeader();
    showFeedback(false, c, e);
    if(lives <= 0) setTimeout(() => { alert("💔 Plus de vies ! Étudie le manuel."); showStudyMode(); }, 2000);
}

function showFeedback(isC, c, e) {
    document.getElementById('explanation-text').innerHTML = `<b style="color:${isC?'green':'red'}">${isC?'✅ BRAVO':'❌ FAUX'}</b><br>La réponse est : <b>${c}</b><br><i>${e||""}</i>`;
    document.getElementById('feedback-area').style.display = 'block';
}

function updateHeader() {
    let h = ""; for(let i=0; i<3; i++) h += (i < lives) ? "❤️" : "🖤";
    document.getElementById('score-display').innerHTML = `Score: ${score} | ${h}`;
}

function nextQuestion() { currentIndex++; showQuestion(); }
function quitGame() { if(confirm("Quitter le quiz ?")) location.reload(); }

function checkVipCode() {
    const val = document.getElementById('vip-code-input').value.toUpperCase().trim();
    
    // --- TON MARKETING DES CODES ---
    if(val === "GABON2024" || val === "VIP500") {
        isVip = true; 
        alert("💎 PACK TOTAL DÉBLOQUÉ ! Tu as accès à tout en illimité.");
        showScreen('home-screen'); // Retour au menu pour choisir n'importe quoi
    } 
    else if(val === "GAB300") {
        isVip = true; 
        alert("🌳 NIVEAU GABON DÉBLOQUÉ !");
        startQuiz('Provinces');
    }
    else if(val === "AFR300") {
        isVip = true; 
        alert("🌍 NIVEAU AFRIQUE DÉBLOQUÉ !");
        startQuiz('Afrique');
    }
    else if(val === "MON300") {
        isVip = true; 
        alert("🌐 NIVEAU MONDE DÉBLOQUÉ !");
        startQuiz('Monde');
    }
    else {
        alert("❌ Code incorrect. Vérifie bien ou contacte le service client.");
    }
}

function shareGame() {
    const t = "Deviens expert du Gabon 🇬🇦 ! " + window.location.href;
    if(navigator.share) navigator.share({title:'Gabon Quiz', text:t, url:window.location.href});
    else window.open(`https://wa.me/?text=${encodeURIComponent(t)}`);
}

function showInstallGuide() { alert("Cliquez sur les 3 points du navigateur puis 'Ajouter à l'écran d'accueil'"); }
function showHowToPlay() { alert("15s par question, 3 vies, payant après 10 questions !"); }

loadData();