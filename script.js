// CONFIGURATION SUPABASE
const URL = 'https://cjxbsrudyqumeuvedozo.supabase.co';
const KEY = 'sb_publishable_30ieuDVyx_XK30YyvrIFCA_w244ofio';
const _supabase = supabase.createClient(URL, KEY);

let allQuestions = [];
let currentQuestions = [];
let currentIndex = 0;
let score = 0;

// Charger les données dès l'ouverture
async function loadData() {
    const { data, error } = await _supabase.from('questions').select('*');
    if (error) {
        console.error("Erreur de chargement:", error);
    } else {
        allQuestions = data;
        console.log("Questions prêtes !");
    }
}

// Afficher la section VIP/Paiement
function showPayment() {
    document.getElementById('payment-section').style.display = 'block';
    document.getElementById('payment-section').scrollIntoView({ behavior: 'smooth' });
}

// Vérifier le code secret
function checkVipCode() {
    const codeSaisi = document.getElementById('vip-code-input').value;
    const codeCorrect = "GABON2024"; 

    if (codeSaisi.trim() === codeCorrect) {
        alert("✅ Code validé ! Bienvenue Expert VIP 🇬🇦");
        startQuiz('VIP');
    } else {
        alert("❌ Code incorrect. Envoie tes 500F pour recevoir le code secret.");
    }
}

// Lancer le Quiz
function startQuiz(category) {
    // On filtre les questions par catégorie (sans se soucier des majuscules/espaces)
    currentQuestions = allQuestions.filter(q => 
        q.category && q.category.trim().toLowerCase() === category.trim().toLowerCase()
    );

    if (currentQuestions.length === 0) {
        alert("Bientôt disponible ! Teste une autre catégorie.");
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
        alert("Quiz terminé ! Score : " + score + "/10");
        location.reload();
    }
}

loadData();