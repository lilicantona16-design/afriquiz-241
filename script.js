const URL = 'https://cjxbsrudyqumeuvedozo.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqeGJzcnVkeXF1bWV1dmVkb3pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMzkwNzcsImV4cCI6MjA4NTgxNTA3N30.GTK9BWO87eCf3IAf_8OTy4T59nFl8-vjnWDMApUOHAo';
const _supabase = supabase.createClient(URL, KEY);

let allQuestions = [];

async function loadData() {
    try {
        // On récupère tout : category, difficulty, question, etc.
        const { data, error } = await _supabase.from('questions').select('*');
        
        if (error) throw error;

        allQuestions = data;
        console.log("✅ Données chargées. Colonnes détectées :", Object.keys(data[0]));
    } catch (e) {
        console.error("❌ Erreur de chargement :", e.message);
    }
}

function startQuiz(catSaisie) {
    // Filtrage qui ignore les majuscules et les espaces
    currentQuestions = allQuestions.filter(q => 
        q.category.trim().toLowerCase() === catSaisie.toLowerCase()
    );

    if (currentQuestions.length === 0) {
        alert("Pas encore de questions pour " + catSaisie);
        return;
    }

    // On mélange les questions
    currentQuestions.sort(() => 0.5 - Math.random());
    
    // Suite de la logique du quiz...
    currentIndex = 0;
    score = 0;
    document.getElementById('home-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    showQuestion();
}