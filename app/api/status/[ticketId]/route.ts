// File: app/api/status/[ticketId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getNocoClient } from "@/lib/noco";

// MODIFICA: Rimuoviamo l'inizializzazione del client da qui

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ ticketId: string }> }
) {
  // MODIFICA: Inizializziamo il client qui, al momento della richiesta
  const noco = getNocoClient();
  const { ticketId } = await context.params;

  if (!ticketId) {
    return NextResponse.json({ error: "Ticket ID mancante" }, { status: 400 });
  }

  try {
    const records = await noco.db.dbViewRow.list(
      "vw_requests_details",
      "Leads",
      {
        where: `(ticketId,eq,${ticketId})`,
      }
    );

    const record = records.list[0];

    if (!record) {
      return NextResponse.json({ error: "Richiesta non trovata" }, { status: 404 });
    }

    // Estrai solo lo stato dal record
    const status = record.Status;

    return NextResponse.json({ status });
  } catch (error) {
    console.error(`Errore nel recupero dello stato per il ticket ${ticketId}:`, error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 }
    );
  }
}