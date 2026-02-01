# NikiTuttoFare (NTF) Web MVP

[![Status](https://img.shields.io/badge/Status-Production%20Ready-green)]()
[![Stack](https://img.shields.io/badge/Stack-Next.js%20%7C%20Supabase%20%7C%20n8n-blue)]()

Piattaforma di assistenza domestica "Conversational-First". Un MVP che trasforma semplici chat in interventi tecnici gestiti, utilizzando l'AI per l'analisi e l'automazione per il dispatching.

---

## 📚 Documentazione

La documentazione è stata consolidata per chiarezza. Fai riferimento a questi file per dettagli specifici:

*   **[🤖 Sistema Chat AI](docs/CHAT_SYSTEM.md)**: Come funziona l'intelligenza artificiale, la state machine della chat, e l'integrazione tecnica con Supabase. Leggi qui per capire il flusso "Price Gate" e la validazione.
*   **[🔄 Workflow Operativi](docs/WORKFLOWS.md)**: I flussi di business completi. Gestione Clienti (Guest vs Logged), Logica dei Preventivi, Recupero Lead Persi e Assegnazione Tecnici.
*   **[📏 Regole di Progetto](docs/PROJECT_RULES.md)**: Coding standards, Tech Stack strict, Design System e Security compliance.

---

## 🚀 Quick Start

### Prerequisiti
*   Node.js 18+
*   Account Supabase
*   Chiave API Google Gemini

### Installazione

1.  **Clona e installa:**
    ```bash
    git clone https://github.com/nikituttofare-web-mvp.git
    cd nikituttofare-web-mvp
    npm install
    ```

2.  **Configura Ambiente:**
    Copia `.env.example` in `.env` e compila le variabili necessarie (Supabase URL/Key, Gemini Key).

3.  **Avvia:**
    ```bash
    npm run dev
    ```
    L'app sarà disponibile su `http://localhost:3000`.

---

## 🏗 Architettura in Pillole

1.  **Frontend:** Next.js 14 (App Router) con interfaccia "Generative UI" (Componenti React renderizzati da JSON AI).
2.  **Backend:** Supabase gestisce Auth, Database (Postgres) e Realtime.
3.  **AI Layer:** Google Gemini analizza l'intento utente e popola i campi strutturati.
4.  **Automation:** n8n funge da orchestratore per notifiche Telegram e recupero Lead.

---

## 🔐 Admin Access
L'accesso alla dashboard `/admin` è protetto da Middleware e RLS. Richiede un account con ruolo `admin` nella tabella `profiles`.

---

*Project by [Your Team/Name]*