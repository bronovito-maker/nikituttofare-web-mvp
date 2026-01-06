// lib/supabase-server.ts
// Server-side only Supabase clients - DO NOT import in 'use client' components

import { cookies } from 'next/headers';
import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_anon_key';

/**
 * Server-side Supabase client that persists/reads auth via Next.js cookies.
 * Use in: Route handlers, Server Components, Server Actions, Middleware
 *
 * ⚠️ DO NOT import this in Client Components ('use client')
 */
export function createServerClient() {
  return createSupabaseServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookies().then(store => store.getAll());
      },
      setAll(cookiesToSet) {
        cookies().then(store => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              store.set(name, value, options)
            );
          } catch (error) {
            console.warn('Could not set cookies:', error);
          }
        });
      },
    },
  });
}

/**
 * Admin Supabase client with service role key.
 * Bypasses RLS - use only in server-side code.
 * 
 * ⚠️ NEVER expose this client to the browser!
 */
export function createAdminClient() {
  const serviceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceUrl || !supabaseServiceRoleKey) {
    throw new Error(
      'Missing Supabase admin environment variables. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file.'
    );
  }

  return createClient<Database>(serviceUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        'x-client-info': 'nikituttofare-web-admin',
      },
    },
  });
}
