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
        userId =
          (session as any)?.userId ||
          (session as any)?.user?.id ||
          (session as any)?.user?.email || // fallback: email come id
          "";
      } catch {}
    }

    if (!userId) {
      // Niente user -> restituisci lista vuota (meglio 200 che 401 per UX della dashboard)
      return NextResponse.json({ ok: true, data: [] });
    }

    // 2) ENV compatibili
    const base =
      process.env.NOCO_BASE_URL ||
      process.env.NOCODB_BASE_URL ||
      ""; // es. https://db.nikituttofare.com/api/v2
    const token =
      process.env.NOCO_API_TOKEN ||
      process.env.NOCODB_TOKEN ||
      "";
    const table =
      process.env.NOCO_LEADS_TABLE_ID ||
      process.env.NOCODB_TABLE_ID_LEADS ||
      ""; // es. mv0h0u7kkwag94t

    if (!base || !token || !table) {
      return NextResponse.json(
        { ok: false, error: "Missing NocoDB ENV (BASE_URL / TOKEN / TABLE_ID)" },
        { status: 500 }
      );
    }

    // 3) Query NocoDB (API v2)
    // /tables/{tableId}/records?where=(userId,eq,<id>)&limit=100&offset=0&orderby=-createdAt
    const url =
      `${base.replace(/\/$/, "")}/tables/${encodeURIComponent(table)}/records` +
      `?where=${encodeURIComponent(`(userId,eq,${userId})`)}` +
      `&limit=100&offset=0&orderby=-createdAt`;

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
          error:
            typeof data === "string"
              ? data.slice(0, 400)
              : (data?.message || data?.error || "NocoDB error"),
        },
        { status: 502 }
      );
    }

    // NocoDB può rispondere con { list: [...] } oppure array diretto
    const rows = Array.isArray(data) ? data : (data?.list ?? data?.records ?? []);
    return NextResponse.json({ ok: true, data: Array.isArray(rows) ? rows : [] });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || String(e) },
      { status: 500 }
    );
  }
}