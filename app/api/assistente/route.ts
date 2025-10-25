// app/api/assistente/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth'; // Importa la funzione auth
import { readTableRowById, updateTableRowById } from '@/lib/noco-helpers';
import { Tenant } from '@/lib/types'; // Importa il nostro tipo Tenant
import { NC_TABLE_TENANTS_ID } from '@/lib/noco-ids';

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
    
    // Leggi la riga dalla tabella 'tenants' usando il tenantId
    const config = await readTableRowById(NC_TABLE_TENANTS_ID, Number(tenantId));
    
    if (!config) {
         return NextResponse.json({ error: 'Configurazione non trovata' }, { status: 404 });
    }
    
    return NextResponse.json(config as Tenant);

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

    const {
      system_prompt,
      opening_hours_json,
      menu_pdf_url,
      menu_text,
      ai_tone,
      widget_color,
    } = payload;

    const updatedData: Partial<Tenant> = {};

    const assignIfString = (key: keyof Tenant, value: unknown) => {
      if (value === undefined) return;

      if (key === 'opening_hours_json' && value === '') {
        updatedData[key] = null as Tenant[keyof Tenant];
        return;
      }

      if (value === null) {
        updatedData[key] = null as Tenant[keyof Tenant];
        return;
      }

      if (typeof value === 'string') {
        updatedData[key] = value;
        return;
      }

      updatedData[key] = String(value) as Tenant[keyof Tenant];
    };

    assignIfString('system_prompt', system_prompt);
    assignIfString('opening_hours_json', opening_hours_json);
    assignIfString('menu_pdf_url', menu_pdf_url);
    assignIfString('menu_text', menu_text);
    assignIfString('ai_tone', ai_tone);
    assignIfString('widget_color', widget_color);

    const allowedBaseFields: Array<keyof Tenant> = [
      'name',
      'phone_number',
      'address',
      'notification_email',
      'extra_info',
    ];
    allowedBaseFields.forEach((field) => assignIfString(field, payload[field]));

    if (Object.keys(updatedData).length === 0) {
      return NextResponse.json(
        { error: 'Nessun campo valido da aggiornare' },
        { status: 400 }
      );
    }

    // Esegui l'aggiornamento sulla riga del tenant
    const updatedConfig = await updateTableRowById(
      NC_TABLE_TENANTS_ID,
      Number(tenantId),
      updatedData
    );

    return NextResponse.json(updatedConfig);

  } catch (error) {
    console.error('Errore PUT /api/assistente:', error);
    return NextResponse.json({ error: "Errore nell'aggiornamento della configurazione" }, { status: 500 });
  }
}
