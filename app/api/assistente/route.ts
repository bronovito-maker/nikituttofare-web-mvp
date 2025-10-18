// app/api/assistente/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth'; // Importa la funzione auth
import { noco } from '@/lib/noco';
import { Tenant } from '@/lib/types'; // Importa il nostro tipo Tenant

// Recupera le variabili d'ambiente per la tabella TENANTS
const NC_TABLE_TENANTS = process.env.NOCO_TABLE_TENANTS!;
const NC_VIEW_TENANTS = process.env.NOCO_VIEW_TENANTS!;

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
    const config = await noco.dbViewRow.read(
      NC_TABLE_TENANTS,
      NC_VIEW_TENANTS,
      Number(tenantId)
    );
    
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
    // Estrai solo i campi che permettiamo di aggiornare dal body
    const body: Partial<Tenant> = await request.json();

    // Rimuovi campi che non dovrebbero essere aggiornati da questo endpoint
    // (es. Id, CreatedAt, UpdatedAt)
    const { 
      Id, 
      // Aggiungi qui altri campi da escludere se NocoDB li include
      ...updateData 
    } = body; 

    // Esegui l'aggiornamento sulla riga del tenant
    const updatedConfig = await noco.dbViewRow.update(
      NC_TABLE_TENANTS,
      Number(tenantId),
      updateData // Invia solo i dati da aggiornare
    );

    return NextResponse.json(updatedConfig);

  } catch (error) {
    console.error('Errore PUT /api/assistente:', error);
    return NextResponse.json({ error: "Errore nell'aggiornamento della configurazione" }, { status: 500 });
  }
}
