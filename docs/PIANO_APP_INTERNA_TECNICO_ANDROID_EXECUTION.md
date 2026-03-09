# Piano Esecutivo Tecnico
## App Interna Tecnico Android - Checklist Operativa

Riferimento funzionale: [PIANO_APP_INTERNA_TECNICO_ANDROID.md](/Users/bronovito/Documents/Sviluppo-AI/Progetti-Web/nikituttofare-web-mvp/docs/PIANO_APP_INTERNA_TECNICO_ANDROID.md)

## 1) Obiettivo Esecutivo
Consegnare un MVP operativo per tecnico con:
- lavori manuali da chiamata
- inventario base
- assistente AI per ticket con memoria separata
- analisi immagini guasto (Gemini Vision)
- input vocale (speech-to-text)
- fondamenta multi-tecnico (2-3 utenti)
- notifiche operative (lavori programmati, inventario, reminder azioni mancanti)

## 2) Sequenza di Delivery
1. Sprint 0: setup e fondamenta dati/permessi
2. Sprint 1: lavori manuali + quick actions
3. Sprint 2: inventario MVP
4. Sprint 3: AI contestuale per ticket + voce + immagini
5. Sprint 4: offline semplice + hardening Android + notifiche

## 3) Sprint 0 - Fondamenta (1-2 giorni)
### DB
- [ ] Migration: aggiungere a `tickets`:
  - `source text default 'website'`
  - `scheduled_at timestamptz null`
  - `work_summary text null`
  - `actual_duration_minutes int null`
  - `owner_technician_id uuid null references profiles(id)`
  - `assistant_thread_id text null`
- [ ] Indici:
  - `tickets(owner_technician_id, status, created_at desc)`
  - `tickets(source, created_at desc)`

### Security/RLS
- [ ] Policy: owner tecnico puo' `select/insert/update` sui propri ticket.
- [ ] Policy futura-ready: supporto collaboratori (stub, anche senza UI).

### App
- [ ] Aggiornare tipi DB (`lib/database.types.ts`) dopo migration.
- [ ] Definire enum/const centrali per `source` e stati lavoro.
- [ ] Script seed inventario da storico lavori:
  - estrarre categorie materiali/attrezzi ricorrenti dai ticket esistenti
  - popolare `inventory_items` con quantita' iniziali realistiche per test

### Acceptance
- [ ] Un tecnico autenticato puo' creare e leggere solo i propri lavori manuali.
- [ ] Nessuna regressione nei flussi sito esistenti.
- [ ] Inventario seed disponibile e usabile nei test AI di Sprint 3.

## 4) Sprint 1 - Lavori Manuali + Quick Actions (4-6 giorni)
### UI/Pages
- [ ] Nuova pagina: `/technician/jobs/new` (form rapido).
- [ ] Aggiornare `/technician/jobs` con badge `source`.
- [ ] Aggiornare dettaglio `/technician/jobs/[id]`:
  - pulsante `Tap-to-Call`
  - link indirizzo -> Google Maps

### Server Actions / API
- [ ] Action: `createManualJob`.
- [ ] Action: `updateManualJob`.
- [ ] Validazioni Zod:
  - cliente
  - telefono
  - categoria
  - descrizione
  - data/ora appuntamento

### UX
- [ ] Obiettivo inserimento < 60 secondi (campi minimi + default intelligenti).
- [ ] Stato vuoto chiaro + CTA “Nuovo lavoro”.

### Acceptance
- [ ] Da Android, tecnico crea lavoro manuale completo.
- [ ] Da lista, chiama il cliente con un tap.
- [ ] Da scheda, apre Maps con un tap.

## 5) Sprint 2 - Inventario MVP (4-6 giorni)
### DB
- [ ] Migration: `inventory_items`
  - `id`, `owner_id`, `name`, `item_type`, `qty_available`, `unit`, `min_threshold`, `location`, `created_at`, `updated_at`
- [ ] Migration: `job_inventory_usage`
  - `id`, `ticket_id`, `inventory_item_id`, `qty_used`, `unit`, `note`, `created_at`
- [ ] Migration: `inventory_movements`
  - `id`, `inventory_item_id`, `movement_type`, `qty`, `reason`, `ticket_id`, `created_at`
