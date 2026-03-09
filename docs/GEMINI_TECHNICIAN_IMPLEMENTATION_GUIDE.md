# Gemini Implementation Guide (Handoff Antigravity)
## App Interna Tecnico Android - Contesto Completo + Passi Operativi

**Data:** 09/03/2026  
**Stato:** Pronto per esecuzione  
**Obiettivo:** implementare un assistente Gemini stabile, contestuale per ticket, con voce in input, immagini (Gemini Vision), memoria per progetto e notifiche intelligenti.

## 1) Contesto Piattaforma (As-Is)
Stack gia' in uso:
- Frontend: Next.js (App Router) + TypeScript
- Backend: Route handlers + Server Actions
- DB/Auth/Storage: Supabase
- AI chat esistente: Gemini su `/api/assist`
- Automazioni: n8n

File gia' rilevanti:
- `app/api/assist/route.ts` (integrazione Gemini attuale, customer flow)
- `lib/system-prompt.ts` (prompt/chat rules customer)
- `scripts/test-ai-responses.ts` (test suite AI esistente)
- `docs/PIANO_APP_INTERNA_TECNICO_ANDROID.md`
- `docs/PIANO_APP_INTERNA_TECNICO_ANDROID_EXECUTION.md`

Vincolo importante:
- Il nuovo assistente tecnico non deve rompere il customer flow esistente.
- Implementare endpoint separato tecnico: `app/api/technician/assistant/route.ts`.

## 2) Obiettivo Gemini (To-Be)
Per ogni ticket tecnico, Gemini deve:
- mantenere contesto isolato per singolo lavoro
- ricevere input testuale o vocale (STT lato client)
- analizzare immagini guasto (Gemini Vision)
- proporre strumenti/materiali/checklist sicurezza
- generare reminder intelligenti su azioni mancanti
- rispondere solo in testo strutturato, utile in campo

## 3) Requisiti Funzionali Gemini
### 3.1 Context Isolation per Ticket
- Ogni richiesta include `ticketId`.
- Recupero contesto dal DB:
  - `tickets` (descrizione, categoria, stato, indirizzo, appuntamento)
  - `messages` (note tecniche e cronologia)
  - `job_inventory_usage` + `inventory_items`
  - `assistant_project_memory` (summary incrementale)
- Mai usare cronologia di altri ticket.

### 3.2 Voice Input
- UI registra voce (Web Speech API / plugin Capacitor in seguito).
- Trascrizione inviata come testo a endpoint AI.
- Gemini risponde in testo (no TTS obbligatorio).

### 3.3 Vision Input
- Foto guasto caricata su Supabase Storage.
- Endpoint riceve URL/path immagine nel payload.
- Gemini Vision produce:
  - osservazioni visive preliminari
  - strumenti/materiali consigliati
  - controlli sicurezza
- Sempre con disclaimer: supporto decisionale, verifica in loco.

### 3.4 Reminder Intelligenti
- Da output AI estrarre TODO operativi.
- Se mancano passi critici, creare notifica in `technician_notifications`:
  - checklist non completata
  - materiale non confermato
  - consuntivo incompleto prima chiusura

## 4) Contratto API Proposto
Endpoint:
- `POST /api/technician/assistant`

Request (shape):
```json
{
  "ticketId": "uuid",
  "message": "testo utente o trascrizione voce",
  "source": "text | voice",
  "images": [
    {
      "url": "https://.../ticket-photos/...jpg",
      "caption": "facoltativa"
    }
  ],
  "mode": "diagnosis | prep | safety | recap"
}
```

Response (shape):
```json
{
  "ok": true,
  "ticketId": "uuid",
  "assistant": {
    "summary": "Sintesi breve",
    "observations": [
      "Cosa vede/ha capito"
    ],
    "tools_to_bring": [
      "chiave inglese 12"
    ],
    "materials_to_check": [
      "guarnizione 1/2"
    ],
    "safety_checklist": [
      "stacca corrente",
      "indossa DPI"
    ],
    "next_actions": [
      "verifica tenuta raccordo"
    ],
    "confidence": "low | medium | high",
    "disclaimer": "Analisi di supporto: verificare sempre in loco."
  },
  "notifications_created": 1
}
```

Error response:
```json
{
  "ok": false,
  "code": "VALIDATION_ERROR | AI_UNAVAILABLE | FORBIDDEN | NOT_FOUND",
  "message": "..."
}
```

## 5) Prompt Strategy (Tecnico)
System prompt tecnico (separato dal customer prompt) con regole:
1. Priorita' sicurezza sempre prima.
2. Niente promesse assolute o diagnosi definitive da foto.
3. Risposta breve, operativa, in italiano semplice.
4. Output in JSON valido e aderente allo schema.
5. Se dati insufficienti: chiedere solo la domanda minima necessaria.
6. Mai includere dati di ticket diversi.

