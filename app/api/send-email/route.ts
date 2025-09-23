// File: app/api/send-email/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { z } from 'zod';

// MODIFICA: Rimuoviamo l'inizializzazione del client da qui

const emailSchema = z.object({
  from: z.string().email(),
  to: z.string().email(),
  subject: z.string(),
  html: z.string(),
});

export async function POST(req: NextRequest) {
  // MODIFICA: Inizializziamo il client Resend qui, al momento della richiesta
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const body = await req.json();
    const validation = emailSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { from, to, subject, html } = validation.data;

    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}