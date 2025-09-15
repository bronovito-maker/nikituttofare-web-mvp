// app/api/requests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

// --- MODIFICA CHIAVE: Aggiungi questa riga ---
// Forza la route ad essere sempre dinamica, disabilitando la cache a livello di server.
// Questo assicura che i dati siano sempre richiesti e aggiornati da NocoDB.
export const dynamic = 'force-dynamic';

/**
 * GET /api/requests?userId=...
 * Ritorna le richieste (leads) dell'utente da NocoDB.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let userId = (searchParams.get("userId") || "").trim();

    if (!userId) {
      const session = await auth().catch(() => null);
      // @ts-ignore
      userId = session?.userId || session?.user?.id || session?.user?.email || "";
    }

    if (!userId) {
      return NextResponse.json({ ok: true, data: [] });
    }

    const base = process.env.NOCO_BASE_URL || "";
    const token = process.env.NOCO_API_TOKEN || "";
    const table = process.env.NOCO_LEADS_TABLE_ID || "";

    if (!base || !token || !table) {
      return NextResponse.json(
        { ok: false, error: "Variabili d'ambiente NocoDB mancanti." },
        { status: 500 }
      );
    }

    const url =
      `${base.replace(/\/$/, "")}/api/v2/tables/${encodeURIComponent(table)}/records` +
      `?where=${encodeURIComponent(`(userId,eq,${userId})`)}` +
      `&limit=100&offset=0&sort=-CreatedAt`;

    const res = await fetch(url, {
      headers: { "xc-token": token, "accept": "application/json" },
      // Questa riga disabilita la cache a livello di fetch, ma `dynamic` è più potente.
      cache: "no-store", 
    });

    if (!res.ok) {
        const errorText = await res.text();
        console.error(`[NocoDB Error /api/requests] Status: ${res.status}, Body: ${errorText}`);
        return NextResponse.json(
            { ok: false, error: `Errore da NocoDB: ${res.status}` },
            { status: 502 }
        );
    }
    
    const data = await res.json();
    const rows = data?.list ?? [];

    return NextResponse.json({ ok: true, data: Array.isArray(rows) ? rows : [] });

  } catch (e: any) {
    console.error("Errore critico nell'API /api/requests:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || String(e) },
      { status: 500 }
    );
  }
}