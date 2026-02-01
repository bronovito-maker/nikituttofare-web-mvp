# 📏 Project Rules & Standards

**Status:** Enterprise Premium (Strict Enforcement)

Questo documento definisce gli standard tecnici, stilistici e di sviluppo per il progetto NikiTuttoFare. Ogni PR o modifica deve aderire a queste regole.

---

## 1. Tech Stack (Strict)

*   **Framework:** Next.js 14+ (App Router). Utilizzare SEMPRE Server Components di default.
*   **Language:** TypeScript (Strict Mode). `any` è vietato.
*   **Styling:** Tailwind CSS + Shadcn UI.
    *   Usa i token di colore semantici (`bg-brand-action`, `text-slate-900`) definiti in `globals.css`.
    *   Nessun CSS inline o file `.css` separati (eccetto globals).
*   **State:**
    *   Global: Zustand (solo per UI state, auth, chat).
    *   Server Data: React Query o Native Fetch dentro Server Components.
*   **Validation:** Zod per Tutto. API Inputs, Forms, Environment Variables.
*   **Database:** Supabase (PostgreSQL). Accesso via `@supabase/ssr`.

---

## 2. Design Principles "Trust & Clarity"

L'interfaccia deve ispirare fiducia e professionalità.
*   **Colori:** Dominanza di bianchi (`slate-50`), accenti blu affidabili (`blue-600`) e arancione per urgenze (`orange-600`).
*   **Radius:** Generoso (`rounded-xl`). Design "chunky" e amichevole.
*   **Feedback:** Ogni azione (click, invio) deve avere un feedback visivo immediato (loading state, toast).
*   **Glassmorphism:** Consentito solo su Landing Page e Login. VIETATO nella Chat (leggibilità prioritaria).

---

## 3. Generative UI Pattern

L'AI non risponde con blocchi di testo markdown libero. L'AI restituisce JSON strutturati che il frontend renderizza come Componenti React interattivi.

**Tipi di Risposta Ammessi:**
*   `text`: Messaggio semplice.
*   `form`: Input strutturato (es. richiesta indirizzo).
*   `recap`: Card riepilogativa dei dati raccolti.
*   `booking_summary`: Preventivo finale con bottoni (Interattivo).

---

## 4. Security & Privacy

*   **Auth:** Supabase Auth è l'unica fonte di verità. Mai implementare sistemi di login custom.
*   **Server Actions:**
    *   Usa `createAdminClient()` (Service Role) SOLO per operazioni amministrative (bottoni admin, cron jobs).
    *   Usa `createClient()` (User Token) per tutto il resto per rispettare le policy RLS.
*   **Sensitive Data:** Indirizzi e telefoni dei clienti non devono mai apparire nel frontend pubblico o nei canali Telegram aperti.
*   **Environment:** Mai committare `.env`.

---

## 5. File Structure Convention

```
/app
  /admin        # Area protetta (Role Check obbligatorio)
  /chat         # Public Area
  /dashboard    # Private User Area
  /api          # Route Handlers (Zod validated)
/components
  /ui           # Shadcn (Atomic)
  /feature      # Feature specific (es. /chat, /admin)
/lib
  /supabase     # Clients & Helpers
  /utils        # Pure functions
```
