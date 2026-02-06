# 🛠️ Workflow: Tool - Save Ticket

**File:** [`Tool - Save Ticket.json`](./Tool%20-%20Save%20Ticket.json)
**ID:** `zgpY-BqQHsSnNzpM0JIMH`

## 📝 Descrizione
Workflow "Tool" (sub-workflow) richiamato dall'AI Agent. Si occupa di persistere la richiesta di intervento confermata, creare il ticket ufficiale e notificare immediatamente la rete di tecnici.

## ⚡ Trigger
*   **Tipo:** `Execute Workflow Trigger` (Chiamata interna da un altro workflow)
*   **Input Data:** Oggetto JSON standardizzato `SAVE_TICKET` generato dall'AI.
    *   `customer_name`, `phone`, `city`, `address`, `description`, `category`, `price_min`, `price_max`.

## ⚙️ Logica Principale

1.  **Salvataggio Ticket:** Inserisce una nuova riga nella tabella `tickets` di Supabase con status `new`.
2.  **Aggiornamento Messaggi:** Esegue una query SQL (`UPDATE messages ...`) per collegare tutta la `chat_session_id` attuale al nuovo `ticket_id`. Questo archivia la conversazione sotto il ticket.
3.  **Salvataggio Chat History (Log):** Salva un blocco JSON grezzo della chat history associato al ticket (ridondanza di sicurezza).
4.  **Generazione Magic Link:** Crea il link unico per il tecnico: `https://nikituttofare.com/technician/job/{ticketId}`.
5.  **Notifica Telegram:**
    *   Controlla se c'è una foto (`If Photo exists`).
    *   **Con Foto:** Invia Messaggio con Foto + Didascalia al gruppo Telegram Tecnici.
    *   **Senza Foto:** Invia Messaggio Testuale al gruppo Telegram Tecnici.
    *   Il messaggio contiene i dettagli essenziali e il Magic Link per accettare il lavoro (Claim).
6.  **Log Notifica:** Registra l'invio nella tabella `technician_notifications`.

## 🔗 Output
Ritorna i dati del ticket creato al workflow chiamante (AI Agent), che poi li restituisce al frontend (anche se il frontend usa principalmente la risposta testuale).

## 💡 Note per l'AI Developer
*   Questo workflow è "stupido": esegue solo ordini. La logica decisionale è tutta nell'Agente.
*   Se cambi la struttura della tabella `tickets` su Supabase, devi aggiornare il mapping nel nodo `Salva Ticket` qui.
*   L'ID del gruppo Telegram e le credenziali del Bot sono salvati nelle Credentials di n8n.
