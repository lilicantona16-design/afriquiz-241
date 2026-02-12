// CONFIGURATION SUPABASE
const URL = 'https://cjxbsrudyqumeuvedozo.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqeGJzcnVkeXF1bWV1dmVkb3pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDkzMTk3OTcsImV4cCI6MjAyNDg5NTc5N30.8V_X6Z_f7O8R-L5R6X_R-L5R6X_R-L5R6X_R-L5R6X_R';
const _supabase = supabase.createClient(URL, KEY);

let allQuestions = [];
let currentQuestions = [];
let currentIndex = 0;
let score = 0;

// Charger les questions au démarrage
async function loadData() {
    const { data, error } = await _supabase.from('questions').select('*');
    if (error) console.error("Erreur Supabase:", error);
    else allQuestions = data;
}

// Afficher la section de paiement
function showPayment() {
    document.getElementById('payment-section').style.display = 'block';
    document.getElementById('payment-section').scrollIntoView({ behavior: 'smooth' });
}

// Vérifier le code VIP
function checkVipCode() {
    const codeSaisi = document.getElementById('vip-code-input').value;
    const codeCorrect = "GABON2024"; // CHANGE TON CODE ICI SI TU VEUX

    if (codeSaisi === codeCorrect) {
        alert("✅ Code correct ! Bienvenue dans le mode VIP.");
        startQuiz('VIP');
    } else {
        alert("❌ Code incorrect. Payez 500F pour recevoir le code.");
    }
}

// Lancer le quiz
function startQuiz(category) {
    currentQuestions = allQuestions.filter(q => 
        q.category && q.category.trim().toLowerCase() === category.toLowerCase()
    );

    if (currentQuestions.length === 0) {
        alert("Aucune question trouvée pour " + category);
        return;
    }

    // Mélanger et prendre 10 questions
    currentQuestions = currentQuestions.sort(() => 0.5 - Math.random()).slice(0, 10);
    currentIndex = 0;
    score = 0;

    document.getElementById('home-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    showQuestion();
}

// Afficher une question
function showQuestion() {
    const q = currentQuestions[currentIndex];
    document.getElementById('question-text').innerText = q.question;
    document.getElementById('feedback-area').style.display = 'none';
    document.getElementById('score-display').innerText = "Score: " + score;
    
    const container = document.getElementById('options-container');
    container.innerHTML = '';

    const options = [q.option1, q.option2, q.option3, q.option4];
    options.forEach(opt => {
        if (opt) {
            const btn = document.createElement('button');
            btn.innerText = opt;
            btn.className = 'option-btn'; // Utilise ton style CSS
            btn.style.display = "block";
            btn.style.width = "100%";
            btn.style.margin = "10px 0";
            btn.style.padding = "12px";
            btn.style.cursor = "pointer";
            
            btn.onclick = () => {
                const allBtns = container.querySelectorAll('button');
                allBtns.forEach(b => b.disabled = true); // Bloquer les clics

                if (opt === q.correct_answer) {
                    score++;
                    btn.style.background = "#d4edda";
                    btn.style.borderColor = "#28a745";
                } else {
                    btn.style.background = "#f8d7da";
                    btn.style.borderColor = "#dc3545";
                }

                document.getElementById('explanation-text').innerHTML = `<b>Réponse: ${q.correct_answer}</b><br>${q.explanation || ""}`;
                document.getElementById('feedback-area').style.display = 'block';
            };
            container.appendChild(btn);
        }
    });
}

// Question suivante
function nextQuestion() {
    currentIndex++;
    if (currentIndex < currentQuestions.length) {
        showQuestion();
    } else {
        alert("Quiz terminé ! Score final : " + score + "/" + currentQuestions.length);
        location.reload(); // Retour à l'accueil
    }
}

loadData();