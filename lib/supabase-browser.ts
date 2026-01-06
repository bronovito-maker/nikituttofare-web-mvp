// lib/supabase-browser.ts
// Browser-side Supabase client using @supabase/ssr

import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr';
import { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Browser-side Supabase client.
 * Use in: Client Components ('use client')
 * 
 * This client automatically handles cookie-based session management.
 */
export function createBrowserClient() {
  return createSupabaseBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey
  );
}
