# Piano Prodotto e Delivery
## App Interna Tecnico Android - Niki Tuttofare

## 1) Obiettivo
Costruire un'app interna Android, ad uso esclusivo del tecnico, per registrare e gestire i lavori ricevuti fuori dal sito (telefonate dirette), con supporto AI Gemini per assistenza operativa e pianificazione strumenti/materiali.

L'app deve permettere di:
- Inserire rapidamente un nuovo lavoro da chiamata.
- Salvare anagrafica cliente e dettagli intervento.
- Tracciare attrezzatura/materiali usati.
- Gestire un inventario tecnico con disponibilita' e soglie minime.
- Ricevere suggerimenti AI contestuali al singolo lavoro.
- Sincronizzare i dati per utente autenticato (tecnico) con account piattaforma esistente.
- Ricevere notifiche operative intelligenti (lavori, inventario, promemoria azioni mancanti).

## 2) Contesto Attuale (As-Is)
Il progetto esistente dispone gia' di:
- Stack moderno: Next.js + TypeScript + Supabase + Gemini.
- Area tecnico gia' implementata (`/technician/*`).
- Tabelle core gia' presenti (`tickets`, `messages`, `profiles`).
- Server Actions e API gia' operative per flussi tecnici.

Conclusione: non si parte da zero. La base e' solida e riduce complessita' e tempi.

## 3) Visione Target (To-Be)
Un unico hub operativo personale dove il tecnico puo':
- Aprire lavoro in meno di 60 secondi.
- Vedere storico completo lavori/clienti.
- Sapere prima di uscire se ha strumenti/materiali necessari.
- Chiedere all'AI cosa portare, come affrontare il problema, quali rischi controllare.
- Chiudere lavoro e registrare consuntivo economico e tecnico.
- Usare input vocale per dettare richieste/note quando non puo' digitare.
- Avere un assistente "per progetto/lavoro" che mantiene il contesto storico del singolo intervento.
- Essere avvisato in tempo utile su appuntamenti, carenze inventario e passi dimenticati.

## 4) Requisiti Funzionali
### 4.1 Gestione Lavori da Chiamata
- Creazione lavoro manuale con campi minimi:
  - Cliente (nome, telefono).
  - Data/ora appuntamento.
  - Indirizzo e citta'.
  - Descrizione problema.
  - Categoria (idraulico, elettrico, fabbro, clima, tuttofare).
- Stati lavoro:
  - `new` -> `assigned` -> `in_progress` -> `resolved` (riuso stati esistenti).
- Campo provenienza:
  - `source = phone_manual` (distinzione dai lavori entrati dal sito).
- Ownership e collaborazione:
  - Ogni lavoro ha `owner_technician_id` (responsabile principale).
  - Possibilita' futura di assegnare collaboratori (2-3 tecnici) con permessi controllati.

### 4.2 Scheda Intervento
- Dettaglio lavoro con:
  - Informazioni cliente.
  - Problema segnalato.
  - Note tecniche.
  - Foto prima/dopo.
  - Materiali e attrezzi utilizzati.
  - Esito finale e tempo effettivo.
- Quick actions operative:
  - Pulsante `Tap-to-Call` per chiamata immediata al cliente.
  - Tap su indirizzo per apertura diretta Google Maps con navigazione.

### 4.3 Inventario
- Catalogo elementi inventario:
  - Nome articolo, tipologia (`tool` o `material`), quantita', unita', soglia minima.
  - Posizione (furgone, magazzino, scaffale).
- Movimenti inventario:
  - Carico/scarico manuale.
  - Scarico automatico da chiusura lavoro.
- Alert:
  - Evidenza articoli sotto soglia.

### 4.4 Assistente AI Gemini
- Chat tecnica dedicata al lavoro corrente.
- Input AI:
  - Categoria lavoro, descrizione problema, storico simili, inventario disponibile.
  - Immagini del guasto (Gemini Vision) scattate in scheda intervento.
- Output AI atteso:
  - Checklist pre-intervento.
  - Strumenti/materiali consigliati da portare.
  - Passi diagnostici.
  - Rischi e verifiche di sicurezza.
  - Alternative se manca materiale.
  - Analisi visiva preliminare del guasto da foto (con confidenza e avvertenze).
