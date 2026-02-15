// 1. INITIALISATION PROPRE (Indispensable pour charger les questions)
// =========================================================
// 1. CONFIGURATION, SUPABASE & VARIABLES
// =========================================================
const SUPABASE_URL = 'https://cjxbsrudyqumeuvedozo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqeGJzcnVkeXF1bWV1dmVkb3pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMzkwNzcsImV4cCI6MjA4NTgxNTA3N30.GTK9BWO87eCf3IAf_8OTy4T59nFl8-vjnWDMApUOHAo';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let allQuestions = [];
let currentQuestions = [];
let currentIndex = 0;
let score = 0;
let lives = 3;
let timer;
let currentUser = localStorage.getItem('quiz_pseudo') || "";

// =========================================================
// 2. SYSTÈME DE MÉMOIRE PRO (NE JAMAIS REVOIR UNE QUESTION)
// =========================================================
function saveProgress(id) {
    let history = JSON.parse(localStorage.getItem('quiz_history') || "[]");
    if (!history.includes(id)) {
        history.push(id);
        localStorage.setItem('quiz_history', JSON.stringify(history));
    }
}

function getFreshQuestions(category) {
    let history = JSON.parse(localStorage.getItem('quiz_history') || "[]");
    return allQuestions.filter(q => 
        q.category.toLowerCase() === category.toLowerCase() && 
        !history.includes(q.id)
    );
}

// =========================================================
// 3. CHARGEMENT & MODE HORS-LIGNE
// =========================================================
async function loadData() {
    if (!navigator.onLine) {
        const cache = localStorage.getItem('cached_questions');
        if (cache) { allQuestions = JSON.parse(cache); displayComments(); return; }
    }
    const { data } = await _supabase.from('questions').select('*');
    if (data) {
        allQuestions = data;
        localStorage.setItem('cached_questions', JSON.stringify(data));
        displayComments();
    }
}

// =========================================================
// 4. LOGIQUE DES NIVEAUX ET QUIZ
// =========================================================
window.startQuiz = function(cat) {
    currentQuestions = getFreshQuestions(cat);
    
    if (currentQuestions.length === 0) {
        showNotice("🏆 FÉLICITATIONS", "Tu as terminé toutes les questions ! On recommence le cycle.");
        localStorage.removeItem('quiz_history');
        location.reload();
        return;
    }

    currentQuestions.sort(() => 0.5 - Math.random());
    currentIndex = 0; score = 0; lives = 3;
    document.getElementById('home-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    showQuestion();
};

function showQuestion() {
    let vType = localStorage.getItem('vip_type');
    
    // BLOCAGE NIVEAU 1 -> VERS NIVEAU 2
    if (!vType && currentIndex >= 10) {
        showCertificate("NIVEAU 1 : INITIÉ", "#009E60");
        return;
    }

    updateHeader();
    const q = currentQuestions[currentIndex];
    document.getElementById('question-text').innerText = q.question;
    const container = document.getElementById('options-container');
    container.innerHTML = '';
    
    [q.option1, q.option2, q.option3, q.option4].forEach(opt => {
        if(!opt) return;
        const btn = document.createElement('button');
        btn.innerText = opt;
        btn.className = 'main-btn';
        btn.onclick = () => checkAnswer(opt, q.correct_answer, q.explanation, q.id);
        container.appendChild(btn);
    });
    startTimer();
}

function checkAnswer(choice, correct, expl, qId) {
    clearInterval(timer);
    const isCorrect = (choice === correct);
    if(isCorrect) { score++; saveProgress(qId); } else { lives--; }
    
    document.getElementById('explanation-text').innerHTML = `
        <b style="color:${isCorrect?'#009E60':'#ff4444'}">${isCorrect?'✅ CORRECT':'❌ ERREUR'}</b><br>${expl || ""}
    `;
    document.getElementById('feedback-area').style.display = 'block';
    if(lives <= 0) { showNotice("💔 FINI", "Plus de vies ! Réessaie."); location.reload(); }
}

window.nextQuestion = function() {
    document.getElementById('feedback-area').style.display = 'none';
    currentIndex++;
    
    let vType = localStorage.getItem('vip_type');
    if (vType === '300' && currentIndex === 20) {
        showCertificate("NIVEAU 2 : CHAMPION", "#FCD116");
        return;
    }
    if (currentIndex >= currentQuestions.length) {
        showCertificate("NIVEAU 3 : EXPERT TOTAL", "#3A75C4");
        return;
    }
    showQuestion();
};

// =========================================================
// 5. CERTIFICAT PRO DESIGN (MOBILE ADAPTÉ)
// =========================================================
window.showCertificate = function(levelName, color) {
    clearInterval(timer);
    const certModal = document.createElement('div');
    certModal.style = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.95);z-index:99999;display:flex;align-items:center;justify-content:center;";
    
    certModal.innerHTML = `
        <div style="width:80%;max-width:300px;background:#fff;padding:20px;border-radius:15px;text-align:center;border:6px double ${color};">
            <h2 style="margin:0;color:${color};font-size:1.4rem;">DIPLÔME</h2>
            <p style="margin:5px 0;color:#333;">Félicitations</p>
            <h3 style="margin:5px 0;font-size:1.2rem;text-transform:uppercase;color:#000;">${currentUser}</h3>
            <div style="background:${color};color:#fff;padding:6px;border-radius:5px;font-weight:bold;margin:10px 0;font-size:0.8rem;">${levelName}</div>
            <button id="btn-go-next" style="width:100%;padding:12px;background:#222;color:#fff;border:none;border-radius:8px;font-weight:bold;cursor:pointer;">CONTINUER L'AVENTURE</button>
        </div>
    `;
    document.body.appendChild(certModal);
    if(typeof confetti === 'function') confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#009E60','#FCD116','#3A75C4'] });

    document.getElementById('btn-go-next').onclick = function() {
        certModal.remove();
        let vType = localStorage.getItem('vip_type');
        if (!vType || (vType === '300' && levelName.includes('NIVEAU 2'))) {
            showShop(); // Redirige vers boutique pour payer niveau suivant
        } else {
            location.reload();
        }
    };
};

