const SUPABASE_URL = "https://cjxbsrudyqumeuvedozo.supabase.co";
const SUPABASE_KEY = "sb_publishable_30ieuDVyx_XK30YyvrIFCA_w244ofio";

let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;

async function startQuiz(category) {
    // 1. On va chercher les questions
    const response = await fetch(`${SUPABASE_URL}/rest/v1/questions?category=eq.${category}`, {
        headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` }
    });
    currentQuestions = await response.json();

    if (currentQuestions.length > 0) {
        // 2. On cache le menu et on montre le quiz
        document.getElementById('home-menu').style.display = 'none';
        document.getElementById('quiz-container').style.display = 'block';
        showQuestion();
    }
}

function showQuestion() {
    const q = currentQuestions[currentQuestionIndex];
    document.getElementById('question-text').innerText = q.question;
    document.getElementById('category-name').innerText = q.category;
    
    const container = document.getElementById('options-container');
    container.innerHTML = ''; // On vide les anciens boutons

    // On crée les 4 boutons
    [q.option1, q.option2, q.option3, q.option4].forEach(opt => {
        const btn = document.createElement('button');
        btn.innerText = opt;
        btn.className = 'option-btn';
        btn.onclick = () => checkAnswer(opt, q.correct_answer);
        container.appendChild(btn);
    });
}

function checkAnswer(choice, correct) {
    if (choice === correct) {
        score += 10;
        document.getElementById('score-display').innerText = "Score : " + score;
        alert("Bravo ! 🇬🇦 +10 points");
    } else {
        alert("Oups ! La réponse était : " + correct);
    }
    
    currentQuestionIndex++;
    if (currentQuestionIndex < currentQuestions.length) {
        showQuestion();
    } else {
        alert("Félicitations ! Quiz terminé. Score final : " + score);
        window.location.reload();
    }
}