- Memoria per progetto/lavoro:
  - Ogni ticket mantiene thread AI separato.
  - L'assistente recupera automaticamente cronologia note, materiali usati, decisioni e azioni svolte per quel ticket.
  - Nessun "mix" di contesto tra lavori diversi.
- Input vocale verso AI:
  - Il tecnico parla, il sistema converte speech-to-text e invia testo a Gemini.
  - Risposta AI in testo (output vocale non obbligatorio).
- Input immagine verso AI:
  - Il tecnico scatta/carica foto in ticket.
  - Gemini Vision usa foto + contesto ticket per suggerire strumenti/materiali e controlli.
  - Output sempre presentato come supporto decisionale, non diagnosi certa.

### 4.5 Storico e Ricerca
- Elenco lavori filtrabile per:
  - Cliente.
  - Data.
  - Stato.
  - Categoria.
- Ricerca full-text su descrizione e note tecniche.

### 4.6 Notifiche Operative
- Notifiche lavori programmati:
  - Reminder T-24h, T-2h e T-30min (configurabili).
  - Alert "sei in ritardo" se l'orario intervento e' superato e stato non avviato.
- Notifiche inventario:
  - Alert quando `qty_available <= min_threshold`.
  - Alert critico quando articolo essenziale arriva a zero.
- Notifiche "ti stai dimenticando qualcosa":
  - Checklist sicurezza non completata.
  - Materiali previsti da AI non ancora confermati nel kit intervento.
  - Lavoro chiuso senza compilare campi minimi di consuntivo.
- Centro notifiche in-app:
  - stato (`new`, `read`, `done`, `dismissed`)
  - priorita' (`high`, `medium`, `low`)

### 4.7 Specifica Gemini (Passi Chiari)
- Endpoint tecnico dedicato:
  - `POST /api/technician/assistant`
  - Separato da `/api/assist` (customer flow non va toccato).
- Input minimo endpoint:
  - `ticketId`
  - `message` (testo o trascrizione voce)
  - `source` (`text|voice`)
  - `images[]` facoltativo per Vision
- Output obbligatorio strutturato:
  - `summary`
  - `tools_to_bring`
  - `materials_to_check`
  - `safety_checklist`
  - `next_actions`
  - `confidence`
  - `disclaimer`
- Pipeline tecnica Gemini:
  1. autenticazione tecnico + controllo ownership ticket
  2. recupero contesto ticket (ticket, note, inventario, memoria)
  3. costruzione prompt tecnico (sicurezza-first)
  4. chiamata Gemini testo/vision
  5. validazione Zod output
  6. salvataggio risposta e update memoria ticket
  7. generazione notifiche intelligenti (se azioni mancanti)
- Guardrail obbligatori:
  - niente diagnosi certa da foto
  - niente contaminazione tra ticket diversi
  - risposta breve, operativa, in italiano semplice
  - fallback sicuro se AI indisponibile
- Documento operativo di riferimento:
  - `docs/GEMINI_TECHNICIAN_IMPLEMENTATION_GUIDE.md`

## 5) Requisiti Non Funzionali
- App veloce su Android anche in rete mobile.
- Interfaccia semplice e utilizzabile in condizioni operative reali.
- Sicurezza dati cliente (auth forte, RLS, log accessi).
- Affidabilita' salvataggio (bozze locali e retry in caso rete instabile).
- Estensibilita': pronta per futuri moduli (fatture, agenda, notifiche).
- Modalita' offline semplice:
  - Salvataggio locale note/interazioni essenziali quando non c'e' rete.
  - Sincronizzazione automatica appena la rete torna disponibile.
- Multi-utente futuro-ready:
  - Modello dati e permessi pronti a passare da 1 tecnico a piccolo team (2-3 utenti) senza refactor strutturale.

## 6) Strategia Android
### Opzione A - PWA Installabile (piu' rapida)
Pro:
- Time-to-market minimo.
- Riutilizzo quasi totale del codice Next.js.
- Aggiornamenti immediati senza store.

Contro:
- Limiti su integrazione nativa avanzata.

