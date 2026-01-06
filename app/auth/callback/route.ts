import { createServerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Auth Callback Route
 * Handles the Magic Link redirect from Supabase Auth.
 * Exchanges the auth code for a session and redirects to the target page.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  
  // Get auth code and next URL from query params
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/chat';
  
  if (code) {
    const supabase = createServerClient();
    
    // Exchange code for session
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Successful auth - redirect to target page
      return NextResponse.redirect(`${origin}${next}`);
    }
    
    console.error('Auth callback error:', error);
  }
  
  // Auth failed - redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
