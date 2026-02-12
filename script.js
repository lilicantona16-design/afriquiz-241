// 1. DÉCLARATION DES VARIABLES (On les met tout en haut pour éviter l'erreur d'initialisation)
let allQuestions = [];
let currentQuestions = [];
let currentIndex = 0;
let score = 0;

// 2. QUESTIONS DE SECOURS (Si Supabase plante, le jeu marchera quand même)
const backupQuestions = [
    { category: "Provinces", question: "Quelle est la capitale de l'Ogooué-Maritime ?", option1: "Lambaréné", option2: "Port-Gentil", option3: "Mouila", option4: "Oyem", correct_answer: "Port-Gentil", explanation: "Port-Gentil est le chef-lieu de l'Ogooué-Maritime." },
    { category: "Afrique", question: "Dans quel pays se trouve le Kilimandjaro ?", option1: "Gabon", option2: "Kenya", option3: "Tanzanie", option4: "Sénégal", correct_answer: "Tanzanie", explanation: "C'est le plus haut sommet d'Afrique." }
];

// 3. CONFIGURATION SUPABASE (Vérifie bien qu'il n'y a pas d'espace avant https)
const SUPABASE_URL = 'https://cjxbsrudyqumeuvedozo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqeGJzcnVkeXF1bWV1dmVkb3pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDkzMTk3OTcsImV4cCI6MjAyNDg5NTc5N30.8V_X6Z_f7O8R-L5R6X_R-L5R6X_R-L5R6X_R-L5R6X_R';

let _supabase;
try {
    _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
} catch (e) {
    console.error("Erreur de connexion Supabase, passage en mode secours.");
}

// 4. CHARGEMENT DES DONNÉES
async function loadData() {
    try {
        const { data, error } = await _supabase.from('questions').select('*');
        if (error || !data || data.length === 0) {
            allQuestions = backupQuestions;
        } else {
            allQuestions = data;
        }
    } catch (e) {
        allQuestions = backupQuestions;
    }
    console.log("Système prêt !");
}

// 5. FONCTIONS DU JEU
function showPayment() {
    document.getElementById('payment-section').style.display = 'block';
    document.getElementById('payment-section').scrollIntoView({ behavior: 'smooth' });
}

function checkVipCode() {
    const val = document.getElementById('vip-code-input').value;
    if (val.trim() === "GABON2024") {
        alert("✅ Accès VIP débloqué !");
        startQuiz('VIP');
    } else {
        alert("❌ Code incorrect.");
    }
}

function startQuiz(category) {
    currentQuestions = allQuestions.filter(q => 
        q.category && q.category.trim().toLowerCase() === category.trim().toLowerCase()
    );

    if (currentQuestions.length === 0) {
        alert("Désolé, pas encore de questions pour : " + category);
        return;
    }

    currentQuestions = currentQuestions.sort(() => 0.5 - Math.random()).slice(0, 10);
    currentIndex = 0;
    score = 0;

    document.getElementById('home-screen').style.display = 'none';
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
                    btn.style.backgroundColor = "#d4edda";
                } else {
                    btn.style.backgroundColor = "#f8d7da";
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
        alert("Terminé ! Score : " + score + "/10");
        location.reload();
    }
}

// Lancement automatique
loadData();