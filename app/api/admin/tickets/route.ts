import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase-server';
import { getCurrentUser } from '@/lib/supabase-helpers';

// Types
interface TicketFilters {
  status?: string;
  category?: string;
  priority?: string;
  search?: string;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    // Use server client for auth check
    const supabase = createServerClient();
    const { data: profile, error: profileError } = await (supabase as any)
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    // Use admin client for fetching all tickets (bypasses RLS)
    const adminClient = createAdminClient();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const filters: TicketFilters = {
      status: searchParams.get('status') || undefined,
      category: searchParams.get('category') || undefined,
      priority: searchParams.get('priority') || undefined,
      search: searchParams.get('search') || undefined,
    };

    // Build query with admin client
    let query = (adminClient as any)
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

    // Apply filters
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

    // Verify admin role
    const supabase = createServerClient();
    const { data: profile, error: profileError } = await (supabase as any)
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    const body = await request.json();
    const { ticketId, status, priority } = body;

    if (!ticketId) {
      return NextResponse.json(
        { error: 'Ticket ID richiesto' },
        { status: 400 }
      );
    }

    // Build update object
    const updateData: {
      status?: 'new' | 'assigned' | 'in_progress' | 'resolved' | 'cancelled';
      priority?: 'low' | 'medium' | 'high' | 'emergency';
    } = {};
    
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;

    // Use admin client to bypass RLS
    const adminClient = createAdminClient();

    const { data, error } = await (adminClient as any)
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
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
