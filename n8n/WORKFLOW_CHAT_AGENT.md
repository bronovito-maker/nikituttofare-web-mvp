# 🧠 Workflow: AI Chat Agent

**File:** [`AI Agent.json`](./AI%20Agent.json)
**ID:** `Ch8iTXvpXrn0cH_NEAlkq`

## 📝 Descrizione
Questo è il cuore del sistema. Riceve i messaggi dagli utenti via Webhook, mantiene il contesto della conversazione (Memoria), consulta l'LLM (Gemini) per generare risposte e, quando identifica una richiesta di intervento confermata, delega il salvataggio al workflow secondario.

## ⚡ Trigger
*   **Tipo:** Webhook (POST)
*   **Endpoint:** `/chat` (Gestito da N8N Cloud o Tunnel)
*   **Input Payload:**
    ```json
    {
      "message": "Ho un problema al rubinetto",
      "chatId": "session_uuid_v4",
      "photo_url": "https://examle.com/photo.jpg" (Opzionale)
    }
    ```

## ⚙️ Logica Principale

1.  **Parse Input:** Pulisce il messaggio e gestisce eventuali URL di foto (inserendoli nel testo per la "visione" dell'AI).
2.  **Check Photo:** Se c'è una foto, scarica il file per passarlo al modello multimodale.
3.  **Supabase Storage (User):** Salva il messaggio utente nella tabella `messages`.
4.  **AI Processing (LangChain + Gemini):**
    *   Usa `Postgres Chat Memory` per il contesto storico.
    *   Analizza l'intento dell'utente.
    *   **System Prompt:** Contiene le regole di business, il listino prezzi e la logica di estrazione JSON (`SAVE_TICKET`).
5.  **Supabase Storage (AI):** Salva la risposta dell'AI nella tabella `messages`.
6.  **JSON Extraction (Code Node):** Analizza la risposta testuale dell'AI cercando un blocco JSON nascosto con `action: "SAVE_TICKET"`.
7.  **Branching (IF save_needed):**
    *   **SE TRUE:** Chiama il Sub-Workflow [`Tool - Save Ticket`](./WORKFLOW_SAVE_TICKET.md).
    *   **SE FALSE:** Risponde direttamente al webhook.
8.  **Response:** Ritorna il testo pulito al frontend + eventuali flag di debug.

## 📤 Output Webhook
```json
{
  "text_response": "Certamente, un idraulico arriverà tra poco...",
  "save_needed": true,
  "chat_session_id": "...",
  "debug_error": "..."
}
```

## 💡 Note per l'AI Developer
*   Se devi modificare il **Listino Prezzi** o il **Tono di Voce**, modifica il *System Message* nel nodo `AI Agent`.
*   Se devi aggiungere nuovi campi al Ticket (es. `email`), devi aggiornare sia il *System Prompt* (per istruire l'AI a chiederla ed estrarla) sia la logica di parsing nel nodo `Code in JavaScript`.
