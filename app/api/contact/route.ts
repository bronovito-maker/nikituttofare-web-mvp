
// app/api/contact/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generateTicketId } from '@/lib/utils';

// 1. Zod Schema Stricter: Using .strict()
const ContactSchema = z.object({
  name: z.string().min(2, "Il nome è troppo corto").max(50, "Il nome è troppo lungo"),
  phone: z.string().min(8, "Numero di telefono non valido").max(20, "Numero di telefono non valido"),
  address: z.string().min(5, "L'indirizzo sembra troppo corto").max(100, "L'indirizzo è troppo lungo"),
  city: z.string().min(2, "Città non valida").max(50, "Città non valida"),
  email: z.string().email("Formato email non valido").or(z.literal('')).optional(),
  timeslot: z.string().min(2, "La disponibilità è troppo corta"),
  message: z.string().min(5, "Il messaggio è troppo corto"),
  details: z.object({
    clarification1: z.string().optional(),
    clarification2: z.string().optional(),
    clarification3: z.string().optional(),
  }).optional(),
  ai: z.any().optional(),
  imageUrl: z.string().url().optional(),
}).strict(); // No extra fields allowed

// 2. In-memory Rate Limiter
const rateLimitStore: Record<string, { count: number, timestamp: number }> = {};
const RATE_LIMIT_COUNT = 10; // Max requests
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds

const isRateLimited = (ip: string) => {
  const now = Date.now();
  const record = rateLimitStore[ip];

  if (record && now - record.timestamp < RATE_LIMIT_WINDOW) {
    if (record.count >= RATE_LIMIT_COUNT) {
      return true; // Rate limit exceeded
    }
    record.count++;
  } else {
    // New record or window expired
    rateLimitStore[ip] = { count: 1, timestamp: now };
  }
  return false;
};


export async function POST(req: Request) {
  // Rate Limiting Check
  const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1';
  if (isRateLimited(ip)) {
    // 3. Sanitized Logging
    console.warn(`Rate limit exceeded for IP: ${ip}`);
    return NextResponse.json({ error: "Troppe richieste. Riprova più tardi." }, { status: 429 });
  }

  try {
    const body = await req.json();
    const validation = ContactSchema.safeParse(body);

    if (!validation.success) {
      // 3. Sanitized Logging - Log only the fact of validation error, not the data
      console.warn({
        message: "Validation failed for /api/contact",
        errors: validation.error.flatten().fieldErrors
      });
      return NextResponse.json({ error: "Dati inviati non validi o incompleti.", details: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    
    const ticketId = generateTicketId();

    const payloadForN8n = {
      ...validation.data,
      ticketId: ticketId,
    };

    const n8nWebhookUrl = process.env.N8N_CONTACT_WEBHOOK_URL;
    if (!n8nWebhookUrl) {
      // This is a server error, so logging it is fine.
      console.error("Webhook URL for n8n not configured.");
      throw new Error("Webhook URL per n8n non configurato.");
    }
    
    fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadForN8n),
    }).catch(err => {
      // 3. Sanitized Logging - Log the error, but not the payload
      console.error("Error sending to n8n (async)", { error: err });
    });

    return NextResponse.json({
      ok: true,
      message: "Richiesta ricevuta con successo.",
      ticketId: ticketId,
    });

  } catch (error: any) {
    // 3. Sanitized Logging - Avoid logging the whole request or error object if it contains PII
    console.error("Generic error in /api/contact", { error: error.message });
    return NextResponse.json({ error: "Errore interno del server." }, { status: 500 });
  }
}