### Opzione B - Next.js + Capacitor (raccomandata dopo MVP)
Pro:
- APK Android installabile internamente.
- Accesso migliore a funzionalita' native (camera, file, notifiche).
- Stessa base web mantenuta.

Contro:
- Setup e manutenzione leggermente piu' complessi rispetto a sola PWA.

Decisione proposta:
1. MVP con PWA.
2. Packaging Capacitor dopo validazione operativa.

### 6.1 APK Per Uso Reale (Pixel 8 Pro)
- Obiettivo finale: app Android installabile come APK firmato, ottimizzata per uso quotidiano sul Pixel 8 Pro.
- Prerequisiti minimi:
  - Android Studio (gratuito)
  - Capacitor Android platform
  - Keystore Android per firma release
- Nota Keystore:
  - e' il "certificato di firma" della tua app Android.
  - senza keystore puoi generare debug APK, ma non una release affidabile da mantenere nel tempo.
  - va conservato in modo sicuro (backup offline + password forte).

## 7) Architettura Dati Proposta
### 7.1 Riuso Tabelle Esistenti
- `tickets`: resta la tabella principale dei lavori.
- `messages`: note/chat per lavoro.
- `profiles`: base identita' utenti tecnici gia' esistente (login e ruoli).

### 7.2 Nuove Tabelle
- `inventory_items`
  - `id`, `owner_id`, `name`, `item_type`, `qty_available`, `unit`, `min_threshold`, `location`, `created_at`, `updated_at`
- `job_inventory_usage`
  - `id`, `ticket_id`, `inventory_item_id`, `qty_used`, `unit`, `note`, `created_at`
- `inventory_movements` (consigliata)
  - `id`, `inventory_item_id`, `movement_type`, `qty`, `reason`, `ticket_id`, `created_at`
- `offline_queue` (opzionale per robustezza sync)
  - `id`, `owner_id`, `entity_type`, `payload`, `status`, `retry_count`, `last_error`, `created_at`
- `technician_notifications` (consigliata)
  - `id`, `owner_id`, `ticket_id`, `type`, `title`, `body`, `priority`, `status`, `scheduled_for`, `sent_at`, `meta_data`

### 7.3 Estensioni a `tickets`
- `source` (es. `website`, `phone_manual`)
- `scheduled_at`
- `work_summary`
- `actual_duration_minutes`
- `owner_technician_id` (tecnico responsabile)
- `assistant_thread_id` (thread AI dedicato al ticket)

### 7.4 Tabelle Future-Ready per Team
- `ticket_collaborators` (consigliata, futura)
  - `id`, `ticket_id`, `technician_id`, `permission`, `created_at`
  - Permessi suggeriti: `read`, `edit`, `close`

### 7.5 Memoria Assistente per Ticket
- `assistant_project_memory` (consigliata)
  - `id`, `ticket_id`, `summary`, `open_items`, `last_tools_used`, `last_updated_at`
- Aggiornamento memoria:
  - a ogni nuova nota lavoro
  - a ogni utilizzo inventario
  - a ogni scambio AI rilevante

Nota:
in alternativa minimale, alcuni campi possono vivere inizialmente in `meta_data` per ridurre effort nel MVP.

## 8) Sicurezza e Privacy
- Accesso consentito solo a ruolo `technician` autorizzato.
- RLS attive anche sulle nuove tabelle (scoping per `owner_id`).
- Nessun uso di `createAdminClient()` in feature operative pubbliche.
- Log applicativi senza dati sensibili in chiaro.
- Backup periodico DB e policy retention.
- Regole accesso team-ready:
  - Owner sempre `read/write`.
  - Collaboratori solo secondo permessi su `ticket_collaborators`.

### 8.1 Strategia Anti-Rottura Progetto Attuale
- Non modificare il customer flow esistente:
  - mantenere invariato `/api/assist` e la chat cliente.
- Implementare nuove feature tecnico in moduli separati:
  - `/api/technician/assistant`
  - pagine `/technician/*` dedicate.
- Database solo con migration additive:
  - aggiunta colonne/tabelle, nessuna rimozione distruttiva.
