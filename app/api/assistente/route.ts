// app/api/assistente/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth'; // Importa la funzione auth
// import { readTableRowById, updateTableRowById } from '@/lib/noco-helpers';
import { Tenant } from '@/lib/types'; // Importa il nostro tipo Tenant
// import { NC_TABLE_TENANTS_ID } from '@/lib/noco-ids';

/**
 * GET: Recupera la configurazione corrente del tenant loggato
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  try {
    const tenantId = session.user.tenantId;
    
    // TODO: Replace this with Supabase logic
    const mockTenant: Tenant = {
        Id: 1,
        name: 'Niki Restaurant (Mock)',
        phone_number: '1234567890',
        address: 'Via Codice, 1, 00100 Roma',
        opening_hours_json: '{"lun": "10-14, 18-22", "mar": "10-14, 18-22", "mer": "10-14, 18-22", "gio": "10-14, 18-22", "ven": "10-14, 18-24", "sab": "18-24", "dom": "chiuso"}',
        system_prompt: 'Sei un assistente per un ristorante. Il tuo obiettivo è aiutare i clienti a prenotare un tavolo e rispondere alle loro domande.',
        extra_info: 'Il parcheggio è disponibile in strada.',
        notification_email: 'test@example.com',
        menu_pdf_url: 'https://example.com/menu.pdf',
        menu_text: 'Carbonara, Amatriciana, Gricia',
        ai_tone: 'amichevole',
        widget_color: '#ff0000',
    };
    
    return NextResponse.json(mockTenant);

  } catch (error) {
    console.error('Errore GET /api/assistente:', error);
    return NextResponse.json({ error: 'Errore nel recupero della configurazione' }, { status: 500 });
  }
}

/**
 * PUT: Aggiorna la configurazione del tenant loggato
 */
export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  try {
    const tenantId = session.user.tenantId;
    const payload = (await request.json()) as Partial<Tenant> & Record<string, unknown>;

    // TODO: Replace this with Supabase logic
    console.log('Mocking update for tenant:', tenantId);
    console.log('Payload:', payload);

    return NextResponse.json(payload);

  } catch (error) {
    console.error('Errore PUT /api/assistente:', error);
    return NextResponse.json({ error: "Errore nell'aggiornamento della configurazione" }, { status: 500 });
  }
}

