// 1. CONFIGURATION (Sans espaces invisibles)
const URL = 'https://cjxbsrudyqumeuvedozo.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqeGJzcnVkeXF1bWV1dmVkb3pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMzkwNzcsImV4cCI6MjA4NTgxNTA3N30.GTK9BWO87eCf3IAf_8OTy4T59nFl8-vjnWDMApUOHAo';

// 2. INITIALISATION (Obligatoirement avant le reste)
const _supabase = supabase.createClient(URL, KEY);

// 3. VARIABLES D'ÉTAT (Déclarées au début pour éviter le bug "initialization")
let allQuestions = [];
let currentQuestions = [];
let currentIndex = 0;
let score = 0;

// 4. CHARGEMENT DES DONNÉES
async function loadData() {
    try {
        const { data, error } = await _supabase.from('questions').select('*');
        if (error) throw error;
        allQuestions = data;
        console.log("✅ Questions chargées avec succès !");
    } catch (e) {
        console.error("❌ Erreur de connexion :", e.message);
    }
}

// 5. FONCTIONS DU QUIZ
function startQuiz(category) {
    // On vérifie si les questions sont chargées
    if (allQuestions.length === 0) {
        alert("Les questions chargent encore... Réessayez dans 2 secondes.");
        return;
    }

    currentQuestions = allQuestions.filter(q => 
        q.category && q.category.trim().toLowerCase() === category.toLowerCase()
    );

    if (currentQuestions.length === 0) {
        alert("Bientôt disponible pour : " + category);
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
                    btn.style.background = "#009E60"; // Vert Gabon
                } else {
                    btn.style.background = "#ff4444"; // Rouge
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
        alert("Félicitations ! Score final : " + score + "/" + currentQuestions.length);
        location.reload();
    }
}

// 6. FONCTIONS DE NAVIGATION ET OPTIONS
function showPayment() {
    document.getElementById('home-screen').style.display = 'none';
    document.getElementById('payment-section').style.display = 'block';
}

function quitGame() {
    if(confirm("Retourner au menu ?")) location.reload();
}

function shareGame() {
    const text = "Découvre Gabon Quiz VIP ! 🇬🇦 : https://afrizquiz-241.vercel.app";
    if (navigator.share) {
        navigator.share({ title: 'Gabon Quiz', text: text, url: window.location.href });
    } else {
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
    }
}

function showInstallGuide() { document.getElementById('install-guide').style.display = 'flex'; }
function closeInstallGuide() { document.getElementById('install-guide').style.display = 'none'; }
function showHowToPlay() { document.getElementById('how-to-play-modal').style.display = 'flex'; }
function closeHowToPlay() { document.getElementById('how-to-play-modal').style.display = 'none'; }

function checkVipCode() {
    const val = document.getElementById('vip-code-input').value;
    if (val.trim() === "GABON2024") {
        alert("✅ Mode VIP Débloqué !");
        startQuiz('VIP');
    } else {
        alert("❌ Code incorrect.");
    }
}

// LANCEMENT AUTOMATIQUE
loadData();