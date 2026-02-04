// --- CONFIGURATION SUPABASE ---
// REMPLACE LES TEXTES CI-DESSOUS PAR TES VRAIES CLÉS
const SUPABASE_URL = "https://cjxbsrudyqumeuvedozo.supabase.co";
const SUPABASE_KEY = "sb_publishable_30ieuDVyx_XK30YyvrIFCA_w244ofio

";

// Fonction pour récupérer les questions depuis la base de données
async function startQuiz(category) {
    console.log("Chargement du quiz : " + category);
    
    // On appelle Supabase
    const response = await fetch(`${SUPABASE_URL}/rest/v1/questions?category=eq.${category}`, {
        headers: {
            "apikey": SUPABASE_KEY,
            "Authorization": `Bearer ${SUPABASE_KEY}`
        }
    });

    const questions = await response.json();

    if (questions.length > 0) {
        // Pour l'instant, on affiche la première question dans une alerte pour tester
        alert("Première question : " + questions[0].question);
        console.log(questions);
    } else {
        alert("Bientôt disponible ! Pour l'instant, seules les catégories 'Provinces', 'Culture' et 'Géographie' ont des questions.");
    }
}

function showPaywall() {
    alert("Option VIP : Le paiement via Airtel/Moov Money arrive bientôt !");
}