// =========================================================
// 6. BOUTIQUE, PAIEMENT WHATSAPP & CODES
// =========================================================
window.showShop = function() {
    document.querySelectorAll('.full-screen, .overlay-screen').forEach(s => s.style.display = 'none');
    document.getElementById('shop-screen').style.display = 'block';
};

window.checkVipCode = function() {
    const val = document.getElementById('vip-code-input').value.toUpperCase().trim();
    let type = "";
    if (["GAB300", "AFR300", "MON300"].includes(val)) type = "300";
    if (["VIP500", "GABON2024"].includes(val)) type = "500";

    if (type !== "") {
        localStorage.setItem('isVip', 'true');
        localStorage.setItem('vip_type', type);
        showNotice("💎 ACTIVÉ", "Niveau débloqué !");
        setTimeout(() => location.reload(), 1500);
    } else {
        showNotice("❌ ERREUR", "Code invalide. Contacte le 076367382");
    }
};

// =========================================================
// 7. MANUEL D'ÉTUDE & AVIS
// =========================================================
window.showStudyMode = async function() {
    let vip = localStorage.getItem('vip_type');
    document.getElementById('home-screen').style.display = 'none';
    document.getElementById('study-screen').style.display = 'block';
    const { data } = await _supabase.from('questions').select('*').limit(100);
    const list = document.getElementById('study-list');
    list.innerHTML = data.map((q, i) => {
        const locked = (vip !== '500' && i > 15);
        return `<div class="study-card" style="filter:${locked?'blur(4px)':'none'}">
            <b>Q: ${q.question}</b><br><span style="color:#FCD116">R: ${q.correct_answer}</span>
        </div>`;
    }).join('');
};

window.submitReview = async function() {
    const feedback = document.getElementById('user-feedback').value.trim();
    if (!feedback) return;
    await _supabase.from('comments').insert([{ pseudo: currentUser, text: feedback, type: 'review' }]);
    document.getElementById('rating-screen').style.display = 'none';
    showNotice("🙏 MERCI", "Ton avis est enregistré.");
};

// =========================================================
// 8. FONCTIONS INDISPENSABLES (PSEUDO, TIMER, ETC.)
// =========================================================
window.saveUser = function() {
    const p = document.getElementById('user-pseudo').value.trim();
    if(p.length < 2) return;
    localStorage.setItem('quiz_pseudo', p);
    currentUser = p;
    document.getElementById('login-screen').style.display = 'none';
};

window.forceLogin = function() {
    const login = document.getElementById('login-screen');
    if (!currentUser) login.style.display = 'flex'; else login.style.display = 'none';
};

function startTimer() {
    clearInterval(timer); let timeLeft = 15;
    timer = setInterval(() => {
        timeLeft--; document.getElementById('timer-text').innerText = `⏱️ ${timeLeft}s`;
        if(timeLeft <= 0) { clearInterval(timer); lives--; nextQuestion(); }
    }, 1000);
}

function updateHeader() {
    let h = ""; for(let i=0; i<3; i++) h += (i < lives) ? "❤️" : "🖤";
    document.getElementById('score-display').innerHTML = `Score: ${score} | ${h}`;
}

window.showNotice = function(t, m) {
    const modal = document.createElement('div');
    modal.className = "overlay-screen";
    modal.innerHTML = `<div style="background:#1a1a1a;padding:20px;border-radius:15px;border:2px solid #FCD116;text-align:center;width:80%;color:#fff;">
        <h3 style="color:#FCD116">${t}</h3><p>${m}</p>
        <button onclick="this.parentElement.parentElement.remove()" class="main-btn">D'ACCORD</button>
    </div>`;
    document.body.appendChild(modal);
};

window.displayComments = async function() {
    const div = document.getElementById('comments-display');
    const { data } = await _supabase.from('comments').select('*').order('id', { ascending: false }).limit(5);
    if (data) div.innerHTML = data.map(c => `<div style="font-size:0.8rem;"><b>${c.pseudo}</b>: ${c.text}</div>`).join('');
};

window.onload = () => { loadData(); window.forceLogin(); };
