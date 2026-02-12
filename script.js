// 1. Initialisation propre
const SUPABASE_URL = 'https://cjxbsrudyqumeuvedozo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqeGJzcnVkeXF1bWV1dmVkb3pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMzkwNzcsImV4cCI6MjA4NTgxNTA3N30.GTK9BWO87eCf3IAf_8OTy4T59nFl8-vjnWDMApUOHAo';

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Variables d'état
let allQuestions = [];
let currentQuestions = [];
let currentIndex = 0;
let score = 0;

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
    if (allQuestions.length === 0) {
        alert("Chargement des questions en cours... réessayez dans un instant.");
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

function showQuestion() {
    const q = currentQuestions[currentIndex];
    document.getElementById('question-text').innerText = q.question;
    document.getElementById('feedback-area').style.display = 'none';
    document.getElementById('score-display').innerText = "Score: " + score;
    
    const container = document.getElementById('options-container');
    container.innerHTML = '';

    [q.option1, q.option2, q.option3, q.option4].forEach(opt => {
        if (opt) {
            const btn = document.createElement('button');
            btn.innerText = opt;
            btn.className = 'option-btn';
            btn.onclick = () => {
                const allBtns = container.querySelectorAll('button');
                allBtns.forEach(b => b.disabled = true);
                if (opt === q.correct_answer) {
                    score++;
                    btn.classList.add('correct');
                } else {
                    btn.classList.add('wrong');
                }
                document.getElementById('explanation-text').innerHTML = `<b>Réponse: ${q.correct_answer}</b><br><br>${q.explanation || ""}`;
                document.getElementById('feedback-area').style.display = 'block';
            };
            container.appendChild(btn);
        }
    });
}

function nextQuestion() {
    currentIndex++;
    if (currentIndex < currentQuestions.length) {
        showQuestion();
    } else {
        alert("Quiz terminé ! Score: " + score + "/" + currentQuestions.length);
        location.reload();
    }
}

function checkVipCode() {
    const val = document.getElementById('vip-code-input').value;
    if (val.trim() === "GABON2024") {
        alert("✅ Mode VIP Débloqué !");
        startQuiz('VIP');
    } else {
        alert("❌ Code incorrect.");
    }
}

loadData();
// Fonction pour partager le jeu
function shareGame() {
    const text = "Découvre Gabon Quiz VIP ! Teste tes connaissances sur le pays 🇬🇦 : https://afrizquiz-241.vercel.app";
    if (navigator.share) {
        navigator.share({
            title: 'Gabon Quiz VIP',
            text: text,
            url: window.location.href
        });
    } else {
        // Version secours pour ordinateurs
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
    }
}

// Fonctions pour le guide d'installation
function showInstallGuide() {
    document.getElementById('install-guide').style.display = 'flex';
}

function closeInstallGuide() {
    document.getElementById('install-guide').style.display = 'none';
}