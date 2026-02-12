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
let isVip = false;
async function loadData() {
    try {
        const { data, error } = await _supabase.from('questions').select('*');
        if (error) throw error;
        allQuestions = data;
    } catch (e) { console.error("Erreur de données", e); }
}

function showShop() { 
    document.getElementById('home-screen').style.display = 'none';
    document.getElementById('shop-screen').style.display = 'block';
}

function showStudyMode() {
    document.getElementById('home-screen').style.display = 'none';
    document.getElementById('study-screen').style.display = 'block';
    const list = document.getElementById('study-list');
    list.innerHTML = allQuestions.slice(0, 85).map(q => `
        <div style="margin-bottom:12px; border-bottom:1px dotted #666; padding-bottom:5px;">
            <b>Q: ${q.question}</b><br><span style="color:#FCD116;">R: ${q.correct_answer}</span>
        </div>`).join('');
}

function startQuiz(cat) {
    currentQuestions = allQuestions.filter(q => q.category && q.category.toLowerCase() === cat.toLowerCase());
    if(currentQuestions.length === 0) return alert("Bientôt disponible !");
    currentQuestions.sort(() => 0.5 - Math.random());
    currentIndex = 0; score = 0; lives = 3;
    document.getElementById('home-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    showQuestion();
}

function showQuestion() {
    if (!isVip && currentIndex >= 10) {
        clearInterval(timer);
        document.getElementById('quiz-screen').innerHTML = `
            <div style="background:white; color:black; padding:25px; border-radius:20px; text-align:center;">
                <h2 style="color:#d32f2f;">🔒 NIVEAU 2 BLOQUÉ</h2>
                <p>Bravo pour ces 10 premières réponses ! Débloque la version complète (300F ou 500F) pour continuer l'aventure.</p>
                <button onclick="showShop()" class="continue-btn" style="background:#FCD116; color:black;">DÉBLOQUER MAINTENANT</button>
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
            if(opt === q.correct_answer) {
                score++; btn.style.background = "#009E60"; btn.style.color = "white";
                showFeedback(true, q.correct_answer, q.explanation);
            } else {
                btn.style.background = "#ff4444"; btn.style.color = "white";
                handleWrong(q.correct_answer, q.explanation);
            }
        };
        container.appendChild(btn);
    });
}

function startTimer() {
    clearInterval(timer); timeLeft = 15;
    const tText = document.getElementById('timer-text');
    timer = setInterval(() => {
        timeLeft--; tText.innerText = `⏱️ ${timeLeft}s`;
        if(timeLeft <= 0) { clearInterval(timer); handleWrong(currentQuestions[currentIndex].correct_answer, "Temps écoulé !"); }
    }, 1000);
}

function handleWrong(c, e) {
    lives--; updateHeader();
    showFeedback(false, c, e);
    if(lives <= 0) setTimeout(() => { alert("💔 Plus de vies ! Étudie le manuel."); showStudyMode(); }, 2500);
}

function showFeedback(isC, c, e) {
    const fb = document.getElementById('feedback-area');
    document.getElementById('explanation-text').innerHTML = `
        <b style="color:${isC?'green':'red'}">${isC?'✅ BRAVO':'❌ DOMMAGE'}</b><br>
        La réponse était : <b>${c}</b><br><i>${e||""}</i>`;
    fb.style.display = 'block';
}

function updateHeader() {
    let h = ""; for(let i=0; i<3; i++) h += (i < lives) ? "❤️" : "🖤";
    document.getElementById('score-display').innerHTML = `Score: ${score} | ${h}`;
}

function nextQuestion() { currentIndex++; showQuestion(); }

function checkVipCode() {
    const val = document.getElementById('vip-code-input').value.toUpperCase().trim();
    const codes = ["GABON2024", "VIP500", "GAB300", "AFR300", "MON300"];
    if(codes.includes(val)) {
        isVip = true; alert("💎 ACCÈS DÉBLOQUÉ ! Profite bien."); location.reload();
    } else alert("Code incorrect.");
}

function shareGame() {
    const t = "Deviens un expert du Gabon 🇬🇦 ! Joue ici : " + window.location.href;
    window.open(`https://wa.me/?text=${encodeURIComponent(t)}`);
}

function showInstallGuide() { alert("Cliquez sur les 3 points (menu) du navigateur, puis sur 'Ajouter à l'écran d'accueil'."); }
function showHowToPlay() { alert("15 secondes par question. Tu as 3 vies ❤️. Le niveau 2 est payant !"); }

loadData();