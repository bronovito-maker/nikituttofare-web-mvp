// app/api/requests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { z } from 'zod';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

// Schema per validare i parametri della richiesta
const QuerySchema = z.object({
  userId: z.string().trim().min(1, "L'ID utente è obbligatorio"),
});

export async function GET(req: NextRequest) {
  const correlationId = `req_${randomUUID().slice(0, 8)}`;
  
  // --- VALIDAZIONE DELLE VARIABILI D'AMBIENTE ---
  const base = process.env.NOCO_BASE_URL;
  const token = process.env.NOCO_API_TOKEN;
  const table = process.env.NOCO_LEADS_TABLE_ID;

  if (!base || !token || !table) {
    console.error(`[${correlationId}] Errore di configurazione: una o più variabili d'ambiente NocoDB non sono impostate.`);
    return NextResponse.json(
      { ok: false, error: "Errore di configurazione del server (codice: NDB_MISSING_VARS)." },
      { status: 500 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    let userId = (searchParams.get("userId") || "").trim();

    // Se l'userId non è passato come parametro, lo recupero dalla sessione
    if (!userId) {
      const session = await auth().catch(() => null);
      // @ts-ignore
      userId = session?.userId || session?.user?.id || session?.user?.email || "";
    }
    
    // --- VALIDAZIONE DELL'INPUT CON ZOD ---
    const validation = QuerySchema.safeParse({ userId });
    if (!validation.success) {
      return NextResponse.json(
        { ok: false, error: 'Parametri di richiesta non validi', details: validation.error.flatten() },
        { status: 400 }
      );
    }
    
    const validatedUserId = validation.data.userId;

    const url =
      `${base.replace(/\/$/, "")}/api/v2/tables/${encodeURIComponent(table)}/records` +
      `?where=${encodeURIComponent(`(userId,eq,${validatedUserId})`)}` +
      `&limit=100&offset=0&sort=-CreatedAt`;

    const res = await fetch(url, {
      headers: { "xc-token": token, "accept": "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
        const errorText = await res.text();
        console.error(`[${correlationId}] Errore da NocoDB (/api/requests) - Status: ${res.status}, Body: ${errorText.slice(0, 300)}`);
        return NextResponse.json(
            { ok: false, error: `Errore di comunicazione con il database (codice: NDB_FETCH_ERR)` },
            { status: 502 } // Bad Gateway
        );
    }
    
    const data = await res.json();
    const rows = data?.list ?? [];

    return NextResponse.json({ ok: true, data: Array.isArray(rows) ? rows : [] });

  } catch (e: any) {
    console.error(`[${correlationId}] Errore critico in /api/requests:`, e);
    return NextResponse.json(
      { ok: false, error: `Errore interno del server (ID: ${correlationId})` },
      { status: 500 }
    );
  }
}