- [ ] Migration: `technician_notifications`
  - `id`, `owner_id`, `ticket_id`, `type`, `title`, `body`, `priority`, `status`, `scheduled_for`, `sent_at`, `meta_data`

### Security/RLS
- [ ] Policy owner su `inventory_items`.
- [ ] Policy owner su `job_inventory_usage` via join ticket-owner.
- [ ] Policy owner su `inventory_movements`.

### UI/Actions
- [ ] Pagine: `/technician/inventory`, `/technician/inventory/new`.
- [ ] In scheda lavoro: sezione “Materiali usati”.
- [ ] Auto scarico inventario a chiusura lavoro.
- [ ] Alert articoli sotto soglia.
- [ ] Creazione notifica automatica quando scorta <= soglia.

### Acceptance
- [ ] Registrazione consumo su lavoro aggiorna quantita' inventario.
- [ ] Alert soglia visibile in dashboard inventario.
- [ ] Notifica inventario in esaurimento creata correttamente.

## 6) Sprint 3 - AI Per Ticket + Voce + Immagini (4-6 giorni)
### DB
- [ ] Migration: `assistant_project_memory`
  - `id`, `ticket_id`, `summary`, `open_items`, `last_tools_used`, `last_updated_at`
- [ ] (Opz.) `assistant_messages` se vuoi separare dallo storico `messages`.

### Gemini Delivery Contract (Obbligatorio)
- [ ] Non modificare `/api/assist` (flow customer).
- [ ] Implementare endpoint separato: `/api/technician/assistant`.
- [ ] Contratto request minimo:
  - `ticketId`, `message`, `source`, `images[]?`
- [ ] Contratto response minimo:
  - `summary`, `tools_to_bring`, `materials_to_check`, `safety_checklist`, `next_actions`, `confidence`, `disclaimer`
- [ ] Tutte le risposte validate da schema Zod prima del return.
- [ ] Fallback controllato se Gemini non disponibile (no crash UI).

### API AI
- [ ] Nuovo endpoint: `/api/technician/assistant`.
- [ ] Input endpoint:
  - `ticketId`
  - `userMessage`
  - `source: text|voice`
  - `images[]` (url/path immagini ticket)
- [ ] Retrieval contesto ticket:
  - dati ticket
  - note lavoro
  - consumi inventario
  - memory summary
  - immagini guasto piu' recenti
- [ ] Prompt guardrails:
  - no promesse economiche inventate
  - sicurezza prioritaria
  - checklist sintetiche e operative
  - no diagnosi certa da foto
  - nessun dato da altri ticket
- [ ] Trigger reminder intelligenti:
  - checklist sicurezza non completata
  - materiali suggeriti non confermati
  - consuntivo mancante prima chiusura

### UI
- [ ] Box AI nella scheda lavoro.
- [ ] Cronologia AI per ticket separata.
- [ ] Pulsante microfono:
  - avvio/stop dettatura
  - trascrizione in campo testo
  - invio a Gemini
- [ ] Upload/scatto foto guasto dalla scheda lavoro.
- [ ] Azione "Analizza foto" con risposta strutturata:
  - cosa vedo
  - cosa portare
  - cosa controllare

### Acceptance
- [ ] AI non mescola contesto tra ticket diversi.
- [ ] Input vocale produce testo inviabile all'AI.
- [ ] Checklist sicurezza visibile prima start lavoro (blocco soft).
- [ ] Reminder AI salvati nel centro notifiche ticket.
- [ ] Su foto guasto, AI restituisce suggerimenti operativi coerenti con il contesto ticket.
- [ ] Ogni risposta visiva include avvertenza "supporto decisionale, verifica in loco".
- [ ] In caso errore Gemini, endpoint ritorna fallback coerente + codice errore chiaro.

## 7) Sprint 4 - Offline Semplice + Android Hardening + Notifiche (3-5 giorni)
### Offline
- [ ] Coda locale note/azioni quando offline.
- [ ] Sync automatico on reconnect.
- [ ] Gestione conflitto base: `last-write-wins` + log eventi.

