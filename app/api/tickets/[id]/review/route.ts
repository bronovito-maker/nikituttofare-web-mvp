import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { z } from 'zod';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

const ReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  review: z.string().max(500).optional().nullable(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    // Rate limiting: Max 5 reviews per hour per user (anti-spam)
    const rateLimitResult = checkRateLimit(`review:${user.id}`, RATE_LIMITS.reviews);

    if (!rateLimitResult.success) {
      const resetInMinutes = Math.ceil(
        (rateLimitResult.resetTime - Date.now()) / 1000 / 60
      );
      return NextResponse.json(
        {
          error: 'Troppe recensioni in poco tempo',
          details: `Riprova tra ${resetInMinutes} minut${resetInMinutes === 1 ? 'o' : 'i'}`,
          resetTime: rateLimitResult.resetTime,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)),
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(rateLimitResult.resetTime),
          },
        }
      );
    }

    // Unwrap params (Next.js 15+)
    const { id } = await params;

    // Parse and validate request body
    const body = await request.json();
    const validation = ReviewSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Dati non validi',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { rating, review } = validation.data;

    // Fetch ticket and verify ownership + status
    const { data: ticket, error: fetchError } = await supabase
      .from('tickets')
      .select('id, user_id, status, rating')
      .eq('id', id)
      .single();

    if (fetchError || !ticket) {
      return NextResponse.json(
        { error: 'Ticket non trovato' },
        { status: 404 }
      );
    }

    // Security check: Verify ticket belongs to user
    if (ticket.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Non hai i permessi per recensire questo ticket' },
        { status: 403 }
      );
    }

    // Business rule: Can only review resolved/closed tickets
    if (!['resolved', 'closed'].includes(ticket.status)) {
      return NextResponse.json(
        {
          error: 'Il ticket non è ancora concluso',
          details: 'Puoi recensire solo ticket con status "resolved" o "closed"',
        },
        { status: 400 }
      );
    }

    // Business rule: Can only review once
    if (ticket.rating !== null && ticket.rating !== undefined) {
      return NextResponse.json(
        {
          error: 'Hai già recensito questo intervento',
          details: 'Non è possibile modificare una recensione già inviata',
        },
        { status: 400 }
      );
    }

    // Save review
    const { error: updateError } = await supabase
      .from('tickets')
      .update({
        rating,
        review_text: review || null,
        review_created_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error saving review:', updateError);
      throw new Error('Errore durante il salvataggio della recensione');
    }

    // Success response with rate limit headers
    return NextResponse.json(
      {
        success: true,
        message: 'Recensione salvata con successo',
        data: {
          ticketId: id,
          rating,
          hasReview: !!review,
        },
      },
      {
        headers: {
          'X-RateLimit-Limit': '5',
          'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          'X-RateLimit-Reset': String(rateLimitResult.resetTime),
        },
      }
    );
  } catch (error) {
    console.error('Review API error:', error);
    return NextResponse.json(
      {
        error: 'Errore del server',
        message: error instanceof Error ? error.message : 'Errore sconosciuto',
      },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch review (optional, for future use)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    // Unwrap params (Next.js 15+)
    const { id } = await params;

    const { data: ticket, error } = await supabase
      .from('tickets')
      .select('id, rating, review_text, review_created_at')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !ticket) {
      return NextResponse.json(
        { error: 'Ticket non trovato' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        rating: ticket.rating,
        reviewText: ticket.review_text,
        reviewCreatedAt: ticket.review_created_at,
      },
    });
  } catch (error) {
    console.error('Review GET error:', error);
    return NextResponse.json(
      { error: 'Errore del server' },
      { status: 500 }
    );
  }
}
