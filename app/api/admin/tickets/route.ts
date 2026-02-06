import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient, createAdminClient } from '@/lib/supabase-server';
import { getCurrentUser } from '@/lib/supabase-helpers';


// Define a type for our filters for clarity
type TicketFilters = {
  status?: string;
  category?: string;
  priority?: string;
  search?: string;
};

// Sanitize search string to prevent SQL injection and DoS attacks
function sanitizeSearchInput(input: string | undefined): string | undefined {
  if (!input) return undefined;

  // Limit length to prevent DoS
  const truncated = input.slice(0, 100);

  // Escape special SQL LIKE characters: %, _, \
  // This prevents wildcard injection
  const escaped = truncated.replace(/[%_\\]/g, '\\$&');

  return escaped;
}

// Zod schema for validating PATCH request body
const patchTicketSchema = z.object({
  ticketId: z.string().uuid(),
  status: z.enum(['new', 'pending_verification', 'confirmed', 'assigned', 'in_progress', 'resolved', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'emergency']).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const supabase = await createServerClient();
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    const adminClient = createAdminClient();

    const { searchParams } = new URL(request.url);
    const filters: TicketFilters = {
      status: searchParams.get('status') || undefined,
      category: searchParams.get('category') || undefined,
      priority: searchParams.get('priority') || undefined,
      search: sanitizeSearchInput(searchParams.get('search') || undefined),
    };

    let query = adminClient
      .from('tickets')
      .select(`
        *,
        profiles (
          email,
          full_name,
          phone
        )
      `)
      .order('created_at', { ascending: false });

    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    if (filters.category && filters.category !== 'all') {
      query = query.eq('category', filters.category);
    }
    if (filters.priority && filters.priority !== 'all') {
      query = query.eq('priority', filters.priority);
    }
    if (filters.search) {
      query = query.or(`description.ilike.%${filters.search}%,address.ilike.%${filters.search}%`);
    }

    const { data: tickets, error } = await query;

    if (error) {
      console.error('Errore nel recupero dei ticket:', error);
      return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      tickets: tickets || [],
      isMock: false,
    });

  } catch (error) {
    console.error('Errore API admin tickets:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const supabase = await createServerClient();
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    const body = await request.json();
    const validation = patchTicketSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Dati non validi', details: validation.error.flatten() }, { status: 400 });
    }

    const { ticketId, ...updateData } = validation.data;

    const adminClient = createAdminClient();

    const { data, error } = await adminClient
      .from('tickets')
      .update(updateData)
      .eq('id', ticketId)
      .select()
      .single();

    if (error) {
      console.error('Errore nell\'aggiornamento del ticket:', error);
      return NextResponse.json(
        { error: 'Errore nell\'aggiornamento' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      ticket: data,
    });

  } catch (error) {
    console.error('Errore API admin tickets PATCH:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dati non validi', details: error.flatten() }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
