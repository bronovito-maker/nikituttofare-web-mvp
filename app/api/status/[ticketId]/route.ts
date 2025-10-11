// File: app/api/status/[ticketId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { listRecords } from "@/lib/noco";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ ticketId: string }> }
) {
  const tableKey =
    process.env.NOCO_TABLE_REQUESTS_ID ||
    process.env.NOCO_TABLE_REQUESTS ||
    "Leads";
  const viewId = process.env.NOCO_VIEW_REQUESTS_ID;
  const { ticketId } = await context.params;

  if (!ticketId) {
    return NextResponse.json({ error: "Ticket ID mancante" }, { status: 400 });
  }

  try {
    const records = await listRecords(tableKey, {
      where: `(ticketId,eq,${ticketId})`,
      limit: 1,
      viewId,
    });

    const record = records[0];

    if (!record) {
      return NextResponse.json({ error: "Richiesta non trovata" }, { status: 404 });
    }

    const status = record.Status ?? record.status ?? null;

    return NextResponse.json({ status });
  } catch (error) {
    console.error(`Errore nel recupero dello stato per il ticket ${ticketId}:`, error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 }
    );
  }
}
