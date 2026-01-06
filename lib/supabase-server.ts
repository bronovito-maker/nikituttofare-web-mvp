// lib/supabase-server.ts
// Server-side only Supabase clients - DO NOT import in 'use client' components

import { cookies } from 'next/headers';
import { createClient, type CookieOptions } from '@supabase/supabase-js';
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
  const cookieStore = cookies();

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      flowType: 'pkce',
      autoRefreshToken: true,
      detectSessionInUrl: false,
      persistSession: true,
    },
    global: {
      headers: {
        'x-client-info': 'nikituttofare-web',
      },
    },
    cookies: {
      get(name: string) {
        const store = cookieStore as any;
        if (typeof store.get === 'function') {
          const cookie = store.get(name);
          return cookie?.value;
        }
        return undefined;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          const store = cookieStore as any;
          if (typeof store.set === 'function') {
            store.set(name, value, { path: '/', ...options });
          }
        } catch (error) {
          console.warn('Could not set cookie:', name);
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          const store = cookieStore as any;
          if (typeof store.set === 'function') {
            store.set(name, '', { path: '/', maxAge: 0, ...options });
          }
        } catch (error) {
          console.warn('Could not remove cookie:', name);
        }
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