- Rollout graduale:
  - feature flag interno tecnico prima del rilascio pieno.
- Gate obbligatori prima merge:
  - `npm run lint`
  - `npm test`
  - `npm run test:ai` (regressione customer flow)

## 9) Piano di Lavoro (Sprint)
## Sprint 0 - Allineamento (1-2 giorni)
- Definizione campi obbligatori e flusso operativo reale.
- Mockup schermate principali.
- Decisione tecnica: avvio PWA.
- Definizione schema permessi multi-tecnico (anche se inizialmente usato da 1 tecnico).
- Seed iniziale inventario da storico lavori:
  - creare script seed con materiali/attrezzi piu' frequenti dai ticket storici.
  - usare il seed per testare subito AI tecnico su dati realistici.

Deliverable:
- Specifica definitiva MVP.

## Sprint 1 - Lavori da chiamata (4-6 giorni)
- Form `Nuovo Lavoro`.
- Salvataggio su `tickets` con `source=phone_manual`.
- Lista lavori e dettaglio intervento.
- Note tecniche e upload foto.
- Quick action `Tap-to-Call` in lista e scheda lavoro.
- Apertura Google Maps da indirizzo intervento.
- Sincronizzazione completa con account tecnico esistente (owner dei dati).

Deliverable:
- Flusso completo apertura/gestione/chiusura lavoro manuale.

## Sprint 2 - Inventario MVP (4-6 giorni)
- CRUD articoli inventario.
- Collegamento materiali usati al lavoro.
- Aggiornamento quantita' e alert sotto soglia.
- Notifiche inventario in esaurimento.

Deliverable:
- Inventario operativo con tracciamento consumi per lavoro.

