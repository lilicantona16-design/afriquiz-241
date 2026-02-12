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
let timeLeft = 15;

// 2. Fonctions de Navigation
function showPayment() {
    document.getElementById('home-screen').style.display = 'none';
    document.getElementById('payment-section').style.display = 'block';
}

function quitGame() {
    if(confirm("Retourner au menu ?")) {
        location.reload();
    }
}

// 3. Logique du Quiz
async function loadData() {
    try {
        const { data, error } = await _supabase.from('questions').select('*');
        if (error) throw error;
        allQuestions = data;
        console.log("✅ Questions prêtes");
    } catch (e) {
        console.error("❌ Erreur de chargement:", e.message);
    }
}

function startQuiz(category) {
    if (lives <= 0) {
        alert("❌ Vous n'avez plus de vies ! Partagez le jeu pour recharger.");
        return;
    }

    if (allQuestions.length === 0) {
        alert("Chargement en cours...");
        return;
    }

    currentQuestions = allQuestions.filter(q => 
        q.category && q.category.trim().toLowerCase() === category.toLowerCase()
    );

    if (currentQuestions.length === 0) {
        alert("Pas de questions trouvées pour " + category);
        return;
    }

    currentQuestions.sort(() => 0.5 - Math.random());
    currentIndex = 0;
    score = 0;
    
    document.getElementById('home-screen').style.display = 'none';
    document.getElementById('payment-section').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    showQuestion();
}

function updateHearts() {
    let heartsHtml = "";
    for(let i=0; i<3; i++) {
        heartsHtml += (i < lives) ? "❤️" : "🖤";
    }
    // On suppose que tu as un élément <div id="lives-display"></div> dans ton HTML
    const liveBox = document.getElementById('score-display');
    liveBox.innerHTML = `Score: ${score} | Vies: ${heartsHtml}`;
}

function startTimer() {
    clearInterval(timer);
    timeLeft = 25;
    timer = setInterval(() => {
        timeLeft--;
        const timerText = document.getElementById('timer-text'); // Ajoute <p id="timer-text"></p> dans HTML
        if(timerText) timerText.innerText = `⏱️ ${timeLeft}s`;
        
        if (timeLeft <= 0) {
            clearInterval(timer);
            handleWrongAnswer("Temps écoulé !");
        }
    }, 1000);
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
        setTimeout(() => {
            alert("💔 GAME OVER ! Vous n'avez plus de vies. Partagez pour continuer.");
            location.reload();
        }, 2000);
    }
}

function showFeedback(isCorrect, correct, explanation) {
    const feedback = document.getElementById('feedback-area');
    document.getElementById('explanation-text').innerHTML = `
        <b style="color:${isCorrect ? 'green':'red'}">${isCorrect ? 'BRAVO !':'DOMMAGE...'}</b><br>
        La réponse était : <b>${correct}</b><br><br>
        <i>${explanation || ""}</i>
    `;
    feedback.style.display = 'block';
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
    let message = `Quiz terminé ! Score: ${score}/${currentQuestions.length}`;
    
    if (score >= 15) {
        // AFFICHAGE DU CERTIFICAT
        document.getElementById('quiz-screen').innerHTML = `
            <div style="background: white; color: black; padding: 20px; border: 10px double #FCD116; border-radius: 10px;">
                <h1 style="color: #3A75C4;">🎓 DIPLÔME D'EXPERT</h1>
                <p>Félicitations !</p>
                <h2 style="text-decoration: underline;">Score : ${score}/${currentQuestions.length}</h2>
                <p>Vous êtes officiellement un Expert du Gabon 🇬🇦</p>
                <button onclick="shareGame()" style="background:#00BFFF; color:white; padding:10px; border:none; border-radius:5px;">📢 Partager mon Diplôme</button>
                <hr>
                <p><b>Niveau 2 bloqué !</b><br>Payez 300F pour débloquer la suite.</p>
                <button onclick="showPayment()" style="background:#FCD116; padding:10px; border:none; border-radius:5px;">🔓 Débloquer Niveau 2 (300F)</button>
            </div>
            <button onclick="location.reload()" class="back-link">Retour</button>
        `;
    } else {
        alert(message);
        location.reload();
    }
}

function checkVipCode() {
    const val = document.getElementById('vip-code-input').value;
    if (val.trim() === "GABON2024") {
        alert("✅ Mode VIP Débloqué !");
        startQuiz('VIP');
    } else if (val.trim() === "NIVEAU2") { // Exemple de code pour le niveau 2
        alert("✅ Niveau 2 Débloqué !");
        startQuiz('Niveau2');
    } else {
        alert("❌ Code incorrect.");
    }
}

function shareGame() {
    const text = "J'ai obtenu mon diplôme d'Expert du Gabon 🇬🇦 sur Gabon Quiz ! Teste tes connaissances ici : https://afrizquiz-241.vercel.app";
    if (navigator.share) {
        navigator.share({ title: 'Gabon Quiz VIP', text: text, url: window.location.href });
    } else {
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
    }
}

function showInstallGuide() { document.getElementById('install-guide').style.display = 'flex'; }
function closeInstallGuide() { document.getElementById('install-guide').style.display = 'none'; }
function showHowToPlay() { document.getElementById('how-to-play-modal').style.display = 'flex'; }
function closeHowToPlay() { document.getElementById('how-to-play-modal').style.display = 'none'; }

loadData();