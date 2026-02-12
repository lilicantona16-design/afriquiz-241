// 1. Initialisation
const SUPABASE_URL = 'https://cjxbsrudyqumeuvedozo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqeGJzcnVkeXF1bWV1dmVkb3pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMzkwNzcsImV4cCI6MjA4NTgxNTA3N30.GTK9BWO87eCf3IAf_8OTy4T59nFl8-vjnWDMApUOHAo';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let allQuestions = [];
let currentQuestions = [];
let currentIndex = 0;
let score = 0;
let lives = 5;
let timer;
let timeLeft = 25;
const FREE_LIMIT = 15; // Nombre de questions gratuites avant de payer

async function loadData() {
    try {
        const { data, error } = await _supabase.from('questions').select('*');
        if (error) throw error;
        allQuestions = data;
        console.log("✅ Questions prêtes");
    } catch (e) { console.error(e.message); }
}

// NAVIGATION
function showHome() { location.reload(); }
function showStudyMode() {
    document.getElementById('home-screen').style.display = 'none';
    document.getElementById('study-screen').style.display = 'block';
    renderStudyList();
}

function renderStudyList() {
    const container = document.getElementById('study-list');
    container.innerHTML = allQuestions.map(q => `
        <div class="study-card" style="background:rgba(255,255,255,0.1); padding:10px; margin-bottom:10px; border-radius:10px; text-align:left; border-left:4px solid #FCD116;">
            <p><b>Q: ${q.question}</b></p>
            <p style="color:#009E60;">R: ${q.correct_answer}</p>
            <small><i>${q.explanation || ""}</i></small>
        </div>
    `).join('');
}

function startQuiz(category) {
    if (lives <= 0) { alert("❌ Plus de vies ! Étudiez ou partagez pour recharger."); return; }
    
    currentQuestions = allQuestions.filter(q => 
        q.category && q.category.trim().toLowerCase() === category.toLowerCase()
    );

    currentQuestions.sort(() => 0.5 - Math.random());
    currentIndex = 0; score = 0;
    
    document.getElementById('home-screen').style.display = 'none';
    document.getElementById('study-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    showQuestion();
}

function showQuestion() {
    // BLOCAGE NIVEAU 2 (PAYANT)
    if (currentIndex >= FREE_LIMIT) {
        clearInterval(timer);
        document.getElementById('quiz-screen').innerHTML = `
            <div style="background:white; color:black; padding:20px; border-radius:15px; text-align:center;">
                <h2 style="color:#e11900;">🚧 NIVEAU 2 BLOQUÉ</h2>
                <p>Tu as terminé les questions gratuites. Paye <b>300 F</b> pour débloquer les 200 prochaines questions et obtenir ton diplôme !</p>
                <button onclick="showPayment()" style="background:#009E60; color:white; padding:15px; border:none; border-radius:10px; width:100%; font-weight:bold;">DÉBLOQUER (300F)</button>
                <button onclick="location.reload()" style="background:none; border:none; color:gray; text-decoration:underline; margin-top:10px;">Plus tard</button>
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

function handleWrongAnswer(correct, explanation) {
    lives--;
    updateHearts();
    showFeedback(false, correct, explanation);
    if (lives <= 0) {
        setTimeout(() => { 
            alert("💔 GAME OVER ! Allez dans le Manuel pour étudier les réponses."); 
            showStudyMode();
        }, 3000);
    }
}

function showFeedback(isCorrect, correct, explanation) {
    document.getElementById('explanation-text').innerHTML = `
        <b style="color:${isCorrect ? 'green':'red'}">${isCorrect ? '✅ BRAVO !':'❌ DOMMAGE...'}</b><br>
        La réponse correcte était : <b>${correct}</b><br><br>
        <i>${explanation || ""}</i>
    `;
    document.getElementById('feedback-area').style.display = 'block';
}

function startTimer() {
    clearInterval(timer);
    timeLeft = 15;
    document.getElementById('timer-text').innerText = `⏱️ ${timeLeft}s`;
    timer = setInterval(() => {
        timeLeft--;
        document.getElementById('timer-text').innerText = `⏱️ ${timeLeft}s`;
        if (timeLeft <= 0) {
            clearInterval(timer);
            // ICI : On récupère la bonne réponse de la question en cours
            const correct = currentQuestions[currentIndex].correct_answer;
            const explanation = currentQuestions[currentIndex].explanation;
            handleWrongAnswer(correct, "Temps écoulé ! " + explanation);
        }
    }, 1000);
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

function showPayment() {
    document.getElementById('quiz-screen').style.display = 'none';
    document.getElementById('home-screen').style.display = 'none';
    document.getElementById('payment-section').style.display = 'block';
}

loadData();