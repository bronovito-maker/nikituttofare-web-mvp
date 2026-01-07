# Masterplan & Current Tasks

## Phase 1: Stability & Flow (Current)
- [ ] **Fix Chat Loop:** Risolvere il problema della validazione `details` che fallisce e resetta lo slot.
- [ ] **Fix Chat Logic:** Implementare il "Preventivo Gate" (Vedi `chat_functioning.md`).
- [ ] **Fix Telegram Timeout:** Gestire `ETIMEDOUT` nelle chiamate fetch verso Telegram.
- [ ] **Fix Auth Flow:** Separare creazione ticket (Pending) da invio notifica (Confirmed via Magic Link).
- [ ] **Technician Fast Login:** Implementare login via numero di telefono per accettazione incarichi.

## Phase 2: UX Improvements
- [ ] Aggiungere Avatar utente loggato nell'header.
- [ ] Hint "Scrivi qui per altri servizi" nella Home.
- [ ] Titoli Hero più grandi su Mobile.

## Known Issues (Da monitorare)
- La chat tende a concatenare tutto lo storico nel campo "Problema".
- L'utente a volte clicca la card ma il bot chiede di nuovo la categoria.
