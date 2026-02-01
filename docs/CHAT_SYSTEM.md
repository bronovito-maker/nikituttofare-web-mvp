# 🤖 AI Chat System Documentation

**Ultimo Aggiornamento:** 01/02/2026
**Stato:** Produzione (v2.0)

Questo documento è l'unica fonte di verità per il funzionamento, l'architettura e le regole della Chat Intelligente di NikiTuttoFare. Consolida le specifiche precedenti (`chat_functioning.md`, `CHAT_SUPABASE_INTEGRATION.md`, `test_checklist.md`).

---

## 1. Architettura & Flusso Logico

La chat non è un semplice scambiatore di messaggi, ma una **State Machine sequenziale** progettata per convertire una conversazione in un preventivo e poi in un ticket confermato.

### 1.1 State Machine (Strict Flow)
L'AI (Gemini) è istruita tramite `system-prompt.ts` per seguire rigorosamente questi step:

1.  **Initialization (The 4 Cards)**
    *   **Input:** L'utente apre la chat. Vede 4 card colorate (Idraulico, Elettricista, Fabbro, Clima).
    *   **Action:** Cliccando una card, la `CATEGORY` viene fissata.
    *   **Constraint:** L'AI non deve chiedere "Di cosa hai bisogno?" se l'utente ha già cliccato "Idraulico".

2.  **Diagnosis (Drill-Down)**
    *   **Goal:** Ottenere `CITY` e `DETAILS`.
    *   **Validation:**
        *   Se la città manca -> Chiedere.
        *   Se la descrizione è < 5 parole -> Chiedere dettagli specifici (es. "Perde acqua o non scalda?").
    *   **Constraint:** Se l'input è vago ("è rotto"), l'AI rifiuta di procedere e chiede una foto o più dettagli.

3.  **The "Price Gate" (CRITICO)**
    *   **Condition:** Abbiamo Categoria + Città + Dettagli sufficienti.
    *   **Action:** L'AI calcola un range di prezzo stimato (vedi `WORKFLOWS.md` per la matrice prezzi).
    *   **UI Output:** Renderizza una Card Preventivo con due bottoni: `[ ✅ Accetta ]` e `[ ❌ Rifiuta ]`.
    *   **RULE:** È **VIETATO** chiedere indirizzo esatto, telefono o email PRIMA che l'utente abbia cliccato "Accetta". Questo costruisce fiducia.

4.  **Data Collection (Post-Accettazione)**
    *   Solo dopo l'accettazione, l'AI chiede:
        *   Indirizzo esatto (Via e Civico).
        *   Numero di Telefono.
        *   (Solo se Guest) Email per la conferma.

5.  **Confirmation**
    *   **Guest:** Viene inviato un Magic Link via email. Status Ticket: `PENDING_VERIFICATION`.
    *   **Logged User:** Conferma immediata. Status Ticket: `CONFIRMED`.

---

## 2. Integrazione Tecnica (Supabase)

### 2.1 Struttura Dati
Il sistema si basa su tabelle Supabase con Row Level Security (RLS).

**Tabella `tickets`**
| Colonna | Tipo | Descrizione |
| :--- | :--- | :--- |
| `id` | uuid | PK |
| `status` | text | `new` (legacy), `pending_verification`, `confirmed`, `assigned`, `in_progress`, `resolved`, `cancelled` |
| `category` | text | `plumbing`, `electric`, `locksmith`, `climate`, `handyman`, `generic` |
| `priority` | text | `low`, `medium`, `high`, `emergency` (Calcolata da AI) |
| `chat_session_id` | text | ID univoco (cookie o SessionID) per collegare chat anonime |

**Tabella `messages`**
| Colonna | Tipo | Descrizione |
| :--- | :--- | :--- |
| `ticket_id` | uuid | FK verso Tickets |
| `role` | text | `user`, `assistant`, `system` |
| `content` | text | Testo del messaggio |
| `image_url` | text | URL pubblico della foto su Supabase Storage |

### 2.2 Componenti Chiave
*   **`ChatIntroScreen`**: Componente React che mostra le 4 card iniziali.
*   **`useChat` Hook**: Gestisce lo stato locale, l'invio ottimistico dei messaggi e la sincronizzazione con Supabase.
    *   *Auto-Ticket Creation:* Al primo messaggio, crea un ticket "ombra" nel DB.
*   **`MessageInput`**: Supporta caricamento immagini (max 10MB, preview locale). L'upload avviene su bucket `ticket-photos` prima di salvare il messaggio.

---

## 3. Protocollo di Test (Checklist)

### ✅ Scenario A: Guest User
1.  **Avvio:** Cliccare su una Card Categoria.
2.  **Guardrail:** Scrivere "Sono a Rimini" -> L'AI deve chiedere Via/Civico.
3.  **Guardrail:** Scrivere "è rotto" -> L'AI deve chiedere foto o dettagli.
4.  **Preventivo:** Deve mostrare range (X€ - Y€) e bottoni. NON deve promettere "Tecnico arriva in 10 min".
5.  **Auth:** Dopo aver dato i dati, deve apparire il form Email.
6.  **DB Check:** Il ticket deve essere `pending_verification`. Telegram NON deve suonare.
7.  **Magic Link:** Cliccare il link -> Ticket diventa `confirmed` -> Telegram suona.

### ✅ Scenario B: Logged User
1.  **Riconoscimento:** La chat saluta per nome?
2.  **Flow:** NON deve chiedere l'email.
3.  **Conferma:** Dopo aver dato i dati, il ticket diventa SUBITO `confirmed` e Telegram suona istantaneamente.

---

## 4. Note Sviluppatori & Troubleshooting
*   **Bug Frequente (429 Too Many Requests):** L'API `/api/assist` ha un rate limit. Se i test falliscono, attendere 60s.
*   **Privacy:** I messaggi Telegram nel canale pubblico NON contengono mai nome cognome o telefono, solo Città e Problema. I dati sensibili sono rivelati solo al tecnico assegnato.
