const URL = 'https://cjxbsrudyqumeuvedozo.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqeGJzcnVkeXF1bWV1dmVkb3pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMzkwNzcsImV4cCI6MjA4NTgxNTA3N30.GTK9BWO87eCf3IAf_8OTy4T59nFl8-vjnWDMApUOHAo';
const _supabase = supabase.createClient(URL, KEY);

let allQuestions = [];
let currentQuestions = [];
let currentIndex = 0;
let score = 0;

async function loadData() {
    try {
        const { data, error } = await _supabase.from('questions').select('*');
        if (error) throw error;
        allQuestions = data;
        console.log("✅ Données prêtes");
    } catch (e) { console.error("Erreur Supabase:", e.message); }
}

function showPayment() {
    document.getElementById('home-screen').style.display = 'none';
    document.getElementById('payment-section').style.display = 'block';
}

function quitGame() { 
    if(confirm("Retourner au menu ?")) location.reload(); 
}

function startQuiz(category) {
    currentQuestions = allQuestions.filter(q => q.category && q.category.trim().toLowerCase() === category.toLowerCase());
    if (currentQuestions.length === 0) { alert("Arrive bientôt !"); return; }
    currentQuestions.sort(() => 0.5 - Math.random());
    currentIndex = 0; score = 0;
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
                document.querySelectorAll('.option-btn').forEach(b => b.disabled = true);
                if (opt === q.correct_answer) { score++; btn.style.background = "#009E60"; } 
                else { btn.style.background = "#ff4444"; }
                document.getElementById('explanation-text').innerHTML = `<b>Réponse: ${q.correct_answer}</b><br><br>${q.explanation || ""}`;
                document.getElementById('feedback-area').style.display = 'block';
            };
            container.appendChild(btn);
        }
    });
}

function nextQuestion() {
    currentIndex++;
    if (currentIndex < currentQuestions.length) { showQuestion(); } 
    else { alert("Bravo ! Score final : " + score + "/" + currentQuestions.length); location.reload(); }
}

function shareGame() {
    const text = "Viens tester tes connaissances sur le Gabon 🇬🇦 ! Joue ici : https://afrizquiz-241.vercel.app";
    if (navigator.share) { 
        navigator.share({ title: 'Gabon Quiz VIP', text: text, url: window.location.href }); 
    } else { 
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`); 
    }
}

function showInstallGuide() { document.getElementById('install-guide').style.display = 'flex'; }
function closeInstallGuide() { document.getElementById('install-guide').style.display = 'none'; }
function showHowToPlay() { document.getElementById('how-to-play-modal').style.display = 'flex'; }
function closeHowToPlay() { document.getElementById('how-to-play-modal').style.display = 'none'; }

function checkVipCode() {
    const code = document.getElementById('vip-code-input').value.trim();
    if (code === "GABON2024") { 
        alert("✅ Code correct ! Bienvenue VIP.");
        startQuiz('VIP'); 
    } else { alert("❌ Code invalide."); }
}

loadData();