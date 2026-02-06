# ♻️ Workflow: Recupero Carrelli Abbandonati

**File:** [`Workflow di Recupero Carrelli Abbandonati.json`](./Workflow%20di%20Recupero%20Carrelli%20Abbandonati.json)
**ID:** `8Q27KpNKGoum_eC7jSCnu`

## 📝 Descrizione
Sistema proattivo che gira in background. Recupera le chat interrotte dall'utente prima della conferma del ticket, le analizza con l'AI per capire se c'era un'intenzione seria di acquisto e se sono stati lasciati dati di contatto parziali, e invia un report via email per il recall manuale o WhatsApp.

## ⚡ Trigger
*   **Tipo:** Schedule (CRON)
*   **Frequenza:** Ogni 1 ora.

## ⚙️ Logica Principale

1.  **Fetch Orphan Sessions:** Interroga la vista Postgres `orphan_sessions_view` (sessioni inattive da >2 ore senza ticket associato).
2.  **Batch Processing:** Itera su ogni sessione trovata.
3.  **Ricostruzione Chat:** Recupera gli ultimi 30 messaggi della sessione e li formatta in un transcript leggibile (`USER: ...`, `ASSISTANT: ...`).
4.  **AI Analysis (Lead Scoring):**
    *   Usa un Agente AI specializzato (Lead Recovery Analyst).
    *   **Tasks:**
        1.  Capire l'intento (es. "Voleva un idraulico").
        2.  Estrarre contatti parziali (es. "Mi chiamo Marco", "Il mio numero è...").
        3.  Assegnare un **Lead Score (1-10)**.
    *   **Regole Score:**
        *   8-10: Intento chiaro + Telefono (Hot Lead).
        *   5-7: Intento chiaro + Nome (Warm Lead).
        *   <4: Spam o Curiosità (Discard).
5.  **Salvataggio DB:** Salva il risultato in `leads_recovery` con status `new` o `discarded` in base allo score.
6.  **Reportistica:**
    *   Query finale: Seleziona i lead `new` creati nell'ultima ora con score >= 5.
    *   Se trovati (>0), formatta una tabella HTML.
    *   Invia email a `bronovito@gmail.com` con il riepilogo "Lead da Recuperare".

## 📊 Criteri di Scoring (System Prompt)
*   **1-2:** Spam, "Ciao", "No grazie".
*   **3-4:** Intento specifico (es. "Costo idraulico?") ma **NESSUN contatto**.
*   **5-7:** Intento + Nome.
*   **8-10:** Intento + Telefono/Email.

## 💡 Note per l'AI Developer
*   Questo workflow non interagisce con l'utente, osserva e basta.
*   È fondamentale per il recupero entrate perse.
*   Se vuoi cambiare la soglia di notifica (es. avvisami anche per score 4), modifica la query nel nodo `Recupera i Lead Appena Salvati` e il nodo `If` filtro.
