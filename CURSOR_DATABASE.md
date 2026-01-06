# 🗄️ SUPABASE SCHEMA DEFINITION

Use this structure for all database operations.

## TABLES

### 1. `profiles` (extends auth.users)
- `id` (uuid, PK, references auth.users)
- `email` (text)
- `full_name` (text, nullable)
- `phone` (text, nullable)
- `role` (text: 'user' | 'admin' | 'technician')
- `created_at` (timestamptz)

### 2. `tickets`
- `id` (uuid, PK)
- `user_id` (uuid, FK -> profiles.id)
- `status` (text: 'new' | 'assigned' | 'in_progress' | 'resolved' | 'cancelled')
- `category` (text: 'plumbing' | 'electric' | 'locksmith' | 'climate' | 'generic')
- `priority` (text: 'low' | 'medium' | 'high' | 'emergency')
- `description` (text)
- `address` (text, nullable)
- `payment_status` (text: 'pending' | 'paid' | 'waived') - *Future use*
- `created_at` (timestamptz)

### 3. `messages`
- `id` (uuid, PK)
- `ticket_id` (uuid, FK -> tickets.id)
- `role` (text: 'user' | 'assistant' | 'system')
- `content` (text)
- `image_url` (text, nullable) - *For photos uploaded in chat*
- `meta_data` (jsonb, nullable) - *For form data or tech details*
- `created_at` (timestamptz)

## STORAGE BUCKETS
- **`ticket-photos`**: Public or Authenticated. RLS: Users can upload, Admins can read all.