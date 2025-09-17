// app/api/requests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // --- MODIFICA CHIAVE: Controllo più dettagliato delle variabili d'ambiente ---
  const base = process.env.NOCO_BASE_URL;
  const token = process.env.NOCO_API_TOKEN;
  const table = process.env.NOCO_LEADS_TABLE_ID;

  if (!base || !token || !table) {
    console.error("Errore: una o più variabili d'ambiente NocoDB non sono configurate.");
    return NextResponse.json(
      { ok: false, error: "Errore di configurazione del server (NocoDB)." },
      { status: 500 }
    );
  }

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

    const url =
      `${base.replace(/\/$/, "")}/api/v2/tables/${encodeURIComponent(table)}/records` +
      `?where=${encodeURIComponent(`(userId,eq,${userId})`)}` +
      `&limit=100&offset=0&sort=-CreatedAt`;

    const res = await fetch(url, {
      headers: { "xc-token": token, "accept": "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
        const errorText = await res.text();
        console.error(`[NocoDB Error /api/requests] Status: ${res.status}, Body: ${errorText}`);
        return NextResponse.json(
            { ok: false, error: `Errore di comunicazione con NocoDB: ${res.status}` },
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