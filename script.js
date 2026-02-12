// 1. INITIALISATION (Toujours en premier pour éviter l'erreur "before initialization")
const SUPABASE_URL = 'https://cjxbsrudyqumeuvedozo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqeGJzcnVkeXF1bWV1dmVkb3pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMzkwNzcsImV4cCI6MjA4NTgxNTA3N30.GTK9BWO87eCf3IAf_8OTy4T59nFl8-vjnWDMApUOHAo';

// Vérification de sécurité pour l'URL
if (!SUPABASE_URL || SUPABASE_URL.includes(" ")) {
    console.error("L'URL Supabase contient un espace ou est mal formée !");
}

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let allQuestions = []; // La variable est maintenant prête dès le début
let currentQuestions = [];
let currentIndex = 0;
let score = 0;

// 2. CHARGEMENT DES DONNÉES
async function loadData() {
    try {
        const { data, error } = await _supabase.from('questions').select('*');
        if (error) throw error;
        allQuestions = data;
        console.log("✅ Questions chargées avec succès !");
    } catch (e) {
        console.error("❌ Erreur Supabase :", e.message);
    }
}

// 3. FONCTIONS DE NAVIGATION (Obligatoires pour corriger les erreurs "Not Defined")
function showPayment() {
    document.getElementById('home-screen').style.display = 'none';
    document.getElementById('payment-section').style.display = 'block';
}

function quitGame() {
    if(confirm("Retourner au menu principal ?")) {
        location.reload();
    }
}

function startQuiz(category) {
    if (allQuestions.length === 0) {
        alert("Les questions chargent encore... Réessayez dans 2 secondes.");
        return;
    }

    currentQuestions = allQuestions.filter(q => 
        q.category && q.category.trim().toLowerCase() === category.toLowerCase()
    );

    if (currentQuestions.length === 0) {
        alert("Aucune question trouvée pour : " + category);
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
                    btn.style.background = "#d4edda";
                } else {
                    btn.style.background = "#f8d7da";
                }
                document.getElementById('explanation-text').innerHTML = `<b>Réponse: ${q.correct_answer}</b><br>${q.explanation || ""}`;
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
        alert("Quiz terminé ! Score : " + score + "/" + currentQuestions.length);
        quitGame();
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

// Lancement automatique
loadData();