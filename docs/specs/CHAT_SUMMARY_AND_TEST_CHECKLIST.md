# 🧪 PROTOCOLLO DI COLLAUDO E2E - NikiTuttoFare

> **Versione:** 2.0  
> **Data:** 2026-01-06  
> **Autore:** QA Lead

---

## 📋 Setup Pre-Test

| Strumento | Configurazione |
|-----------|----------------|
| **Finestra 1** | Browser Incognito → `https://nikituttofare.com/chat` (Cliente) |
| **Finestra 2** | Supabase Dashboard → Table Editor → `tickets` (Monitor DB) |
| **Finestra 3** | Supabase Dashboard → Authentication → Users (Monitor Auth) |
| **Mobile** | Telegram → Gruppo Alert Tecnici |

---

## 🔄 Flusso Ticket - Diagramma Stati

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FLUSSO TICKET                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  UTENTE OSPITE:                                                         │
│  ┌──────────┐    ┌─────────────────────┐    ┌───────────┐              │
│  │ Dati     │───▶│ pending_verification│───▶│ confirmed │──▶ Telegram  │
│  │ raccolti │    │ (Magic Link sent)   │    │ (clicked) │              │
│  └──────────┘    └─────────────────────┘    └───────────┘              │
│                                                                         │
│  UTENTE LOGGATO:                                                        │
│  ┌──────────┐    ┌───────────┐                                          │
│  │ Dati     │───▶│ confirmed │──────────────────────────▶ Telegram     │
│  │ raccolti │    │ (instant) │                                          │
│  └──────────┘    └───────────┘                                          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔴 SCENARIO A: Utente Ospite/Nuovo

### Test 1.1: Messaggio Iniziale & UI

| # | Azione | Risultato Atteso | Check Tecnico |
|---|--------|------------------|---------------|
| 1.1.1 | Aprire `/chat` | 5 card categoria visibili | - |
| 1.1.2 | Cliccare su "Tuttofare" | Messaggio: "Vorrei un preventivo per un intervento generico" | Console: no errors |
| 1.1.3 | Verificare risposta AI | NON contiene "Ho bisogno urgente" | - |
| 1.1.4 | Verificare card recap | NON mostra `[object Object]` | DevTools → Elements |

### Test 1.2: AI Guardrails - Geolocalizzazione

| # | Azione | Risultato Atteso | Check Tecnico |
|---|--------|------------------|---------------|
| 1.2.1 | Scrivere "Sono a Rimini" | AI chiede Via e Civico | `missingSlots: ['streetAddress']` |
| 1.2.2 | Provare a procedere senza indirizzo | AI BLOCCA e ri-chiede | - |
| 1.2.3 | Fornire "Via Garibaldi 25" | AI accetta e procede | `serviceAddress: "Via Garibaldi 25, Rimini"` |

### Test 1.3: AI Guardrails - Foto/Descrizione Obbligatoria

| # | Azione | Risultato Atteso | Check Tecnico |
|---|--------|------------------|---------------|
| 1.3.1 | Chiedere "Quanto costa?" | AI rifiuta - chiede dettagli | No `priceEstimate` |
| 1.3.2 | Scrivere "è rotto" (<20 parole) | AI chiede FOTO o descrizione dettagliata | `hasDetailedDescription: false` |
| 1.3.3 | Caricare una foto | AI procede con preventivo | `hasPhoto: true` |
| 1.3.4 | Alternativa: descrizione 20+ parole | AI procede con preventivo | `wordCount >= 20` |

### Test 1.4: Preventivo e SLA

| # | Azione | Risultato Atteso | Check Tecnico |
|---|--------|------------------|---------------|
| 1.4.1 | Verificare range prezzo | Formato: "X€ - Y€" con disclaimer | Contiene "indicativo/stima" |
| 1.4.2 | Verificare promessa temporale | "chiamerà entro 30-60 min" (NON "arriverà") | Non contiene "arriverà in" |
| 1.4.3 | Verificare chiamata | Menziona "chiamata di conferma" | Contiene "chiamerà/contatterà" |

### Test 1.5: Flusso Email & Magic Link

| # | Azione | Risultato Atteso | Check Tecnico |
|---|--------|------------------|---------------|
| 1.5.1 | Fornire tutti i dati + telefono | Mostra `auth_required` | Response type: `auth_required` |
| 1.5.2 | Cliccare "Accedi per Confermare" | Redirect a `/login` | URL cambia |
| 1.5.3 | Inserire email nuova | Magic Link inviato | Email ricevuta |
| 1.5.4 | **CHECK DB** prima del click | `status: 'pending_verification'` | Supabase: tickets table |
| 1.5.5 | **CHECK Telegram** prima del click | **NESSUNA notifica** | Telegram: vuoto |
| 1.5.6 | Cliccare Magic Link | Redirect a `/chat` | URL: `/chat` |
| 1.5.7 | **CHECK DB** dopo il click | `status: 'confirmed'` | Supabase: tickets table |
| 1.5.8 | **CHECK Telegram** dopo il click | Notifica ARRIVATA | Messaggio con "Accetta Intervento" |
| 1.5.9 | Contenuto Telegram | Città, Problema, Range, Link | Privacy: no telefono/indirizzo completo |

---

## 🟢 SCENARIO B: Utente Già Loggato

### Test 2.1: Riconoscimento Sessione

