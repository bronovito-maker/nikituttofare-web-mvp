// app/api/requests/[ticketId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Funzione per recuperare un singolo record da NocoDB in modo sicuro
async function getRecordByTicketId(ticketId: string, userId: string) {
  const base = process.env.NOCO_BASE_URL;
  const token = process.env.NOCO_API_TOKEN;
  const table = process.env.NOCO_LEADS_TABLE_ID;

  if (!base || !token || !table) {
    throw new Error("Errore di configurazione del server.");
  }

  // Filtra sia per ticketId CHE per userId per sicurezza
  const where = `(ticketId,eq,${ticketId})~and(userId,eq,${userId})`;
  const url = `${base.replace(/\/$/, "")}/api/v2/tables/${table}/records?where=${encodeURIComponent(where)}`;

  const res = await fetch(url, {
    headers: { "xc-token": token, "accept": "application/json" },
    cache: "no-store",
  });

  if (!res.ok) {
    console.error(`Errore da NocoDB per ticket ${ticketId}: ${res.status}`);
    return null;
  }

  const data = await res.json();
  return data?.list?.[0] ?? null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { ticketId: string } }
) {
  try {
    const session = await auth();
    // @ts-ignore
    const userId = session?.userId;

    if (!userId) {
      return NextResponse.json({ ok: false, error: "Non autorizzato" }, { status: 401 });
    }

    const { ticketId } = params;
    if (!ticketId) {
      return NextResponse.json({ ok: false, error: "Ticket ID mancante" }, { status: 400 });
    }

    const record = await getRecordByTicketId(ticketId, userId);

    if (!record) {
      return NextResponse.json({ ok: false, error: "Richiesta non trovata o non autorizzata" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: record });

  } catch (e: any) {
    console.error(`[API /requests/ticketId] Errore critico:`, e);
    return NextResponse.json({ ok: false, error: `Errore interno del server` }, { status: 500 });
  }
}