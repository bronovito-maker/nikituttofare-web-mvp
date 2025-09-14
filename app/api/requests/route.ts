// app/api/requests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

/**
 * GET /api/requests?userId=...
 * Ritorna le richieste (leads) dell'utente da NocoDB.
 * Legge ENV in modo flessibile: NOCO_* oppure NOCODB_*.
 */
export async function GET(req: NextRequest) {
  try {
    // 1) userId dalla query o dalla sessione
    const { searchParams } = new URL(req.url);
    let userId = (searchParams.get("userId") || "").trim();

    if (!userId) {
      try {
        const session = await auth();
        // @ts-ignore
        userId = session?.userId || session?.user?.id || session?.user?.email || "";
      } catch {}
    }

    if (!userId) {
      return NextResponse.json({ ok: true, data: [] });
    }

    // 2) ENV compatibili
    const base = process.env.NOCO_BASE_URL || process.env.NOCODB_BASE_URL || "";
    const token = process.env.NOCO_API_TOKEN || process.env.NOCODB_TOKEN || "";
    const table = process.env.NOCO_LEADS_TABLE_ID || process.env.NOCODB_TABLE_ID_LEADS || "";

    if (!base || !token || !table) {
      return NextResponse.json(
        { ok: false, error: "Variabili d'ambiente NocoDB mancanti. Controlla il file .env.local e riavvia il server." },
        { status: 500 }
      );
    }

    // --- MODIFICA CHIAVE: Utilizzo del percorso API corretto di NocoDB v2 ---
    const url =
      `${base.replace(/\/$/, "")}/api/v2/tables/${encodeURIComponent(table)}/records` +
      `?where=${encodeURIComponent(`(userId,eq,${userId})`)}` +
      `&limit=100&offset=0&sort=-CreatedAt`;

    console.log("\n[DEBUG] Chiamata a NocoDB per /api/requests:", url);

    const res = await fetch(url, {
      headers: { "xc-token": token, "accept": "application/json" },
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

    console.log(`\n[DEBUG] Dati ricevuti da NocoDB per userId=${userId}: ${rows.length} righe`);

    return NextResponse.json({ ok: true, data: Array.isArray(rows) ? rows : [] });

  } catch (e: any) {
    console.error("Errore critico nell'API /api/requests:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || String(e) },
      { status: 500 }
    );
  }
}