# 🧠 PROJECT CONTEXT & UX GUIDELINES

## USER PERSONA
- **Il Cliente:** Gestore di hotel stressato o proprietario di casa (50+ anni). Ha un tubo rotto, perde acqua, ha fretta. Non vuole registrarsi con password complicate. Vuole premere un tasto e risolvere.
- **L'Admin (Tu):** Vuoi ricevere un ticket pulito e qualificato. Non vuoi perdere tempo a chiedere "dove abiti?" o "mi mandi la foto?".

## UX PHILOSOPHY: "Zero Cognitive Load"
1. **No Login Wall:** L'app deve sembrare aperta. Il login scatta solo quando serve davvero o è trasparente (Magic Link).
2. **Chat-First:** L'utente non compila form. Parla con Niki. È Niki che compila il form nel backend.
3. **Feedback Rassicurante:** Usare colori rassicuranti (Blu, Verde). Confermare sempre ("Ho capito", "Tecnico avvisato").

## CRITICAL FLOW
1. Utente apre app -> Vede macro categorie (Idraulico, ecc).
2. Seleziona categoria -> Chat inizia.
3. Utente descrive/invia foto -> AI analizza.
4. AI chiede indirizzo (se manca).
5. AI crea Ticket -> Notifica Telegram parte all'Admin.
6. Utente vede "Ticket Creato - Un tecnico ti contatterà".