## Sprint 3 - AI Assistente Tecnico (4-6 giorni)
- Endpoint AI dedicato area tecnico.
- Prompt contestuale con lavoro + inventario + storico.
- UI consigli AI in scheda lavoro.
- Checklist sicurezza AI pre-intervento (blocco soft prima dell'avvio lavoro):
  - Esempi: distacco corrente/gas, verifica DPI, isolamento area.
- Contesto AI per ticket:
  - Thread separato per ciascun lavoro.
  - Recupero memoria storica del ticket a ogni richiesta.
- Input vocale:
  - Pulsante microfono nella scheda lavoro.
  - Trascrizione in testo e invio a Gemini.
- Input immagini:
  - Upload foto guasto in ticket e invio a Gemini Vision.
  - Risposta con "cosa vedo", "cosa portare", "cosa controllare prima".
- Reminder intelligenti AI:
  - suggerimento automatico di azioni mancanti sul ticket corrente.

Deliverable:
- Assistente tecnico funzionante e utile in campo.

## Sprint 4 - Android Packaging e Hardening (3-5 giorni)
- Ottimizzazione mobile UX.
- Installabilita' Android (PWA migliorata o Capacitor APK).
- Test finali su dispositivi reali.
- Offline first semplice:
  - Coda locale per note lavoro.
  - Sync automatico al ripristino rete con gestione conflitti base (last-write-wins con log).
- Hardening vocale Android:
  - Gestione permessi microfono.
  - UI robusta per avvio/stop dettatura in cantiere.
- Notifiche push/local:
  - scheduling reminder appuntamenti
  - recap giornaliero lavori aperti e alert inventario

Deliverable:
- App interna Android pronta per uso quotidiano.

## 10) Stima Complessiva
- MVP utile in produzione personale: 2-4 settimane.
- Versione robusta completa: 4-8 settimane.

Variabili che impattano la durata:
- Livello di dettaglio inventario.
- Qualita' richiesta del motore AI contestuale.
- Necessita' offline avanzate.
- Necessita' packaging nativo immediato.

## 11) Rischi Principali e Mitigazioni
- Rischio: complessita' inventario sottostimata.
  - Mitigazione: partire da modello semplice (qty + soglia) e iterare.
- Rischio: suggerimenti AI poco utili all'inizio.
  - Mitigazione: prompt engineering incrementale + feedback loop dai lavori reali.
- Rischio: frizione operativa mobile.
  - Mitigazione: UI "tap-first", campi minimi, test reali in contesto tecnico.

## 12) KPI di Successo
- Tempo medio inserimento nuovo lavoro < 60 secondi.
- Riduzione dimenticanze strumenti/materiali.
- Percentuale lavori completati senza secondo passaggio per materiale mancante.
- Utilizzo AI per lavoro (adozione reale).
- Accuratezza inventario a fine settimana.
- Percentuale note salvate offline e sincronizzate con successo.
- Riduzione chiamate manuali fuori app grazie a `Tap-to-Call`.
- Adozione checklist sicurezza pre-intervento.
- Adozione input vocale (interazioni vocali su totale interazioni AI).
- Riduzione tempo medio di scrittura note in condizioni operative.
- Coerenza contesto AI per ticket (assenza di errori cross-progetto).
- Adozione analisi immagini AI per ticket.
- Riduzione uscite con attrezzatura incompleta grazie a suggerimenti da foto.
- Percentuale reminder lavori letti in tempo.
- Riduzione interventi con materiale mancante.
- Riduzione lavori avviati senza checklist sicurezza completata.

## 13) Out of Scope Iniziale
- Multi-tecnico complesso.
- Routing automatico interventi.
- Fatturazione elettronica avanzata.
- Integrazione ERP esterni.
- Output vocale TTS (non prioritario).

## 14) Decisione Operativa Proposta
Procedere con sviluppo in questo ordine:
1. Modulo lavori manuali.
2. Modulo inventario.
3. Modulo AI tecnico.
4. Packaging Android.

Questa sequenza massimizza valore immediato e minimizza rischio, mantenendo riuso dell'architettura attuale.

## 15) Implementazioni Suggerite Prioritarie (Confermate)
Le seguenti implementazioni sono confermate come prioritarie:
- `Tap-to-Call` dalla lista lavori e dalla scheda dettaglio.
- Apertura rapida Google Maps tramite tap su indirizzo.
- Modalita' offline first semplice per note e aggiornamenti critici.
- Checklist di sicurezza generata da AI, da completare prima dell'avvio intervento.
- Fondamenta dati/autorizzazioni per estensione futura a 2-3 tecnici.
- Assistente AI separato per ogni lavoro con memoria contestuale.
- Input vocale per inviare richieste a Gemini (risposta testuale).
- Analisi immagini guasto con Gemini Vision per suggerire strumenti/materiali.
- Sistema notifiche operative (lavori, inventario, reminder azioni mancanti).

## 16) Note Implementative per Voce e Team
- Voce (MVP):
  - Web Speech API in PWA dove disponibile.
  - Fallback a input manuale quando microfono/STT non disponibili.
- Voce (fase APK con Capacitor):
  - Plugin speech recognition per maggiore affidabilita' Android.
- Team-ready:
  - Anche con un solo utente iniziale, introdurre subito `owner_technician_id` e policy RLS per collaboratori futuri.

## 18) Note APK e Keystore (Operative)
- Android Studio:
  - serve per build, firma e generazione APK release.
- Flusso release APK:
  1. build app web
  2. sync Capacitor Android
  3. apertura progetto in Android Studio
  4. configurazione keystore release
  5. generazione APK firmato
  6. installazione e test su Pixel 8 Pro
- Ottimizzazione Pixel 8 Pro:
  - verificare performance su rete mobile reale
  - test notifiche foreground/background
  - test input vocale con mani occupate
  - test fotocamera/analisi immagini in condizioni luce diverse

## 17) Handoff Gemini per Antigravity
Ordine consigliato di implementazione:
1. DB + RLS + tipi (`assistant_project_memory`, `technician_notifications`, campi ticket).
2. Endpoint `/api/technician/assistant` solo testo (base stabile).
3. Memoria per ticket e contesto incrementale.
4. Input vocale (STT -> testo).
5. Gemini Vision su immagini ticket.
6. Reminder intelligenti + notifiche.
7. Hardening (timeout, retry limitato, rate limit, logging).

Gate di qualita' prima del merge:
- pass `npm run lint`
- pass `npm test`
- pass `npm run test:ai` (regressione customer flow)
- test manuale ticket A/B per isolamento contesto
- test foto guasto con disclaimer presente
