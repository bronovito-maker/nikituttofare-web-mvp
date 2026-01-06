// lib/supabase.ts
// Re-exports for backwards compatibility
// 
// ⚠️ IMPORTANT: Import from the specific files instead:
// - Client Components: import { createBrowserClient } from '@/lib/supabase-browser'
// - Server Components/API: import { createServerClient, createAdminClient } from '@/lib/supabase-server'

// Re-export browser client (safe for client components)
export { createBrowserClient } from './supabase-browser';

// Note: Server functions are NOT re-exported here to prevent accidental
// imports in client components. Import them directly from supabase-server.ts
