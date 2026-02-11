const SUPABASE_URL = 'https://cjxbsrudyqumeuvedozo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqeGJzcnVkeXF1bWV1dmVkb3pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDkzMTk3OTcsImV4cCI6MjAyNDg5NTc5N30.8V_X6Z_f7O8R-L5R6X_R-L5R6X_R-L5R6X_R-L5R6X_R';

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let allQuestions = [];
let quizQuestions = [];
let currentIdx = 0;
let score = 0;

// 1. Charger les données au démarrage
async function init() {
    const { data, error } = await _supabase.from('questions').select('*');
    if (error) console.error("Erreur:", error);
    else allQuestions = data;
}

// 2. Lancer le quiz
function startQuiz(category) {
    quizQuestions = allQuestions.filter(q => 
        q.category && q.category.trim().toLowerCase() === category.toLowerCase()
    );

    if (quizQuestions.length === 0) {
        alert("Pas encore de questions pour " + category);
        return;
    }

    quizQuestions = quizQuestions.sort(() => 0.5 - Math.random()).slice(0, 10);
    currentIdx = 0;
    score = 0;

    document.getElementById('home-screen').classList.remove('active');
    document.getElementById('quiz-screen').classList.add('active');
    showQuestion();
}

// 3. Afficher la question
function showQuestion() {
    const q = quizQuestions[currentIdx];
    document.getElementById('question-text').innerText = q.question;
    document.getElementById('explanation-box').classList.add('hidden');
    
    const container = document.getElementById('options-container');
    container.innerHTML = '';

    [q.option1, q.option2, q.option3, q.option4].forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = opt;
        btn.onclick = () => {
            const btns = container.querySelectorAll('button');
            btns.forEach(b => b.disabled = true);
            
            if(opt === q.correct_answer) {
                score++;
                btn.style.borderColor = "#009E60";
                btn.style.background = "#e6f4ea";
            } else {
                btn.style.borderColor = "#e74c3c";
                btn.style.background = "#fce8e6";
            }
            
            document.getElementById('score-label').innerText = "Score: " + score;
            document.getElementById('explanation-text').innerHTML = `<b>Réponse: ${q.correct_answer}</b><br>${q.explanation}`;
            document.getElementById('explanation-box').classList.remove('hidden');
        };
        container.appendChild(btn);
    });
}

// 4. Suivant
function nextQuestion() {
    currentIdx++;
    if (currentIdx < quizQuestions.length) {
        showQuestion();
    } else {
        document.getElementById('quiz-screen').classList.remove('active');
        document.getElementById('result-screen').classList.add('active');
        document.getElementById('final-score').innerText = `Score Final: ${score} / ${quizQuestions.length}`;
    }
}

init();