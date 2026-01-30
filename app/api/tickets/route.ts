import { NextRequest, NextResponse } from 'next/server';
import { createTicket, getUserTickets, getOrCreateProfile, getCurrentUser } from '@/lib/supabase-helpers';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, rateLimitExceededResponse } from '@/lib/rate-limit';
import { z } from 'zod';

// ============================================
// ZOD VALIDATION SCHEMAS
// ============================================

const VALID_CATEGORIES = [
  'plumbing',
  'electric',
  'locksmith',
  'carpenter',
  'hvac',
  'painting',
  'renovation',
  'generic',
  'idraulico',
  'elettricista',
  'fabbro',
  'falegname',
  'climatizzazione',
  'imbianchino',
  'ristrutturazione',
  'generico'
] as const;

const VALID_PRIORITIES = ['low', 'medium', 'high', 'emergency'] as const;

const CreateTicketSchema = z.object({
  category: z.enum(VALID_CATEGORIES, {
    errorMap: () => ({ message: 'Categoria non valida. Scegli tra le opzioni disponibili.' })
  }),
  description: z
    .string()
    .min(10, 'La descrizione deve contenere almeno 10 caratteri.')
    .max(2000, 'La descrizione non può superare 2000 caratteri.')
    .transform(val => val.trim()),
  priority: z.enum(VALID_PRIORITIES).default('medium'),
  address: z
    .string()
    .max(200, 'L\'indirizzo non può superare 200 caratteri.')
    .optional()
    .transform(val => val?.trim()),
  city: z
    .string()
    .max(100, 'La città non può superare 100 caratteri.')
    .optional()
    .transform(val => val?.trim()),
  customerName: z
    .string()
    .max(100, 'Il nome cliente non può superare 100 caratteri.')
    .optional()
    .transform(val => val?.trim()),
  messageContent: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  chatSessionId: z.string().uuid().optional().or(z.literal('')),
});

// ============================================
// API HANDLERS
// ============================================

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - previene spam di ticket
    const clientId = getClientIdentifier(request);
    const rateLimitResult = checkRateLimit(`tickets:${clientId}`, RATE_LIMITS.tickets);

    if (!rateLimitResult.success) {
      return rateLimitExceededResponse(rateLimitResult);
    }

    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    // Parse and validate input with Zod
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Formato JSON non valido' },
        { status: 400 }
      );
    }

    const validationResult = CreateTicketSchema.safeParse(rawBody);

    if (!validationResult.success) {
      const errors = validationResult.error.flatten();
      return NextResponse.json(
        {
          error: 'Dati non validi',
          details: errors.fieldErrors
        },
        { status: 400 }
      );
    }

    const {
      category,
      description,
      priority,
      address,
      messageContent,
      imageUrl,
      chatSessionId,
      city,
      customerName
    } = validationResult.data;

    // Crea o recupera il profilo utente
    const profile = await getOrCreateProfile(user.id, user.email ?? '');
    if (!profile) {
      return NextResponse.json(
        { error: 'Impossibile creare il profilo utente' },
        { status: 500 }
      );
    }

    // Crea il ticket
    const ticket = await createTicket({
      userId: profile.id,
      category,
      description,
      priority,
      address,
      messageContent,
      status: 'pending_verification',
      imageUrl: imageUrl || undefined,
      chatSessionId: chatSessionId || undefined,
      city,
      customerName
    });

    if (!ticket) {
      return NextResponse.json(
        { error: 'Impossibile creare il ticket' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      ticketId: ticket.id,
      ticket
    });

  } catch (error) {
    console.error('Errore nella creazione del ticket:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const tickets = await getUserTickets(user.id);

    return NextResponse.json({
      success: true,
      tickets
    });

  } catch (error) {
    console.error('Errore nel recupero dei ticket:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}