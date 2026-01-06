# 🧠 PROJECT CONTEXT & UX GUIDELINES

## USER PERSONA
- **Il Cliente:** Gestore di hotel stressato o proprietario di casa (50+ anni). Ha un tubo rotto, perde acqua, ha fretta. Non vuole registrarsi con password complicate. Vuole premere un tasto e risolvere.
- **L'Admin (Tu):** Vuoi ricevere un ticket pulito e qualificato. Non vuoi perdere tempo a chiedere "dove abiti?" o "mi mandi la foto?".

## UX PHILOSOPHY: "Zero Cognitive Load"
1. **No Login Wall:** ✅ L'app è aperta. La chat è accessibile senza login. Il login scatta solo alla conferma intervento (Magic Link).
2. **Chat-First:** ✅ L'utente non compila form. Parla con Niki. È Niki che compila il form nel backend tramite AI.
3. **Feedback Rassicurante:** ✅ Colori Blu/Verde. Conferme sempre visibili ("Ho capito", "Tecnico avvisato").

## CRITICAL FLOW ✅ IMPLEMENTATO
1. Utente apre app → Vede landing page premium
2. Clicca "Richiedi Intervento" → Accede alla chat (SENZA LOGIN)
3. Seleziona categoria (Quick Actions) → Chat inizia con NikiBot
4. Utente descrive problema/invia foto → AI (Gemini) analizza
5. AI chiede indirizzo (se manca) tramite Generative UI
6. AI crea Ticket automaticamente → Notifica Telegram parte all'Admin
7. Prima della conferma → Magic Link Modal per email
8. Utente vede "Ticket Creato - Un tecnico ti contatterà"
9. Utente può vedere i suoi ticket nella Dashboard (/dashboard)

## PAGINE IMPLEMENTATE

### Pubbliche (Guest Access)
- `/` - Landing page premium con glassmorphism
- `/chat` - Chat AI con NikiBot (NO glassmorphism, design pulito)
- `/login` - Pagina login con Magic Link

### Protette (Require Auth)
- `/dashboard` - Dashboard cliente per visualizzare i propri ticket
- `/admin` - Dashboard admin per gestione completa ticket

## DESIGN NOTES
- **Chat Page:** NO glassmorphism per massima chiarezza durante l'emergenza
- **Landing/Login:** Glassmorphism per estetica premium
- **Dark Mode:** Toggle disponibile per utenti notturni (non forzata)
- **Background:** slate-50/50 (quasi bianco) per Trust & Clarity
