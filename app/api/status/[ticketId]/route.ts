// app/api/status/[ticketId]/route.ts
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(
    req: NextRequest,
    { params }: { params: { ticketId: string } }
) {
    const { ticketId } = params;

    if (!ticketId) {
        return NextResponse.json({ ok: false, error: "Ticket ID mancante" }, { status: 400 });
    }

    try {
        const base = process.env.NOCO_BASE_URL || "";
        const token = process.env.NOCO_API_TOKEN || "";
        const table = process.env.NOCO_LEADS_TABLE_ID || "";

        if (!base || !token || !table) {
            return NextResponse.json({ ok: false, error: "Configurazione NocoDB mancante" }, { status: 500 });
        }
        
        const url = `${base.replace(/\/$/, "")}/api/v2/tables/${table}/records?where=${encodeURIComponent(`(ticketId,eq,${ticketId})`)}`;

        const nocoRes = await fetch(url, {
            headers: { "xc-token": token, "accept": "application/json" },
            cache: 'no-store'
        });

        if (!nocoRes.ok) {
            throw new Error(`Errore da NocoDB: ${nocoRes.status}`);
        }

        const data = await nocoRes.json();
        const record = data?.list?.[0];

        if (!record) {
            return NextResponse.json({ ok: false, error: "Richiesta non trovata" }, { status: 404 });
        }

        return NextResponse.json({
            ok: true,
            status: record.Stato || 'Inviata',
            category: record.category || 'N/D'
        });

    } catch (error) {
        console.error(`[API Status Error] per ticketId=${ticketId}:`, error);
        return NextResponse.json({ ok: false, error: "Errore interno del server" }, { status: 500 });
    }
}