// lib/supabase-browser.ts
// Client-side only Supabase client - safe to use in 'use client' components

import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_anon_key';

/**
 * Browser-side Supabase client for Client Components.
 * Persists session in localStorage/cookies automatically.
 * 
 * Use this in components with 'use client' directive.
 */
export function createBrowserClient() {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      flowType: 'pkce',
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: {
        'x-client-info': 'nikituttofare-web',
      },
    },
  });
}
