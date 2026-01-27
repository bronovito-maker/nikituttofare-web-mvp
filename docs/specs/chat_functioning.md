# AI Chat State Machine (Strict Flow)

L'agente deve seguire questo flusso **sequenziale**. Non è permesso saltare step o chiedere dati personali prima del preventivo.

## 1. Initialization
- **Input:** Utente clicca Card o scrive messaggio.
- **Action:** Se clicca Card, lo slot `CATEGORY` è **LOCKED**. Non chiederlo di nuovo.

## 2. Diagnosis (Drill-Down)
- **Check:** Abbiamo la Città? Se no, chiedi.
- **Check:** Abbiamo il Problema specifico?
    - *Constraint:* Se `details` < 5 parole, invalidare e chiedere dettagli.
    - *Domanda:* Deve essere specifica per la categoria (es. Clima -> "Perde acqua o non raffredda?").

## 3. The "Price Gate" (CRITICAL)
- **Condition:** Abbiamo Categoria + Città + Problema.
- **Action:** L'AI calcola il range di prezzo.
- **UI Output:** Mostra il preventivo e renderizza DUE bottoni:
    - `[ ✅ Accetta Preventivo ]`
    - `[ ❌ Rifiuta ]`
- **Rule:** È VIETATO chiedere indirizzo o telefono prima che l'utente clicchi "Accetta".

## 4. Data Collection (Solo post-accettazione)
- Chiedi **Via e Civico**.
- Chiedi **Numero di Cellulare**.
- (Se user non loggato): Chiedi **Email**.

## 5. Confirmation
- Salva ticket come `PENDING_VERIFICATION`.
- Messaggio Chat: "Controlla la mail per confermare".
- **NON** inviare ancora a Telegram.
