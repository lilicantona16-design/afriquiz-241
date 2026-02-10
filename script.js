const SUPABASE_URL = "https://cjxbsrudyqumeuvedozo.supabase.co";
const SUPABASE_KEY = "sb_publishable_30ieuDVyx_XK30YyvrIFCA_w244ofio";

let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;

async function startQuiz(category) {
    // 1. On cherche les questions dans Supabase
    const response = await fetch(`${SUPABASE_URL}/rest/v1/questions?category=eq.${category}`, {
        headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` }
    });
    currentQuestions = await response.json();

    if (currentQuestions.length > 0) {
        // Mélanger les questions pour ne pas avoir toujours le même ordre
        currentQuestions.sort(() => Math.random() - 0.5);
        
        document.getElementById('home-menu').style.display = 'none';
        document.getElementById('quiz-container').style.display = 'block';
        currentQuestionIndex = 0;
        score = 0;
        showQuestion();
    } else {
        alert("Contenu VIP bientôt disponible !");
    }
}

function showQuestion() {
    const q = currentQuestions[currentQuestionIndex];
    
    // On cache l'explication et on vide les anciens boutons
    document.getElementById('explanation-box').style.display = 'none';
    const container = document.getElementById('options-container');
    container.innerHTML = '';

    // Gestion de l'image
    const imgTag = document.getElementById('question-image');
    if (q.image_url && q.image_url !== "") {
        imgTag.src = q.image_url;
        imgTag.style.display = 'block';
    } else {
        imgTag.style.display = 'none';
    }

    // Affichage du texte
    document.getElementById('question-text').innerText = q.question;
    document.getElementById('category-name').innerText = q.category;
    document.getElementById('score-display').innerText = "Score : " + score;

    // Création des boutons de réponse
    [q.option1, q.option2, q.option3, q.option4].forEach(opt => {
        const btn = document.createElement('button');
        btn.innerText = opt;
        btn.className = 'option-btn';
        btn.onclick = () => checkAnswer(opt, q.correct_answer, q.explanation);
        container.appendChild(btn);
    });
}

function checkAnswer(choice, correct, explanation) {
    // Désactiver les boutons pour ne pas cliquer deux fois
    const buttons = document.querySelectorAll('.option-btn');
    buttons.forEach(b => b.disabled = true);

    const expBox = document.getElementById('explanation-box');
    const expText = document.getElementById('explanation-text');
    
    expBox.style.display = 'block';

    if (choice === correct) {
        score += 10;
        expText.innerHTML = `<span style="color: green;">✅ <b>BRAVO !</b></span><br>${explanation}`;
    } else {
        expText.innerHTML = `<span style="color: red;">❌ <b>OUPS...</b></span><br>La réponse était : <b>${correct}</b><br><br>${explanation}`;
    }
    
    document.getElementById('score-display').innerText = "Score : " + score;
}

function nextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < currentQuestions.length) {
        showQuestion();
    } else {
        alert("Félicitations ! Quiz terminé. Score final : " + score);
        window.location.reload();
    }
}

function showPaywall() {
    alert("🌟 Option VIP bientôt disponible ! Préparez vos 500 FCFA pour débloquer le 'Mapane' et toute la culture sacrée.");
}