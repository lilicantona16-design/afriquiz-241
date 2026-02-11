const SUPABASE_URL = 'https://cjxbsrudyqumeuvedozo.supabase.co';
const SUPABASE_KEY = 'sb_publishable_30ieuDVyx_XK30YyvrIFCA_w244ofio';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let allQuestions = [];
let questions = [];
let currentIndex = 0;
let score = 0;

async function loadData() {
    const { data, error } = await _supabase.from('questions').select('*');
    if (error) console.error("Erreur:", error);
    else allQuestions = data;
}

function startQuiz(cat) {
    questions = allQuestions.filter(q => q.category.trim().toLowerCase() === cat.toLowerCase());
    if (questions.length === 0) return alert("Bientôt disponible pour " + cat);
    
    questions = questions.sort(() => 0.5 - Math.random()).slice(0, 10);
    currentIndex = 0; score = 0;
    
    document.getElementById('home-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    showQuestion();
}

function showQuestion() {
    const q = questions[currentIndex];
    document.getElementById('question-text').innerText = q.question;
    document.getElementById('explanation-box').style.display = 'none';
    const container = document.getElementById('options-container');
    container.innerHTML = '';
    
    [q.option1, q.option2, q.option3, q.option4].forEach(opt => {
        const btn = document.createElement('button');
        btn.innerText = opt;
        btn.style = "display:block; width:100%; margin:10px 0; padding:15px; cursor:pointer; background:white; border:1px solid #ddd; border-radius:8px;";
        btn.onclick = () => {
            const btns = container.querySelectorAll('button');
            btns.forEach(b => b.disabled = true);
            if(opt === q.correct_answer) {
                score++;
                btn.style.background = "#2ecc71";
            } else {
                btn.style.background = "#e74c3c";
            }
            document.getElementById('score-label').innerText = "Score : " + score;
            document.getElementById('explanation-text').innerHTML = "<b>Rép : " + q.correct_answer + "</b><br>" + q.explanation;
            document.getElementById('explanation-box').style.display = 'block';
        };
        container.appendChild(btn);
    });
}

function nextQuestion() {
    currentIndex++;
    if (currentIndex < questions.length) showQuestion();
    else {
        document.getElementById('quiz-screen').style.display = 'none';
        document.getElementById('result-screen').style.display = 'block';
        document.getElementById('final-score').innerText = "Score final : " + score + " / " + questions.length;
    }
}

loadData();