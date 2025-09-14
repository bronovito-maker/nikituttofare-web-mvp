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
        { ok: false, error: "Missing NocoDB ENV (BASE_URL / TOKEN / TABLE_ID)" },
        { status: 500 }
      );
    }

    // 3) Query NocoDB (API v2)
    const url =
      `${base.replace(/\/$/, "")}/tables/${encodeURIComponent(table)}/records` +
      `?where=${encodeURIComponent(`(userId,eq,${userId})`)}` +
      `&limit=100&offset=0&sort=-CreatedAt`; // Modificato orderby in sort e usato il nome colonna esatto

    // --- [DEBUG 1] LOG dell'URL che stiamo per chiamare ---
    console.log("\n[DEBUG] Chiamata a NocoDB URL:", url);

    const res = await fetch(url, {
      headers: { "xc-token": token, "accept": "application/json" },
      cache: "no-store",
    });

    const text = await res.text();
    let data: any;
    try { data = JSON.parse(text); } catch { data = text; }

    if (!res.ok) {
      return NextResponse.json(
        {
          ok: false,
          status: res.status,
          error: typeof data === "string" ? data.slice(0, 400) : (data?.message || data?.error || "NocoDB error"),
        },
        { status: 502 }
      );
    }

    const rows = Array.isArray(data) ? data : (data?.list ?? data?.records ?? []);

    // --- [DEBUG 2] LOG DEI DATI RICEVUTI DA NOCODB ---
    // Questo è il log più importante. Ci mostrerà la vera struttura dei dati.
    console.log("\n--- [DEBUG] API /api/requests ---");
    console.log(`Richieste trovate per userId=${userId}: ${rows.length}`);
    console.log("Contenuto delle prime 3 righe ricevute da NocoDB:");
    console.log(JSON.stringify(rows.slice(0, 3), null, 2)); // Logghiamo solo le prime 3 per non intasare il terminale
    console.log("----------------------------------\n");
    // --- FINE BLOCCO DEBUG ---

    return NextResponse.json({ ok: true, data: Array.isArray(rows) ? rows : [] });
  } catch (e: any) {
    console.error("Errore critico nell'API /api/requests:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || String(e) },
      { status: 500 }
    );
  }
}