# PROGETTO: NikiTuttoFare (NTF) - Enterprise Edition

## MISSION
Trasformare NTF da chatbot a Piattaforma di Gestione Emergenze.
Focus: Fiducia, Sicurezza, Chiarezza Bancaria.

## STATUS: ✅ 10/10 ENTERPRISE PREMIUM

---

## TECH STACK (IMPLEMENTATO)

### Frontend
- **Framework:** Next.js 15 (App Router) ✅
- **React:** React 19 con Server Components ✅
- **TypeScript:** Strict mode, NO `any` ✅

### UI & Styling
- **UI Library:** Shadcn/UI (Radix Primitives) ✅
- **CSS:** Tailwind CSS ✅
- **Icons:** Lucide React ✅
- **Animations:** Framer Motion ✅

### Forms & Validation
- **Form Management:** React Hook Form ✅
- **Validation:** Zod (schema validation rigorosa) ✅

### State Management
- **Global State:** Zustand con persist ✅
  - `chat-store.ts` - Chat state
  - `auth-store.ts` - Auth state
- **Server State:** Native fetch + API Routes ✅

### Database & Auth
- **Database:** Supabase (PostgreSQL) ✅
- **Auth:** NextAuth v5 + JWT ✅
- **Storage:** Supabase Storage ✅

### AI Engine
- **Provider:** Google Gemini API ✅
- **Model:** gemini-1.5-flash (chat) ✅
- **Fallback:** Local analysis quando API non disponibile ✅

### Notifications
- **Telegram:** Bot API con fetch ✅
- **Email:** Resend (ready) ✅

---

## DESIGN SYSTEM "TRUST & CLARITY" ✅

### Colors
| Token | Value | Usage |
|-------|-------|-------|
| Background | slate-50/50 | Quasi bianco per fiducia |
| Text Primary | Slate-900 | Testo principale |
| Text Secondary | Slate-600 | Testo secondario |
| Brand Action | Blue-600 | Azioni primarie |
| Brand Urgent | Orange-600 | CTA urgenti |
| Success | Green-600 | Conferme |
| Error | Red-600 | Errori |

### Styling Rules
- **Radius:** 0.5rem (lg), 0.75rem (xl), 1rem (2xl) ✅
- **Glassmorphism:** Solo landing/login, MAI in chat ✅
- **Dark Mode:** Toggle disponibile, non forzata ✅
- **Shadows:** Subtle, con brand color per CTA ✅

### Typography
- **Font:** System font stack ✅
- **Weights:** 400 (normal), 600 (semibold), 700 (bold), 900 (black)

---

## ARCHITETTURA "GENERATIVE UI" ✅

L'AI non risponde con testo libero. L'AI restituisce JSON strutturati che il frontend renderizza come Componenti React.

### Response Types (Zod validated)
```typescript
type AIResponseType = {
  type: 'text' | 'form' | 'recap' | 'booking_summary' | 'confirmation';
  content: string | FormType | Record<string, unknown>;
}
```

### Generative Components
| Type | Component | Usage |
|------|-----------|-------|
| `text` | TextResponse | Messaggi semplici |
| `form` | FormResponse | Form dinamici |
| `recap` | RecapResponse | Riepilogo richiesta |
| `booking_summary` | BookingSummaryResponse | Dettagli prenotazione |
| `confirmation` | ConfirmationResponse | Conferma con next steps |

---

## SICUREZZA (PII PROTECTION) ✅

### Implementato
- Magic Link per accesso (no password complesse) ✅
- JWT session con ruoli (user/admin/technician) ✅
- RLS policies su Supabase ✅
- Guest access limitato alla chat ✅

### Da Implementare (Future)
- 🔜 Encryption PII in database
- 🔜 Dati sensibili visibili solo dopo pagamento (Stripe)
- 🔜 Audit log per accessi admin

---


## CHAT FLOW & BUSINESS LOGIC (STRICT) ⚖️

### 1. The "Price Gate" Rule
- **Constraint:** L'AI NON deve mai chiedere dati personali (indirizzo, telefono) PRIMA di aver mostrato il preventivo stimato.
- **Why:** Costruire fiducia trasparente.
- **Flow:**
  1.  Raccolta Dati (Città, Problema)
  2.  Calcolo Preventivo (Range Min-Max)
  3.  **UI Output:** Card Preventivo con bottoni [Accetta] / [Rifiuta]
  4.  Solo se [Accetta] -> Chiedi Dati Contatto.

### 2. Pricing Matrix (Reference)
| Categoria | Intervento | Range (€) |
| :--- | :--- | :--- |
| **Idraulico** | Sblocco semplice | 70 - 120 |
| **Idraulico** | Perdita importante | 100 - 250+ |
| **Elettrico** | Cambio presa | 60 - 90 |
| **Fabbro** | Apertura (no scasso) | 80 - 150 |
| **Clima** | Manutenzione | 70 - 100 |
| **Tuttofare** | Montaggio | 50 - 100 |

### 3. Admin & Server Actions
- **Security:** Usare SEMPRE `createAdminClient()` per operazioni privilegiate (es. messaggi admin, chiusura ticket).
- **Client-Side:** Usare `createBrowserClient()` solo per sottoscrizioni Realtime o fetch pubbliche.
- **Role:** L'Admin agisce come `role: 'assistant'` nella chat per prendere il controllo (Handoff).

---

## FILE STRUCTURE
```
nikituttofare-web-mvp/
├── app/
│   ├── admin/             # Secured Dashboard (Bronovito only)
│   ├── actions/           # Server Actions (Mutations)
│   ├── api/               # Route Handlers (Webhooks/Proxy)
│   ├── chat/              # Public Chat Interface
│   └── dashboard/         # Customer Area
├── components/
│   ├── admin/             # Admin-specific UI
│   ├── chat/              # Chat message bubbles & Inputs
│   └── ui/                # Shadcn Primitives
├── docs/                  # Project Documentation
├── lib/
│   ├── database.types.ts  # Supabase Generated Types
│   ├── supabase-server.ts # Server Clients
│   └── supabase-browser.ts # Client Singleton
└── supabase/              # Migrations & Seeds
```

## ENVIRONMENT VARIABLES
```env
# Core
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GOOGLE_GEMINI_API_KEY=

# Auth
NEXTAUTH_SECRET=

# Notifications
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
RESEND_API_KEY=
```
