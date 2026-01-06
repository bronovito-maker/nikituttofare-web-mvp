# 🏗️ NikiTuttoFare (NTF) - Masterplan & Roadmap

## 🎯 Obiettivo
Piattaforma Enterprise per emergenze HORECA/Domestiche.
Filosofia: "Zero Cognitive Load" per l'utente, "Automazione" per l'admin.

## 📊 STATUS: 10/10 - PRODOTTO ENTERPRISE PREMIUM

---

## 🗺️ FASI DI SVILUPPO

### 🟢 FASE 1: Fondamenta (Database & Auth) ✅ COMPLETATA
1. **Schema DB:** ✅ Tabelle `profiles`, `tickets`, `messages` su Supabase
2. **Auth:** ✅ NextAuth con JWT + Magic Link ready
3. **Storage:** ✅ Bucket `ticket-photos` con policy RLS
4. **Types:** ✅ TypeScript strict types, no `any`

### 🟡 FASE 2: Business Core (AI Chat) ✅ COMPLETATA
4. **Chat Logic:** ✅ Chat salvata su DB, Gemini 1.5 Flash per classificazione
5. **Form Invisibile:** ✅ AI estrae dati e crea Ticket automaticamente
6. **Generative UI:** ✅ AI restituisce JSON → Frontend renderizza componenti React
7. **State Management:** ✅ Zustand per chat state + persist

### 🔵 FASE 3: Notifiche (Telegram Bot) ✅ COMPLETATA
6. **Telegram Dispatcher:** ✅ Notifica immediata su Gruppo Telegram Admin
   - Formato HTML con emoji per priorità
   - Include: ID, Categoria, Priorità, Indirizzo, Descrizione

### 🟣 FASE 4: Admin Dashboard ✅ COMPLETATA
7. **Pannello Admin** (`/admin`): ✅ 
   - Tabella ticket con filtri (status, categoria, priorità)
   - Ricerca full-text su descrizione/indirizzo
   - Cambio stato inline con dropdown
   - Stats cards (totali, nuovi, in corso, emergenze)
   - Responsive design

8. **Dashboard Cliente** (`/dashboard`): ✅
   - Lista ticket personali
   - Tracking stato in tempo reale
   - Banner tecnico in arrivo
   - Storico interventi completati

### 🟠 FASE 5: Pagamenti (Predisposizione) ✅ SCHEMA PRONTO
8. **Schema:** ✅ Colonna `payment_status` già presente nel DB
9. **Stripe:** 🔜 Da implementare in futuro

---

## 🆕 FUNZIONALITÀ EXTRA IMPLEMENTATE

### Magic Link Login Flow
- Modal per inserimento email alla conferma
- Guest access alla chat (no login wall)
- Login richiesto solo per dashboard

### Middleware Intelligente
- `/chat` → Guest access (no auth required)
- `/dashboard` → User auth required
- `/admin` → Admin role required

### Generative UI Components
- `TextResponse` - Testo semplice
- `FormResponse` - Form dinamici dall'AI
- `RecapResponse` - Riepilogo richiesta
- `BookingSummaryResponse` - Summary prenotazione
- `ConfirmationResponse` - Conferma con prossimi passi

### Design System Rispettato
- NO glassmorphism in chat (emergenza = chiarezza)
- Glassmorphism OK in landing/login
- Dark mode toggle (non forzata)
- Background slate-50/50

---

## 📁 STRUTTURA PROGETTO FINALE

```
app/
├── page.tsx              # Landing premium
├── login/page.tsx        # Magic Link login
├── chat/page.tsx         # Chat AI (Zustand)
├── dashboard/            # Client dashboard
│   ├── page.tsx
│   └── layout.tsx
├── admin/                # Admin dashboard
│   ├── page.tsx
│   └── layout.tsx
└── api/
    ├── assist/           # Gemini AI
    ├── tickets/          # CRUD tickets
    ├── messages/         # CRUD messages
    ├── admin/tickets/    # Admin API
    ├── user/tickets/     # User API
    └── upload-image/     # Storage upload

lib/
├── stores/
│   ├── chat-store.ts     # Zustand chat
│   └── auth-store.ts     # Zustand auth
├── supabase.ts           # Client factory
├── supabase-helpers.ts   # DB operations
├── notifications.ts      # Telegram + Email
├── ai-structures.ts      # Zod schemas
└── types.ts              # TypeScript types

components/
├── chat/
│   ├── generative-ui.tsx # AI UI components
│   ├── magic-link-modal.tsx
│   └── chat-messages.tsx
└── ui/                   # Shadcn components
```

---

## 🚀 NEXT STEPS (Future)
1. **Stripe Integration** - Pagamenti online
2. **Realtime** - Supabase Realtime per aggiornamenti live
3. **PWA** - App installabile
4. **Push Notifications** - Web push per utenti
5. **Tecnici App** - Dashboard dedicata tecnici
