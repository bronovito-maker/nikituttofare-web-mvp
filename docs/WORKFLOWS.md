# 🔄 Business Workflows

**Ultimo Aggiornamento:** 01/02/2026
**Descrizione:** Mappatura dei flussi operativi per Clienti, Tecnici e recupero Lead.

---

## 1. Flussi Utente (Client Journey)

### 1.1 Guest User (Nuovo Cliente)
Il flusso è progettato per ridurre l'attrito iniziale (nessun login richiesto per chattare).
1.  **Chat Preliminare:** L'utente interagisce con l'AI, definisce il problema e riceve il preventivo.
2.  **Conversione:** Accetta il preventivo e fornisce i dati.
3.  **Soft Registration:** Inserisce l'email.
4.  **Verifica:**
    *   Il sistema crea un ticket in stato `PENDING_VERIFICATION`.
    *   Invia una email con Magic Link.
    *   *Nessun tecnico viene ancora allertato.*
5.  **Conferma:**
    *   L'utente clicca il link.
    *   Ticket -> `CONFIRMED`.
    *   Viene creato un account Utente "shadow" su Supabase se non esiste.
    *   **Notification:** Parte l'alert sul gruppo Telegram dei tecnici.

### 1.2 Logged User (Cliente di Ritorno)
1.  **Auth Check:** Supabase Auth riconosce la sessione attiva.
2.  **Chat:** Identica al Guest, ma salta la richiesta emai.
3.  **Fast Path:** Alla conferma del preventivo, il ticket va direttamente in stato `CONFIRMED`.
4.  **Notification:** Alert Telegram immediato.

---

## 2. Flusso Tecnico (Job Claim)

L'assegnazione dei lavori avviene tramite un sistema "Uber-style" basato sulla velocità (First-Come-First-Serve), ma moderato da Whitelist.

1.  **Notifica:** I tecnici ricevono un messaggio su Telegram:
    > 🛠 **NUOVA RICHIESTA: IDRAULICO**
    > 📍 Rimini, Via G... (Zona Centro)
    > ⚠️ Perdita tubo sotto lavello
    > 💰 Stima: 80-120€
    > [👉 Clicca qui per Accettare]
2.  **Claim Link:** Il link porta a `/tecnico/claim/[ticket_id]`.
3.  **Accesso:**
    *   Se il tecnico è già loggato nell'app -> Assegnazione.
    *   Se non loggato -> Chiede numero di cellulare -> Verifica se il numero è nella tabella `technicians` -> Login automatico via OTP/Magic Link.
4.  **Assegnazione:**
    *   Ticket -> `ASSIGNED`.
    *   Il tecnico vede ora i dati completi (Nome Cliente, Telefono, Indirizzo preciso via mappa).
    *   Il cliente riceve una notifica: "Il tecnico Mario sta arrivando".

---

## 3. Matrice Prezzi & Preventivazione

L'AI utilizza questa matrice di riferimento per generare le stime. I prezzi sono puramente indicativi.

| Categoria | Tipo Intervento (Keywords rilevate) | Range Min (€) | Range Max (€) |
| :--- | :--- | :--- | :--- |
| **Idraulico** | Sblocco scarico, lavandino lento | 70 | 120 |
| **Idraulico** | Perdita importante, tubo rotto, allagamento | 100 | 250+ |
| **Elettricista**| Cambio presa, interruttore, lampadario | 60 | 90 |
| **Elettricista**| Corto circuito, salvavita scatta, blackout parziale | 90 | 200 |
| **Fabbro** | Apertura porta (no chiavi, no scasso) | 80 | 150 |
| **Fabbro** | Cambio serratura, cilindro sicurezza | 120 | 250 |
| **Clima** | Manutenzione, pulizia filtri | 70 | 100 |
| **Clima** | Non raffredda, ricarica gas, errore scheda | 90 | 180 |
| **Tuttofare** | Montaggio mobile, mensola, piccole riparazioni | 50 | 100 |

**Regole di Output:**
*   Aggiungere sempre disclaimer: *"Il prezzo finale verrà confermato dal tecnico in loco."*
*   Mai promettere "Gratis" o "0€".

---

## 4. Recupero Lead (n8n Workflow)

Cosa succede se un utente abbandona la chat prima di confermare? Entra in gioco il **Lead Recovery Agent**.

### 4.1 Trigger
Un job pianificato (cron) su n8n scansiona la tabella `messages` cercando sessioni inattive da > 20 minuti che NON hanno un ticket associato.

### 4.2 Analisi AI
L'AI analizza la trascrizione della chat "orfana" con questo prompt di sistema:

*   **Analyze Intent:** Cosa cercava l'utente?
*   **Extract Contact:** Ha lasciato per caso un nome, un telefono o una città?
*   **Score Lead (1-10):**
    *   `1-2`: Spam, solo "ciao". -> Scarta.
    *   `3-5`: Intento valido ma nessun contatto. -> Ignora o salva per statistiche.
    *   `6-8`: Intento chiaro + Città/Nome. -> Bassa priorità.
    *   `9-10`: Urgenza + Telefono parziale o completo. -> **ALTA RIORITÀ**.

### 4.3 Azione
Se Score >= 6, n8n crea un record nella tabella `leads_recovery` e allerta l'amministrazione per un follow-up manuale ("Ciao, abbiamo visto che stavi cercando un idraulico, serve ancora aiuto?").
