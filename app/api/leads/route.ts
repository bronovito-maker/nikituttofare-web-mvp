// app/api/leads/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createRecord, extractSingleRecord } from '@/lib/noco';

const leadSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, { message: 'Il nome deve contenere almeno 2 caratteri.' })
    .max(120)
    .optional(),
  email: z.string().trim().email({ message: 'Inserisci un indirizzo email valido.' }).optional(),
  telefono: z
    .string()
    .trim()
    .min(5, { message: 'Il numero di telefono è troppo corto.' })
    .max(30, { message: 'Il numero di telefono è troppo lungo.' })
    .optional(),
  richiesta: z
    .string()
    .trim()
    .min(5, { message: 'La richiesta è troppo breve.' })
    .max(4000, { message: 'La richiesta è troppo lunga.' }),
  note_interne: z.string().trim().max(2000).optional(),
  persone: z.number().int().positive().max(100).optional(),
  orario: z.string().trim().min(3).max(40).optional(),
  intent: z.string().trim().max(30).optional(),
  tenant_id: z
    .union([
      z.string().trim().min(1, { message: 'ID tenant obbligatorio.' }),
      z.number(),
    ])
    .transform((value) => (typeof value === 'number' ? String(value) : value)),
});

const LEADS_TABLE_KEY =
  process.env.NOCO_TABLE_LEADS_ID ||
  process.env.NOCO_TABLE_LEADS ||
  'Leads';
const LEADS_VIEW_ID = process.env.NOCO_VIEW_LEADS_ID;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = leadSchema.parse(body);

    const payload: Record<string, unknown> = {
      nome: validatedData.nome ?? 'Contatto chat',
      richiesta: validatedData.richiesta,
      tenant_id: validatedData.tenant_id,
      stato: validatedData.intent === 'booking' ? 'Prenotazione' : 'Nuovo',
    };
    if (validatedData.telefono) {
      payload.telefono = validatedData.telefono;
    }
    if (validatedData.email) {
      payload.email = validatedData.email;
    }
    if (validatedData.note_interne) {
      payload.note_interne = validatedData.note_interne;
    }

    const created = await createRecord(
      LEADS_TABLE_KEY,
      payload,
      LEADS_VIEW_ID ? { viewId: LEADS_VIEW_ID } : {}
    );

    return NextResponse.json(
      {
        message: 'Lead creato con successo.',
        data: extractSingleRecord(created) ?? payload,
      },
      { status: 201 }
    );

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Dati non validi', errors: error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    console.error('Errore nella creazione del lead:', error);
    return NextResponse.json(
      {
        message: 'Errore interno del server.',
        detail: error instanceof Error ? error.message : 'Operazione non riuscita.',
      },
      { status: 500 }
    );
  }
}
