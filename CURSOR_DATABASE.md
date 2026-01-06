# 🗄️ SUPABASE SCHEMA DEFINITION

Use this structure for all database operations.

## STATUS: ✅ COMPLETAMENTE IMPLEMENTATO

## TABLES

### 1. `profiles` (extends auth.users)
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid, PK | References auth.users |
| `email` | text | Required |
| `full_name` | text | Nullable |
| `phone` | text | Nullable |
| `role` | text | 'user' \| 'admin' \| 'technician' |
| `created_at` | timestamptz | Auto-generated |

### 2. `tickets`
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid, PK | Auto-generated |
| `user_id` | uuid, FK | References profiles.id |
| `status` | text | 'new' \| 'assigned' \| 'in_progress' \| 'resolved' \| 'cancelled' |
| `category` | text | 'plumbing' \| 'electric' \| 'locksmith' \| 'climate' \| 'generic' |
| `priority` | text | 'low' \| 'medium' \| 'high' \| 'emergency' |
| `description` | text | Required |
| `address` | text | Nullable |
| `payment_status` | text | 'pending' \| 'paid' \| 'waived' |
| `created_at` | timestamptz | Auto-generated |

### 3. `messages`
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid, PK | Auto-generated |
| `ticket_id` | uuid, FK | References tickets.id |
| `role` | text | 'user' \| 'assistant' \| 'system' |
| `content` | text | Required |
| `image_url` | text | Nullable - For chat photos |
| `meta_data` | jsonb | Nullable - For form data/tech details |
| `created_at` | timestamptz | Auto-generated |

## STORAGE BUCKETS
- **`ticket-photos`**: Public or Authenticated
  - RLS: Users can upload their own photos
  - RLS: Admins can read all photos

## RLS POLICIES ✅ IMPLEMENTED
- Users can view/update own profile
- Users can create tickets for themselves
- Users can view own tickets and messages
- Admins/Technicians can view all (when enabled)

## DATABASE TYPES
TypeScript types are defined in:
- `lib/database.types.ts` - Supabase generated types
- `lib/types.ts` - Application types (Profile, Ticket, TicketMessage)

## MIGRATIONS
SQL migrations are in `supabase/migrations/`:
- `001_initial_schema.sql` - Tables, indexes, RLS policies, triggers

## API ENDPOINTS

### Tickets
- `POST /api/tickets` - Create ticket
- `GET /api/tickets` - Get user's tickets
- `GET /api/admin/tickets` - Get all tickets (admin)
- `PATCH /api/admin/tickets` - Update ticket status (admin)
- `GET /api/user/tickets` - Get current user's tickets

### Messages
- `POST /api/messages` - Save message
- `GET /api/messages?ticketId=xxx` - Get ticket messages

### AI
- `POST /api/assist` - AI chat endpoint (Gemini)

### Upload
- `POST /api/upload-image` - Upload photo to Supabase Storage
