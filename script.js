// 1. CONFIGURATION SUPABASE AVEC TA NOUVELLE CLÉ
const URL = 'https://cjxbsrudyqumeuvedozo.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqeGJzcnVkeXF1bWV1dmVkb3pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMzkwNzcsImV4cCI6MjA4NTgxNTA3N30.GTK9BWO87eCf3IAf_8OTy4T59nFl8-vjnWDMApUOHAo';
const _supabase = supabase.createClient(URL, KEY);

let allQuestions = [];
let currentQuestions = [];
let currentIndex = 0;
let score = 0;

// 2. CHARGEMENT DES QUESTIONS DEPUIS TA TABLE SUPABASE
async function loadData() {
    try {
        const { data, error } = await _supabase.from('questions').select('*');
        if (error) throw error;
        allQuestions = data;
        console.log("✅ Connexion Supabase réussie ! Questions chargées :", allQuestions.length);
    } catch (e) {
        console.error("❌ Erreur Supabase :", e.message);
        alert("Problème de connexion aux questions. Vérifie ta table Supabase.");
    }
}

// 3. FONCTIONS DE NAVIGATION
function showPayment() {
    document.getElementById('home-screen').style.display = 'none';
    document.getElementById('payment-section').style.display = 'block';
}

function quitGame() {
    if(confirm("Voulez-vous vraiment quitter et revenir au menu ?")) {
        location.reload(); 
    }
}

function checkVipCode() {
    const val = document.getElementById('vip-code-input').value;
    if (val.trim() === "GABON2024") {
        alert("✅ Mode VIP Débloqué !");
        startQuiz('VIP');
    } else {
        alert("❌ Code incorrect. Payez 500F pour recevoir le code.");
    }
}

// 4. LOGIQUE DU QUIZ
function startQuiz(category) {
    // On filtre les questions par catégorie
    currentQuestions = allQuestions.filter(q => 
        q.category && q.category.trim().toLowerCase() === category.toLowerCase()
    );

    if (currentQuestions.length === 0) {
        alert("Aucune question trouvée pour " + category + ". Vérifie l'orthographe dans ton Excel.");
        return;
    }

    // Mélanger et prendre 10 questions max
    currentQuestions = currentQuestions.sort(() => 0.5 - Math.random()).slice(0, 10);
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

    const options = [q.option1, q.option2, q.option3, q.option4];
    options.forEach(opt => {
        if (opt) {
            const btn = document.createElement('button');
            btn.innerText = opt;
            btn.className = 'option-btn';
            btn.onclick = () => {
                const allBtns = container.querySelectorAll('button');
                allBtns.forEach(b => b.disabled = true);
                
                if (opt === q.correct_answer) {
                    score++;
                    btn.style.background = "#d4edda"; // Vert
                    btn.style.borderColor = "#28a745";
                } else {
                    btn.style.background = "#f8d7da"; // Rouge
                    btn.style.borderColor = "#dc3545";
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
        alert("Félicitations ! Quiz terminé. Score : " + score + "/" + currentQuestions.length);
        location.reload();
    }
}

// Lancement au chargement de la page
loadData();