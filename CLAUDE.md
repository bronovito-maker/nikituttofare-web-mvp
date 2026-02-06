# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**NikiTuttoFare** is an AI-powered emergency home maintenance platform for the Rimini/Riccione area (Italy). The app converts natural conversations into structured service requests using a state-machine-driven chat interface with Google Gemini AI.

**Core Value Proposition:** Users describe problems in plain Italian → AI extracts structured data → Shows transparent price estimate → Technician claims job Uber-style.

## Development Commands

```bash
# Development
npm run dev                    # Start Next.js dev server (Turbopack)
npm run build                  # Production build (runs TypeScript, generates sitemap)
npm run start                  # Start production server

# Quality Assurance
npm run lint                   # ESLint check
npm run audit                  # Full audit: ESLint + TypeScript + npm audit
npm test                       # Run Vitest tests
npm run sonar:check            # Code quality analysis

# AI Testing (Important!)
npm run test:ai                # Test AI chat responses
npm run test:ai:emergency      # Test emergency flow specifically
npm run test:ai:category       # Test category detection

# Security
npm run security:test          # Run penetration tests
npm run generate-secret        # Generate secure secrets for env
```

## Architecture Overview

### Tech Stack (Strict - Do Not Deviate)

- **Framework:** Next.js 16.x (App Router, RSC by default)
- **Language:** TypeScript (strict mode, NO `any`)
- **Database:** Supabase (PostgreSQL + Auth + Storage + Realtime)
- **AI:** Google Gemini (`gemini-1.5-flash` for chat, `gemini-1.5-pro` for complex reasoning)
- **Styling:** Tailwind CSS + Shadcn/UI (Radix primitives)
- **State:** Zustand (UI only), React Query/SWR (server data)
- **Validation:** Zod for everything (API inputs, forms, env vars)
- **Monitoring:** Sentry (error tracking), Vercel Analytics, Microsoft Clarity

### Critical Architecture Patterns

#### 1. Supabase Client Separation (MUST FOLLOW)

There are THREE distinct Supabase clients - use the correct one:

```typescript
// Server Components, Route Handlers, Server Actions
import { createServerClient } from '@/lib/supabase-server';
const supabase = await createServerClient(); // Respects RLS, uses user's auth

// Admin operations (bypasses RLS) - USE SPARINGLY
import { createAdminClient } from '@/lib/supabase-server';
const adminSupabase = createAdminClient(); // Service role key, bypasses RLS

// Client Components
import { createBrowserClient } from '@/lib/supabase-browser';
const supabase = createBrowserClient(); // Browser-side client
```

**Critical Rule:** NEVER use `createAdminClient()` in public-facing features. Only for admin dashboard, cron jobs, or system operations.

#### 2. The Chat State Machine (Core Business Logic)

The AI chat is NOT free-form conversation. It follows a strict state machine:

1. **Category Selection** → User clicks one of 4 cards (Plumber, Electrician, Locksmith, HVAC)
2. **Diagnosis** → AI collects `city` + `problem_details` (minimum 5 words)
3. **Price Gate** → AI shows price estimate (e.g., "80-120€"). User must ACCEPT before proceeding
4. **Data Collection** → Only AFTER acceptance: collect exact address + phone
5. **Verification:**
   - **Guest users:** Email verification → Ticket status `pending_verification` → Magic link click → `confirmed`
   - **Logged users:** Instant `confirmed` status
6. **Technician Assignment** → Telegram notification → First-come-first-serve claim

**Implementation:** See `docs/CHAT_SYSTEM.md` for full state machine rules. The AI system prompt enforces this flow.

**Key Components:**
- `hooks/useChat.tsx` - Chat state management
- `app/api/assist/route.ts` - AI endpoint (Gemini)
- `components/chat/` - Chat UI components

#### 3. Authentication & Role-Based Routing

The app has THREE user types with distinct flows:

```typescript
// In middleware.ts and throughout the app:
const role = user?.user_metadata?.role; // 'customer' | 'technician' | 'admin'

// Routes:
// /dashboard/** - Customer area (RLS-protected)
// /technician/** - Technician area (requires technician role)
// /admin/** - Admin area (requires admin role OR email === 'bronovito@gmail.com')
```

**Middleware** (`middleware.ts`) handles:
- Session refresh
- Route protection by role
- Security headers (CSP, HSTS, etc.)
- Automatic redirects based on auth state

#### 4. Database Schema Patterns

**Critical Tables:**

```sql
-- tickets: Core business entity
- status: 'new' | 'pending_verification' | 'confirmed' | 'assigned' | 'in_progress' | 'resolved' | 'cancelled'
- category: 'plumbing' | 'electric' | 'locksmith' | 'climate' | 'handyman' | 'generic'
- priority: 'low' | 'medium' | 'high' | 'emergency' (AI-calculated)
- chat_session_id: Links anonymous chat to ticket

-- messages: Chat history
- ticket_id: FK to tickets
- role: 'user' | 'assistant' | 'system'
- image_url: Supabase Storage public URL

-- profiles: User data
- role: 'customer' | 'technician' | 'admin'
- loyalty_points: For gamification

-- technicians: Technician whitelist
- phone_number: Used for magic link auth
- coverage_area: Geographic boundary
```

