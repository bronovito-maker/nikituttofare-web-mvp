export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { auth } from '@/auth';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type ParserResult = {
  intent?: 'prenotazione' | 'info' | 'ordine' | 'altro';
  nome?: string | null;
  telefono?: string | null;
  email?: string | null;
  booking_date_time?: string | null;
  orario?: string | null;
  party_size?: number | null;
  notes?: string | null;
};

const SYSTEM_INSTRUCTIONS = `
Sei un analizzatore NLU per un ristorante italiano. Ricevi la cronologia (utente+assistente) e devi estrarre:
- intent: prenotazione | info | ordine | altro.
- nome completo (se fornito).
- telefono (solo cifre, opzionali prefisso +39).
- email.
- booking_date_time: data e ora ISO 8601 con timezone Europe/Rome se entrambe presenti; se solo data o ora, lascia null.
- orario: HH:MM nel formato 24h, se menzionato.
- party_size: intero >0.
- notes: descrizione breve di allergie o richieste; usa "Nessuna richiesta" se l'utente lo dichiara esplicitamente.

Regole:
- Analizza frasi colloquiali, es. "siamo una coppia", "dopo le 9".
- Se trovi solo un'indicazione generica (es. "ora di cena"), imposta orario = null.
- RISPONDI SOLO con un JSON valido con queste chiavi. Usa null per valori mancanti.
`.trim();

const DEFAULT_PARSER_MODEL = process.env.OPENAI_PARSER_MODEL || process.env.OPENAI_MODEL || 'gpt-4o-mini';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const body = await req.json();
    const { messages } = body ?? {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messaggi mancanti' }, { status: 400 });
    }

    const formattedTranscript = messages
      .map((message: { role: string; content: string }) => `${message.role}: ${message.content}`)
      .join('\n');

    const completion = await openai.chat.completions.create({
      model: DEFAULT_PARSER_MODEL,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: SYSTEM_INSTRUCTIONS,
        },
        {
          role: 'user',
          content: `Analizza la seguente conversazione:\n"""${formattedTranscript}"""`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: 'Risposta vuota dal modello NLU' }, { status: 502 });
    }

    let parsed: ParserResult = {};
    try {
      parsed = JSON.parse(content);
    } catch (jsonError) {
      console.error('Impossibile parsare la risposta NLU:', jsonError, content);
      return NextResponse.json({ error: 'Formato risposta NLU non valido' }, { status: 502 });
    }

    return NextResponse.json({
      data: {
        intent: parsed.intent ?? null,
        nome: parsed.nome ?? null,
        telefono: parsed.telefono ?? null,
        email: parsed.email ?? null,
        booking_date_time: parsed.booking_date_time ?? null,
        orario: parsed.orario ?? null,
        party_size: typeof parsed.party_size === 'number' ? parsed.party_size : null,
        notes: parsed.notes ?? null,
      },
    });
  } catch (error) {
    console.error('Errore API /api/nlu:', error);
    const message = error instanceof Error ? error.message : 'Errore sconosciuto';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
