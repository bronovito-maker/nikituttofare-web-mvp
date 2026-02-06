# 🤖 NikiTuttoFare n8n Architecture

Questa directory contiene la documentazione e i file JSON dei workflow di automazione che alimentano l'intelligenza di NikiTuttoFare.

## 🗺️ Mappa dei Workflow

| Workflow | File JSON | Documentazione | Scopo |
| :--- | :--- | :--- | :--- |
| **AI Chat Agent** | [`AI Agent.json`](./AI%20Agent.json) | [`WORKFLOW_CHAT_AGENT.md`](./WORKFLOW_CHAT_AGENT.md) | Cervello principale. Gestisce la chat con l'utente, la memoria e la qualifica del lead. |
| **Save Ticket Tool** | [`Tool - Save Ticket.json`](./Tool%20-%20Save%20Ticket.json) | [`WORKFLOW_SAVE_TICKET.md`](./WORKFLOW_SAVE_TICKET.md) | Tool richiamato dall'Agent. Salva il ticket su DB, notifica i tecnici su Telegram e genera i link di intervento. |
| **Abbandoned Cart Recovery** | [`Workflow di Recupero Carrelli Abbandonati.json`](./Workflow%20di%20Recupero%20Carrelli%20Abbandonati.json) | [`WORKFLOW_RECOVERY.md`](./WORKFLOW_RECOVERY.md) | Task pianificato (CRON). Analizza le chat abbandonate, estrae contatti persi e invia report via Email. |

## 🔗 Integrazioni Chiave

*   **Frontend (Next.js)**: Chiama il Webhook di `AI Chat Agent` via `components/chat/chat-interface.tsx`.
*   **Supabase**: Database principale per `messages`, `tickets`, `leads`.
*   **Telegram**: Canale di notifica operativa per i tecnici.
*   **Gmail**: Canale di reportistica per l'amministrazione (Recupero Lead).
*   **Google Gemini**: LLM Engine per tutte le decisioni intelligenti.

## 🛠️ Come Modificare

Se l'AI deve modificare la logica di business (es. aggiungere un campo al ticket o cambiare il prompt di sistema), consulta prima il file markdown specifico del workflow per capire dove intervenire.
