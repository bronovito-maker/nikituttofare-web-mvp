# User Flow & Security

## 1. Guest User (Nuovo)
1. Chat completa -> Inserimento Email.
2. DB: Crea User (se non esiste) e Ticket con status `PENDING_VERIFICATION`.
3. Email: Invia Magic Link con token di conferma.
4. **Action:** Utente clicca Link -> Redirect a `/verify`.
5. **Backend:**
   - Valida Token.
   - Update Ticket status -> `CONFIRMED`.
   - **TRIGGER TELEGRAM ALERT**.

## 2. Logged User (Di ritorno)
1. Rileva sessione (Supabase Auth).
2. Chat completa -> **Salta richiesta Email**.
3. Chiedi solo conferma finale ("Uso la mail xxxx@gmail.com?").
4. **Backend:**
   - Salva Ticket direttamente come `CONFIRMED`.
   - **TRIGGER TELEGRAM ALERT IMMEDIATO**.

## 3. Technician Flow (Accettazione)
1. Riceve notifica Telegram con Link: `/tecnico/claim/[ticket_id]`.
2. Clicca Link -> Browser.
3. **Auth Check:**
   - Se loggato come tecnico -> Assegna Ticket.
   - Se NON loggato -> Chiedi **Numero di Telefono**.
   - Verifica Whitelist numeri tecnici -> Login automatico -> Assegna Ticket.