**RLS is ENABLED on all tables.** Admin queries must use `createAdminClient()` to bypass RLS.

## Key Development Patterns

### Server Actions vs API Routes

**Prefer Server Actions for:**
- Form submissions
- Data mutations
- Simple CRUD operations

**Use API Routes for:**
- Webhooks (external systems calling in)
- Streaming responses (AI chat uses route for streaming)
- Non-form POST requests

### Image Uploads

Images go to Supabase Storage (`ticket-photos` bucket):

```typescript
// Always upload BEFORE saving message
const { data, error } = await supabase.storage
  .from('ticket-photos')
  .upload(`${ticketId}/${Date.now()}.jpg`, file);

const publicUrl = supabase.storage
  .from('ticket-photos')
  .getPublicUrl(data.path).data.publicUrl;

// Then save message with image_url
```

### AI Testing Protocol

**BEFORE deploying chat changes, run:**

```bash
npm run test:ai
```

This tests:
- Price gate enforcement (no data collection before acceptance)
- Category detection accuracy
- City validation
- Urgency scoring
- Prevention of AI "hallucinations" (e.g., promising "free service")

See `scripts/test-ai-responses.ts` for test scenarios.

## Critical Business Rules (DO NOT VIOLATE)

### 1. The Price Gate Rule
**Never collect personal data (address, phone, email) before the user accepts the price estimate.**

This builds trust. The chat must show the price range FIRST, then ask for contact info only after explicit acceptance.

### 2. Guest User Privacy
For unverified guest users:
- Ticket status MUST be `pending_verification`
- NO Telegram notifications until email verified
- Prevents spam tickets

### 3. Pricing Transparency
Price estimates must:
- Always show a RANGE (e.g., "80-120€")
- Include disclaimer: "Il prezzo finale verrà confermato dal tecnico in loco"
- Never promise "free" or "0€"

See `docs/WORKFLOWS.md` Section 3 for the pricing matrix.

### 4. Admin Access
Admin routes (`/admin/**`) are protected by:
1. Middleware check
2. RLS policies
3. Component-level role check

Admin email hardcoded: `bronovito@gmail.com`

## UI/UX Principles

### Design System
- **Colors:** Blue (trust), Orange (urgency), Slate (neutral)
- **Semantic tokens:** Use `bg-brand-action`, `text-muted-foreground` (see `globals.css`)
- **Radius:** Generous `rounded-xl` for friendly feel
- **Glassmorphism:** ONLY on landing/login pages. FORBIDDEN in chat (readability priority)

### Target Audience
Users are often stressed (emergency situations) and may not be tech-savvy. Design must be:
- **Zero cognitive load:** Big buttons, clear text, no jargon
- **Reassuring:** Professional color scheme, trust badges
- **Fast:** Loading states, optimistic UI updates

## Common Gotchas

### Next.js 16 + Turbopack
- There's a known InvariantError with Turbopack in dev mode (`self.__next_r` missing)
- This is a Next.js bug, not your code
- Already filtered in `sentry.client.config.ts` - ignore in Sentry

### Supabase RLS
- If you get "no rows returned" errors, check if you're using the right client
- Regular users CANNOT see other users' tickets (RLS enforced)
- Admin operations MUST use `createAdminClient()`

### Type Safety
- Database types are auto-generated in `lib/database.types.ts`
- Import with: `import type { Database } from '@/lib/database.types'`
- Use table row types: `type Ticket = Database['public']['Tables']['tickets']['Row']`

## Documentation Files

- `docs/CHAT_SYSTEM.md` - Chat state machine, AI integration
- `docs/WORKFLOWS.md` - Business flows (guest vs logged, technician claim)
- `docs/PROJECT_RULES.md` - Coding standards, design system
- `.cursorrules` - Legacy Cursor rules (mostly redundant with this file)

## Environment Variables

Required in `.env`:

```bash
# Supabase (Public)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Supabase (Server-only)
SUPABASE_SERVICE_ROLE_KEY=      # For admin operations

# AI
GOOGLE_GEMINI_API_KEY=          # For chat AI

# Optional
NEXT_PUBLIC_SENTRY_DSN=         # Error tracking
TELEGRAM_BOT_TOKEN=             # For technician notifications
```

## Testing Checklist Before Deploy

1. Run full audit: `npm run audit`
2. Test AI chat flows: `npm run test:ai`
3. Check TypeScript: `tsc --noEmit`
4. Test both guest AND logged user flows
5. Verify RLS policies still work (try accessing another user's ticket)
6. Check Sentry for new error patterns

## When Making Changes

**Chat/AI Changes:**
- Always test with `npm run test:ai` before committing
- Update `docs/CHAT_SYSTEM.md` if state machine changes
- Price matrix changes go in `docs/WORKFLOWS.md`

**Database Changes:**
- Run Supabase migrations
- Regenerate types: `npx supabase gen types typescript --project-id [id] > lib/database.types.ts`
- Update RLS policies if needed

**Component Changes:**
- Use existing Shadcn components from `components/ui/`
- Follow Tailwind semantic tokens from `globals.css`
- Prefer Server Components unless client-side interactivity needed

## Git Workflow

- Main branch: `main`
- Commit messages in Italian (project language)
- Co-authored commits include: `Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>`
