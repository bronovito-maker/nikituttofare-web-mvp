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
  nome_is_ambiguous?: boolean | null;
  telefono?: string | null;
  telefono_is_ambiguous?: boolean | null;
  email?: string | null;
  booking_date_time?: string | null;
  booking_date_time_is_ambiguous?: boolean | null;
  orario?: string | null;
  orario_is_ambiguous?: boolean | null;
  party_size?: number | null;
  party_size_is_ambiguous?: boolean | null;
  notes?: string | null;
};

const SYSTEM_INSTRUCTIONS = `
Sei un analizzatore NLU per un ristorante italiano. Ricevi la cronologia (utente+assistente) e devi estrarre campi strutturati con indicazione di ambiguità.

Restituisci un JSON con le seguenti chiavi:
{
  "intent": "prenotazione" | "info" | "ordine" | "altro",
  "nome": string | null,
  "nome_is_ambiguous": boolean,
  "telefono": string | null,
  "telefono_is_ambiguous": boolean,
  "email": string | null,
  "booking_date_time": string | null, // ISO 8601 Europe/Rome se data+ora sono chiari, altrimenti null
  "booking_date_time_is_ambiguous": boolean,
  "orario": string | null, // HH:MM 24h se l'ora è chiara, altrimenti null
  "orario_is_ambiguous": boolean,
  "party_size": number | null, // intero >0 se chiaro
  "party_size_is_ambiguous": boolean,
  "notes": string | null
}

Linee guida:
- Imposta *_is_ambiguous = true quando il cliente usa formule vaghe (es. "stasera", "verso le 9", "qualche persona", "circa quattro") oppure quando mancano dettagli numerici.
- Ricevi solo l'ultimo scambio (eventualmente l'ultimo messaggio dell'assistente seguito da quello dell'utente); considera che il cliente potrebbe aver fornito altri dettagli in precedenza.
- Se l'utente fornisce un orario preciso (es. "alle 14", "19:30", "alle 10 del mattino"), imposta sempre booking_date_time_is_ambiguous = false e orario_is_ambiguous = false; usa true solo per espressioni vaghe come "verso sera", "in mattinata", "dopo le 9" senza un orario specifico.
- Se un campo non è menzionato, lascia sia il valore sia *_is_ambiguous a null/false coerenti.
- Non inventare informazioni; se non sei sicuro del valore, restituisci null e *_is_ambiguous = true.
- RISPONDI SOLO con JSON valido.
`.trim();

const DEFAULT_PARSER_MODEL = process.env.OPENAI_PARSER_MODEL || process.env.OPENAI_MODEL || 'gpt-4o-mini';

const RETRYABLE_STATUS = new Set([408, 409, 429, 500, 502, 503, 504]);

const isRetryableError = (error: unknown) => {
  if (error instanceof OpenAI.APIError) {
    return error.status ? RETRYABLE_STATUS.has(error.status) : false;
  }
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes('timeout') || message.includes('timed out')) {
      return true;
    }
  }
  return false;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    console.log('[API /api/nlu] Sessione:', session);
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

    const requestMessages = [
      {
        role: 'system' as const,
        content: SYSTEM_INSTRUCTIONS,
      },
      {
        role: 'user' as const,
        content: `Analizza questo breve estratto della conversazione (ultimi messaggi pertinenti):\n"""${formattedTranscript}"""`,
      },
    ];

    const callWithRetry = async (
      attempt = 1
    ): Promise<Awaited<ReturnType<typeof openai.chat.completions.create>>> => {
      const startedAt = Date.now();
      try {
        const completion = await openai.chat.completions.create({
          model: DEFAULT_PARSER_MODEL,
          temperature: 0,
          response_format: { type: 'json_object' },
          messages: requestMessages,
        });
        const duration = Date.now() - startedAt;
        if (attempt > 1) {
          console.info(`[NLU] completato al tentativo ${attempt} in ${duration}ms`);
        }
        return completion;
      } catch (error) {
        const duration = Date.now() - startedAt;
        const label = `[NLU] errore tentativo ${attempt} (${duration}ms)`;
        console.warn(label, error);

        if (attempt < 2 && isRetryableError(error)) {
          const backoff = 200 + Math.floor(Math.random() * 200);
          console.warn(`[NLU] retry programmato tra ${backoff}ms`);
          await sleep(backoff);
          return callWithRetry(attempt + 1);
        }
        throw error;
      }
    };

    const completion = await callWithRetry();

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
        nome_is_ambiguous: parsed.nome_is_ambiguous ?? false,
        telefono: parsed.telefono ?? null,
        telefono_is_ambiguous: parsed.telefono_is_ambiguous ?? false,
        email: parsed.email ?? null,
        booking_date_time: parsed.booking_date_time ?? null,
        booking_date_time_is_ambiguous: parsed.booking_date_time_is_ambiguous ?? false,
        orario: parsed.orario ?? null,
        orario_is_ambiguous: parsed.orario_is_ambiguous ?? false,
        party_size: typeof parsed.party_size === 'number' ? parsed.party_size : null,
        party_size_is_ambiguous: parsed.party_size_is_ambiguous ?? false,
        notes: parsed.notes ?? null,
      },
    });
  } catch (error) {
    console.error('[API /api/nlu] ERRORE CRITICO:', error);
    const message = error instanceof Error ? error.message : 'Errore sconosciuto';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