### Android
- [ ] Verifica installabilita' PWA su Android.
- [ ] Se necessario, packaging Capacitor (APK interno).
- [ ] Gestione permessi microfono affidabile.
- [ ] Notifiche local/push:
  - reminder lavori programmati (T-24h/T-2h/T-30min)
  - alert ritardo intervento
  - recap giornaliero attivita' aperte
- [ ] Configurazione build release in Android Studio.
- [ ] Creazione keystore Android release.
- [ ] Firma APK release con keystore.
- [ ] Installazione e validazione su Google Pixel 8 Pro.

### QA
- [ ] Test su rete instabile reale.
- [ ] Test su scenario mani sporche/guanti (solo voce + quick action).
- [ ] Test regressione flussi tecnico esistenti.
- [ ] Test ricezione notifiche con app in foreground/background.
- [ ] Test batteria/performance su Pixel 8 Pro (sessione operativa reale).
- [ ] Test camera + Gemini Vision in interno/esterno.

### Acceptance
- [ ] Note create offline vengono sincronizzate senza perdita.
- [ ] App usabile da smartphone Android in contesto operativo reale.
- [ ] Reminder lavori e alert inventario arrivano in tempo corretto.
- [ ] APK firmato installato e stabile su Pixel 8 Pro.

## 8) Fondamenta Multi-Tecnico (Future-Ready, da preparare ora)
### DB
- [ ] Migration (facoltativa ora, consigliata): `ticket_collaborators`
  - `id`, `ticket_id`, `technician_id`, `permission`, `created_at`

### Security
- [ ] RLS pronta per:
  - owner full access
  - collaborator access per permesso

### App
- [ ] Non esporre subito UI complessa team.
- [ ] Mantenere modello compatibile con 2-3 tecnici futuri.

## 9) File/Moduli Da Toccare (stima)
- [ ] `supabase/migrations/*` (nuove migration)
- [ ] `lib/database.types.ts`
- [ ] `app/actions/technician-actions.ts`
- [ ] `app/technician/jobs/page.tsx`
- [ ] `app/technician/jobs/[id]/page.tsx`
- [ ] `app/technician/dashboard/page.tsx`
- [ ] `components/technician/*` (nuovi componenti form/inventory/assistant)
- [ ] `app/api/technician/assistant/route.ts` (nuovo)
- [ ] `app/technician/notifications/page.tsx` (nuovo, centro notifiche)
- [ ] `lib/notifications.ts` (estensione canale notifiche tecnico interno)
- [ ] `scripts/seed-technician-inventory.ts` (nuovo, seed inventario realistico)

## 10) Definizione Di Fatto (DoD)
- [ ] Build e lint passano.
- [ ] TypeScript strict senza `any`.
- [ ] RLS testata con utente non owner.
- [ ] 3 test end-to-end manuali su Android:
  - crea lavoro -> chiama cliente -> apri maps
  - registra consumo inventario -> chiudi lavoro
  - dettatura vocale -> risposta AI contestuale ticket
- [ ] 1 test immagini:
  - foto guasto -> analisi Gemini Vision -> checklist/strumenti suggeriti in ticket
- [ ] 2 test notifiche:
  - reminder lavoro programmato arriva agli orari previsti
  - alert inventario sotto soglia viene generato e mostrato in app
- [ ] 1 test fallback:
  - simulazione AI down -> risposta fallback senza blocco del flusso tecnico
- [ ] 1 test release Android:
  - build release firmata, installata su Pixel 8 Pro, smoke test completo superato

## 12) Riferimento Implementativo Gemini
- [ ] Seguire `docs/GEMINI_TECHNICIAN_IMPLEMENTATION_GUIDE.md` punto per punto durante sviluppo e review.

## 13) Prerequisiti Build Android (Checklist)
- [ ] Android Studio installato.
- [ ] SDK Android aggiornato.
- [ ] Capacitor Android configurato nel progetto.
- [ ] Keystore release creato e archiviato in modo sicuro.
- [ ] Password keystore e key alias salvate in vault sicuro.

## 11) Stima Totale
- Sprint 0-1: 1-2 settimane
- Sprint 2-3: 2-3 settimane
- Sprint 4: 1 settimana
- Totale MVP robusto: 4-6 settimane
