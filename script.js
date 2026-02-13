// 1. INITIALISATION PROPRE (Indispensable pour charger les questions)
const SUPABASE_URL = 'https://cjxbsrudyqumeuvedozo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqeGJzcnVkeXF1bWV1dmVkb3pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMzkwNzcsImV4cCI6MjA4NTgxNTA3N30.GTK9BWO87eCf3IAf_8OTy4T59nFl8-vjnWDMApUOHAo';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. VARIABLES GLOBALES
let allQuestions = [];
let currentQuestions = [];
let currentIndex = 0;
let score = 0;
let lives = 3;
let timer;
let isVip = localStorage.getItem('isVip') === 'true';
let currentUser = localStorage.getItem('quiz_pseudo') || "";

// 3. CHARGEMENT DES DONNÉES DEPUIS SUPABASE
async function loadData() {
    try {
        const { data, error } = await _supabase.from('questions').select('*');
        if (error) throw error;
        allQuestions = data;
        displayComments();
        console.log("Données chargées avec succès");
    } catch (e) { 
        console.error("Erreur de connexion Supabase :", e);
        alert("Erreur de connexion au serveur. Vérifiez votre internet.");
    }
}

// 4. LOGIQUE DU JEU
function startQuiz(cat) {
    if (allQuestions.length === 0) {
        alert("Chargement des questions en cours... Patientez 2 secondes.");
        return;
    }
    currentQuestions = allQuestions.filter(q => q.category && q.category.toLowerCase() === cat.toLowerCase());
    if(currentQuestions.length === 0) return alert("Bientôt disponible !");
    
    currentQuestions.sort(() => 0.5 - Math.random());
    currentIndex = 0; score = 0; lives = 3;
    
    document.getElementById('home-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    showQuestion();
}

function showQuestion() {
    // Limite pour les joueurs non-VIP
    if (!isVip && currentIndex >= 10) {
        clearInterval(timer);
        document.getElementById('quiz-screen').innerHTML = `
            <div class='modal-content' style='margin:20px auto;'>
                <h2 style='color:#d32f2f;'>🔒 NIVEAU 2 BLOQUÉ</h2>
                <p>Bravo pour tes 10 premières réponses ! Débloque la version complète pour continuer.</p>
                <button onclick='showShop()' class='continue-btn' style='background:#FCD116; color:black;'>DÉBLOQUER MAINTENANT</button>
            </div>`;
        return;
    }

    // Moment pour demander l'avis (Question 5)
    if (currentIndex === 4 && !localStorage.getItem('quiz_rated')) {
        document.getElementById('rating-screen').style.display = 'flex';
    }

    updateHeader();
    startTimer();

    const q = currentQuestions[currentIndex];
    document.getElementById('question-text').innerText = q.question;
    document.getElementById('feedback-area').style.display = 'none';
    
    const container = document.getElementById('options-container');
    container.innerHTML = '';
    
    [q.option1, q.option2, q.option3, q.option4].forEach(opt => {
        if(!opt) return;
        const btn = document.createElement('button');
        btn.innerText = opt; 
        btn.className = 'option-btn';
        btn.onclick = () => {
            clearInterval(timer);
            const isCorrect = (opt === q.correct_answer);
            if(isCorrect) {
                score++;
            } else {
                lives--;
            }
            showFeedback(isCorrect, q.correct_answer, q.explanation);
        };
        container.appendChild(btn);
    });
    window.scrollTo(0,0);
}

function startTimer() {
    clearInterval(timer); 
    let timeLeft = 15;
    const tText = document.getElementById('timer-text');
    timer = setInterval(() => {
        timeLeft--; 
        tText.innerText = `⏱️ ${timeLeft}s`;
        if(timeLeft <= 0) { 
            clearInterval(timer); 
            lives--;
            showFeedback(false, currentQuestions[currentIndex].correct_answer, "Temps écoulé !"); 
        }
    }, 1000);
}

function showFeedback(isC, c, e) {
    updateHeader();
    const fb = document.getElementById('feedback-area');
    document.getElementById('explanation-text').innerHTML = `
        <b style='color:${isC?'#009E60':'#ff4444'}'>${isC?'✅ BRAVO':'❌ DOMMAGE'}</b><br>
        La réponse était : <b>${c}</b><br>
        <i style="font-size:0.9em;">${e||""}</i>`;
    fb.style.display = 'block';

    if(lives <= 0) {
        setTimeout(() => { 
            alert("💔 Plus de vies ! Étudie le manuel pour t'améliorer."); 
            location.reload(); 
        }, 2500);
    }
}

function nextQuestion() { 
    currentIndex++; 
    showQuestion(); 
}

function updateHeader() {
    let h = ""; 
    for(let i=0; i<3; i++) h += (i < lives) ? "❤️" : "🖤";
    const display = document.getElementById('score-display');
    if(display) display.innerHTML = `Score: ${score} | ${h}`;
}

// 5. VIP, BOUTIQUE ET MANUEL
function checkVipCode() {
    const val = document.getElementById('vip-code-input').value.toUpperCase().trim();
    const codes = ["GABON2024", "VIP500", "GAB300"];
    if(codes.includes(val)) {
        localStorage.setItem('isVip', 'true');
        isVip = true;
        alert("💎 ACCÈS VIP ACTIVÉ !");
        location.reload();
    } else {
        alert("Code incorrect.");
    }
}

function showShop() { 
    document.getElementById('home-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'none';
    document.getElementById('shop-screen').style.display = 'block'; 
}

function showStudyMode() {
    document.getElementById('home-screen').style.display = 'none';
    document.getElementById('study-screen').style.display = 'block';
    const list = document.getElementById('study-list');
    list.innerHTML = allQuestions.slice(0, 85).map(q => `
        <div style="margin-bottom:12px; border-bottom:1px dotted #666; padding-bottom:5px;">
            <b>Q: ${q.question}</b><br><span style="color:#FCD116;">R: ${q.correct_answer}</span>
        </div>`).join('');
}

// 6. PSEUDO ET COMMENTAIRES
function saveUser() {
    const p = document.getElementById('user-pseudo').value.trim();
    if(p.length < 2) return alert("Pseudo trop court !");
    localStorage.setItem('quiz_pseudo', p);
    currentUser = p;
    document.getElementById('login-screen').style.display = 'none';
}

function displayComments() {
    const d = document.getElementById('comments-display');
    if(!d) return;
    const c = JSON.parse(localStorage.getItem('quiz_comments') || "[]");
    d.innerHTML = c.map(m => `
        <div style='border-bottom:1px solid #444; margin-bottom:5px; padding:5px;'>
            <b style="color:#FCD116;">${m.pseudo}</b> <small>${m.date}</small><br>
            ${m.text} <br><small style="color:#009E60;">🏆 Score: ${m.score}</small>
        </div>`).join('');
}

async function postComment() {
    const msg = document.getElementById('user-comment').value.trim();
    if(!msg || !currentUser) return;
    let c = JSON.parse(localStorage.getItem('quiz_comments') || "[]");
    c.unshift({
        pseudo: currentUser, 
        text: msg, 
        score: score, 
        date: new Date().toLocaleDateString()
    });
    localStorage.setItem('quiz_comments', JSON.stringify(c.slice(0,20)));
    document.getElementById('user-comment').value = "";
    displayComments();
}

// 7. SYSTÈME D'ÉVALUATION
let currentRating = 0;
function setRate(v) { 
    currentRating = v; 
    const stars = document.querySelectorAll('#star-rating span');
    stars.forEach((s,i) => {
        s.style.color = i < v ? '#FCD116' : '#ccc';
        s.innerHTML = i < v ? '★' : '☆';
    });
}

function submitReview() {
    const feedback = document.getElementById('user-feedback').value.trim();
    if(currentRating === 0 || feedback.length < 5) return alert("Note et avis obligatoires !");
    localStorage.setItem('quiz_rated', 'true');
    
    // On enregistre l'avis comme un commentaire
    const oldPseudo = currentUser;
    document.getElementById('user-comment').value = `⭐ ${currentRating}/5 : ${feedback}`;
    postComment();
    
    document.getElementById('rating-screen').style.display = 'none';
    alert("Merci ! Ton avis est sur le Mur des Champions.");
}

// 8. FONCTIONS DE PARTAGE
function shareGame() {
    const t = "Prouve que tu es un vrai Gabonais 🇬🇦 ! Joue ici : " + window.location.href;
    window.open(`https://wa.me/?text=${encodeURIComponent(t)}`);
}

// LANCEMENT
if(currentUser) document.getElementById('login-screen').style.display = 'none';
loadData();