// CONFIGURATION SUPABASE (REMPLIS AVEC TES CODES)
const SUPABASE_URL = ' https://cjxbsrudyqumeuvedozo.supabase.co';
const SUPABASE_KEY = 'sb_publishable_30ieuDVyx_XK30YyvrIFCA_w244ofio';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let allQuestions = [];
let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let currentCategory = "";

// CHARGEMENT DES QUESTIONS AU DÉMARRAGE
async function fetchQuestions() {
    console.log("Chargement des questions...");
    const { data, error } = await supabase
        .from('questions')
        .select('*');

    if (error) {
        console.error("Erreur de chargement :", error);
    } else {
        allQuestions = data;
        console.log("Questions chargées avec succès :", allQuestions.length);
    }
}

// LANCER UN QUIZ
function startQuiz(category) {
    currentCategory = category;
    
    // Filtrage souple (insensible à la casse et aux espaces)
    questions = allQuestions.filter(q => 
        q.category && q.category.trim().toLowerCase() === category.trim().toLowerCase()
    );

    if (questions.length === 0) {
        alert("Pas de questions trouvées pour : " + category);
        return;
    }

    // On mélange et on prend 10 questions
    questions = shuffleArray(questions).slice(0, 10);
    currentQuestionIndex = 0;
    score = 0;

    // Mise à jour de l'affichage
    document.getElementById('home-screen').classList.remove('active');
    document.getElementById('quiz-screen').classList.add('active');
    document.getElementById('result-screen').classList.remove('active');
    document.getElementById('score-label').innerText = "Score : 0";
    document.getElementById('category-label').innerText = category;
    
    showQuestion();
}

// AFFICHER UNE QUESTION
function showQuestion() {
    const q = questions[currentQuestionIndex];
    document.getElementById('question-text').innerText = q.question;
    document.getElementById('explanation-box').className = "explanation-hidden";
    
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';

    const options = [q.option1, q.option2, q.option3, q.option4];
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.innerText = opt;
        btn.classList.add('option-btn');
        btn.onclick = () => checkAnswer(opt, q.correct_answer, q.explanation);
        optionsContainer.appendChild(btn);
    });
}

// VÉRIFIER LA RÉPONSE
function checkAnswer(selected, correct, explanation) {
    const buttons = document.querySelectorAll('.option-btn');
    buttons.forEach(btn => btn.disabled = true); // Bloquer les clics

    if (selected === correct) {
        score++;
        document.getElementById('score-label').innerText = "Score : " + score;
    }

    // Afficher l'explication
    const expBox = document.getElementById('explanation-box');
    const expText = document.getElementById('explanation-text');
    expText.innerHTML = `<strong>Réponse : ${correct}</strong><br>${explanation || ""}`;
    expBox.className = "explanation-visible";
}

// QUESTION SUIVANTE
function nextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
        showQuestion();
    } else {
        showResult();
    }
}

// RÉSULTATS FINAUX
function showResult() {
    document.getElementById('quiz-screen').classList.remove('active');
    document.getElementById('result-screen').classList.add('active');
    document.getElementById('final-score').innerText = `Bravo ! Score final : ${score} / ${questions.length}`;
}

function showHome() {
    document.getElementById('result-screen').classList.remove('active');
    document.getElementById('home-screen').classList.add('active');
}

// UTILITAIRE : MÉLANGE
function shuffleArray(array) {
    return array.sort(() => Math.random() - 0.5);
}

// INITIALISATION
fetchQuestions();