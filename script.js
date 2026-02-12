// 1. Initialisation propre
const SUPABASE_URL = 'https://cjxbsrudyqumeuvedozo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqeGJzcnVkeXF1bWV1dmVkb3pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMzkwNzcsImV4cCI6MjA4NTgxNTA3N30.GTK9BWO87eCf3IAf_8OTy4T59nFl8-vjnWDMApUOHAo';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Variables d'état
let allQuestions = [];
let currentQuestions = [];
let currentIndex = 0;
let score = 0;
let lives = 3;
let timer;
let timeLeft = 25;
async function loadData() {
    try {
        const { data, error } = await _supabase.from('questions').select('*');
        if (error) throw error;
        allQuestions = data;
        console.log("✅ Questions prêtes");
    } catch (e) { console.error(e.message); }
}

function showShop() {
    document.getElementById('home-screen').style.display = 'none';
    document.getElementById('shop-screen').style.display = 'block';
}

function showPayment(levelName, price) {
    document.getElementById('shop-screen').style.display = 'none';
    document.getElementById('payment-section').style.display = 'block';
    // On peut personnaliser le message de paiement si on veut
    alert("Veuillez payer " + price + "F pour le niveau : " + levelName);
}

function quitGame() {
    if(confirm("Retourner au menu ?")) location.reload();
}

function startQuiz(category) {
    if (lives <= 0) {
        alert("❌ Plus de vies ! Partagez pour rejouer.");
        return;
    }
    currentQuestions = allQuestions.filter(q => 
        q.category && q.category.trim().toLowerCase() === category.toLowerCase()
    );
    if (currentQuestions.length === 0) { alert("Bientôt disponible !"); return; }

    currentQuestions.sort(() => 0.5 - Math.random());
    currentIndex = 0; score = 0;
    document.getElementById('home-screen').style.display = 'none';
    document.getElementById('shop-screen').style.display = 'none';
    document.getElementById('payment-section').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    showQuestion();
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
            handleWrongAnswer("Temps écoulé !");
        }
    }, 1000);
}

function updateHearts() {
    let h = "";
    for(let i=0; i<3; i++) h += (i < lives) ? "❤️" : "🖤";
    document.getElementById('score-display').innerHTML = `Score: ${score} | ${h}`;
}

function showQuestion() {
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
                    score++;
                    btn.style.background = "#009E60";
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
        setTimeout(() => { alert("💔 GAME OVER ! Partagez pour recharger vos vies."); location.reload(); }, 2000);
    }
}

function showFeedback(isCorrect, correct, explanation) {
    document.getElementById('explanation-text').innerHTML = `
        <b style="color:${isCorrect ? 'green':'red'}">${isCorrect ? '✅ BRAVO !':'❌ DOMMAGE...'}</b><br>
        La réponse était : <b>${correct}</b><br><br>
        <i>${explanation || "Passe VIP pour plus de détails !"}</i>
    `;
    document.getElementById('feedback-area').style.display = 'block';
}

function nextQuestion() {
    currentIndex++;
    if (currentIndex < currentQuestions.length && lives > 0) {
        showQuestion();
    } else {
        finishGame();
    }
}

function finishGame() {
    if (score >= 15) {
        document.getElementById('quiz-screen').innerHTML = `
            <div style="background: white; color: black; padding: 20px; border: 8px double #FCD116; border-radius: 15px;">
                <h1 style="color: #3A75C4; font-size:1.5em;">🎓 DIPLÔME D'EXPERT</h1>
                <p>Score : <b>${score}/${currentQuestions.length}</b></p>
                <p>Félicitations ! Tu es un véritable Expert du Gabon 🇬🇦</p>
                <button onclick="shareGame()" style="background:#00BFFF; color:white; border:none; padding:10px; border-radius:8px; width:100%;">📢 Partager mon Diplôme</button>
                <hr>
                <button onclick="showShop()" style="background:#FCD116; border:none; padding:10px; border-radius:8px; width:100%; font-weight:bold;">🔓 Aller à la Boutique</button>
            </div>
        `;
    } else {
        alert("Quiz terminé ! Score: " + score);
        location.reload();
    }
}

function checkVipCode() {
    const val = document.getElementById('vip-code-input').value.trim();
    const codes = { "GABON2024": "VIP", "AFRIQUE300": "Afrique", "MONDE300": "Monde" };
    if (codes[val]) {
        alert("✅ Niveau " + codes[val] + " Débloqué !");
        startQuiz(codes[val]);
    } else { alert("❌ Code incorrect."); }
}

function shareGame() {
    const text = "J'ai eu mon diplôme d'Expert du Gabon 🇬🇦 ! Teste-toi ici : https://afrizquiz-241.vercel.app";
    if (navigator.share) { navigator.share({ title: 'Gabon Quiz', text: text, url: window.location.href }); }
    else { window.open(`https://wa.me/?text=${encodeURIComponent(text)}`); }
}

function showInstallGuide() { document.getElementById('install-guide').style.display = 'flex'; }
function closeInstallGuide() { document.getElementById('install-guide').style.display = 'none'; }
function showHowToPlay() { document.getElementById('how-to-play-modal').style.display = 'flex'; }
function closeHowToPlay() { document.getElementById('how-to-play-modal').style.display = 'none'; }

loadData();