| # | Azione | Risultato Atteso | Check Tecnico |
|---|--------|------------------|---------------|
| 2.1.1 | Aprire `/chat` da loggato | Avatar utente in header | `isAuthenticated: true` |
| 2.1.2 | Iniziare chat | AI NON chiede email | - |
| 2.1.3 | Completare tutti i dati | NON mostra `auth_required` | Response type: `confirmation` |

### Test 2.2: Flusso Diretto (Senza Magic Link)

| # | Azione | Risultato Atteso | Check Tecnico |
|---|--------|------------------|---------------|
| 2.2.1 | Confermare dati | Ticket confermato SUBITO | DB: `status: 'confirmed'` |
| 2.2.2 | **CHECK Telegram** | Notifica IMMEDIATA | Telegram: messaggio presente |

---

## ✅ CHECKLIST RAPIDA

```
□ 1. Card iniziali NON dicono "Ho bisogno urgente"
□ 2. Card recap NON mostrano [object Object]
□ 3. "Solo Rimini" → AI chiede Via/Civico
□ 4. "è rotto" (corto) → AI chiede foto/descrizione (20+ parole)
□ 5. Preventivo mostra range X€-Y€ con disclaimer
□ 6. Promessa: "chiamerà" NON "arriverà"
□ 7. Guest: mostra auth_required dopo tutti i dati
□ 8. DB: status = 'pending_verification' PRIMA del magic link
□ 9. Telegram: NESSUN messaggio PRIMA del magic link
□ 10. Click magic link → status = 'confirmed'
□ 11. Telegram: messaggio ARRIVA SOLO ORA
□ 12. Loggato: NON chiede email
□ 13. Loggato: ticket confirmed + Telegram IMMEDIATO
□ 14. Modal Magic Link: dice "in attesa verifica" NON "tecnico avvisato"
```

---

## 🔧 Bug Fix Applicati (v2.0)

| Bug ID | Problema | File | Fix Applicato |
|--------|----------|------|---------------|
| #1 | Status ticket 'new' invece di 'pending_verification' | `app/api/assist/route.ts` | ✅ Cambiato a `pending_verification` |
| #2 | Auth callback cercava 'new' | `app/auth/callback/route.ts` | ✅ Cerca `pending_verification` |
| #3 | Auth callback impostava 'assigned' | `app/auth/callback/route.ts` | ✅ Imposta `confirmed` |
| #4 | Utente loggato riceveva auth_required | `app/api/assist/route.ts` | ✅ Bypass per utenti autenticati |
| #5 | Validazione descrizione (8 parole vs 20) | `lib/system-prompt.ts` | ✅ Allineato a 20 parole |
| #6 | Magic Link Modal diceva "tecnico avvisato" | `components/chat/magic-link-modal.tsx` | ✅ Corretto messaggio |
| #7 | Default status in supabase-helpers | `lib/supabase-helpers.ts` | ✅ Default a `pending_verification` |
| #8 | Chat page redirect invece di modal | `app/chat/page.tsx` | ✅ Mostra MagicLinkModal |
| #9 | Opzione "continua come ospite" insicura | `components/chat/magic-link-modal.tsx` | ✅ Rimossa |
| #10 | Trust badge "Intervento in 60 min" | `app/chat/page.tsx` | ✅ Cambiato a "Chiamata in 60 min" |

---

## 📊 Tabella Stati Ticket

| Stato | Descrizione | Telegram Inviato? |
|-------|-------------|-------------------|
| `new` | Legacy - non più usato | ❌ |
| `pending_verification` | In attesa click Magic Link | ❌ |
| `confirmed` | Verificato, pronto per tecnico | ✅ |
| `assigned` | Tecnico ha accettato | - |
| `in_progress` | Intervento in corso | - |
| `resolved` | Completato | - |
| `cancelled` | Annullato | - |

---

## 🚨 Punti di Attenzione

1. **Privacy Telegram**: Il messaggio nel gruppo tecnici NON contiene:
   - Nome completo cliente
   - Numero di telefono
   - Indirizzo completo (solo città)
   
   I dati sensibili vengono rivelati SOLO dopo che il tecnico clicca "Accetta Intervento".

2. **Rate Limiting**: L'API `/api/assist` ha rate limiting attivo. Se i test falliscono con 429, attendere 1 minuto.

3. **Timeout Magic Link**: I ticket `pending_verification` hanno una finestra di 30 minuti per essere confermati via auth callback.

---

## 📝 Note per Sviluppatori

### File Chiave del Flusso

```
app/
├── api/
│   ├── assist/route.ts         # AI + creazione ticket
│   └── tickets/confirm/route.ts # Conferma manuale (fallback)
├── auth/
│   └── callback/route.ts       # Magic Link handler + conferma auto
├── chat/
│   └── page.tsx                # UI chat principale

lib/
├── system-prompt.ts            # Logica slot-filling + validazione
├── notifications.ts            # Telegram notifications
└── supabase-helpers.ts         # CRUD Supabase

components/chat/
├── magic-link-modal.tsx        # Modal richiesta email
└── generative-ui.tsx           # Rendering risposte AI
```

### Variabili Ambiente Richieste

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Telegram
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

# Email (Resend)
RESEND_API_KEY=

# AI
GOOGLE_GEMINI_API_KEY=
```

---

## ✍️ Firma Collaudo

| Campo | Valore |
|-------|--------|
| Data Test | _______________ |
| Tester | _______________ |
| Ambiente | ☐ Staging ☐ Production |
| Esito Globale | ☐ PASS ☐ FAIL |
| Note | _______________ |