Template prompt (alto livello):
- Identita': assistente tecnico di campo.
- Contesto ticket serializzato (solo dati necessari).
- Inventario disponibile e soglie.
- Eventuali immagini.
- Istruzioni output JSON.

## 6) Schema Dati Minimo (per Gemini tecnico)
Tabelle/estensioni richieste:
- `tickets`: `assistant_thread_id`, `owner_technician_id`, `source`, `scheduled_at`
- `assistant_project_memory`:
  - `ticket_id`
  - `summary`
  - `open_items` (jsonb)
  - `last_tools_used` (jsonb/string)
  - `last_updated_at`
- `technician_notifications`:
  - `owner_id`, `ticket_id`, `type`, `priority`, `status`, `scheduled_for`, `meta_data`

## 7) Pipeline Operativa Endpoint
1. Autenticazione tecnico (`createServerClient`).
2. Verifica ownership/collaborator permission su ticket.
3. Validazione Zod request.
4. Recupero contesto ticket (query aggregate minimali).
5. Costruzione prompt tecnico.
6. Chiamata Gemini:
   - testo: modello flash
   - immagini: modello Gemini multimodale compatibile Vision
7. Parse + validazione risposta (Zod strict).
8. Persistenza:
   - salva messaggio AI in `messages` (o tabella dedicata)
   - aggiorna `assistant_project_memory`
   - crea notifiche se necessario
9. Ritorna payload strutturato.

## 8) Guardrail di Stabilita'
- Timeout AI + retry limitato (max 1 retry).
- Fallback sicuro se AI down:
  - risposta standard operativa
  - nessun blocco UI
- Rate limit endpoint tecnico dedicato.
- Sanitizzazione input testo e limiti dimensione immagini.
- Logging strutturato senza PII sensibile.

## 9) Integrazione n8n (quando utile)
Uso consigliato n8n per:
- reminder programmati (T-24h/T-2h/T-30min)
- recap giornaliero lavori aperti
- alert inventario critici

Scelta architetturale:
- business rule real-time in app backend
- scheduler/notifiche temporizzate in n8n

## 10) Checklist Implementazione (ordine consigliato)
1. DB migrations + RLS (`assistant_project_memory`, `technician_notifications`, campi ticket).
2. Endpoint `POST /api/technician/assistant` base testo.
3. Integrazione memoria per ticket.
4. Integrazione voice input (solo trascrizione -> testo).
5. Integrazione immagini Gemini Vision.
6. Trigger reminder intelligenti.
7. Hardening (timeout, fallback, rate limit, logging).
8. QA end-to-end Android.

## 11) Test Plan (obbligatorio)
### Test Funzionali
- Ticket A e Ticket B: verificare isolamento contesto.
- Voice flow: dettatura -> testo -> risposta AI.
- Vision flow: foto guasto -> suggerimenti strumenti/materiali coerenti.
- Reminder flow: checklist mancante -> notifica creata.

### Test Sicurezza
- Utente tecnico non owner non deve leggere/scrivere ticket altrui.
- Nessun dato sensibile cross-ticket in risposta AI.

### Test Robustezza
- Simulare AI unavailable -> fallback corretto.
- Simulare rete lenta -> timeout gestito.
- Simulare payload immagine grande -> errore validazione chiaro.

### Comandi minimi QA
- `npm run lint`
- `npm test`
- `npm run test:ai` (per non rompere il customer flow)

## 12) Definition of Done (Gemini Modulo Tecnico)
- Endpoint tecnico stabile in produzione.
- Output JSON sempre valido (o fallback controllato).
- Nessuna contaminazione contesto tra ticket.
- Voice input operativo (STT -> testo).
- Vision operativo su foto ticket.
- Notifiche intelligenti generate correttamente.
- Nessuna regressione su `/api/assist`.

## 13) Rischi e Mitigazioni
- Rischio: output vision poco affidabile su foto scadenti.
  - Mitigazione: chiedere foto migliore + confidenza + disclaimer.
- Rischio: token cost elevato con contesto troppo grande.
  - Mitigazione: summary incrementale in `assistant_project_memory`.
- Rischio: team scaling futuro.
  - Mitigazione: introdurre subito owner/collaborator model.

## 14) Handoff Notes per Antigravity
- Leggere prima:
  1. `docs/PIANO_APP_INTERNA_TECNICO_ANDROID.md`
  2. `docs/PIANO_APP_INTERNA_TECNICO_ANDROID_EXECUTION.md`
  3. questo file
- Non modificare la logica customer in `/api/assist`.
- Lavorare per PR incrementali:
  1. DB + endpoint testo
  2. memoria ticket
  3. voce
  4. vision
  5. notifiche intelligenti

Fine guida.

