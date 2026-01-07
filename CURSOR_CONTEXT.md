# Project Context: Niki Tuttofare (MVP)

## Tech Stack
- **Frontend:** Next.js 14+ (App Router), React, Tailwind CSS.
- **Backend:** Next.js Server Actions / Route Handlers.
- **Database & Auth:** Supabase (PostgreSQL, Auth via Magic Link).
- **AI Integration:** OpenAI/Anthropic API per l'agente conversazionale.
- **Notifications:** Telegram Bot API (Webhook/Polling).
- **Design Philosophy:** Mobile-First assoluto (thumb-friendly UI).

## Core Business Logic
La piattaforma connette utenti con emergenze domestiche (Idraulico, Elettricista, ecc.) a tecnici locali.
- **Zone:** Rimini, Riccione, Cattolica, Pesaro.
- **Pricing:** Preventivi dinamici (range min-max) generati dall'AI, confermati in loco.
- **SLA:** "Chiamata entro 30-60 min" (Non intervento garantito in quel tempo, ma contatto).

## Coding Standards
- Usare TypeScript rigoroso.
- Gestire sempre gli errori di rete (es. Telegram timeout).
- Non esporre mai dati sensibili nei log (eccetto in dev).
- **Strict Mode:** Il database è la fonte di verità. Gli ENUM nel codice devono matchare quelli su Supabase.
