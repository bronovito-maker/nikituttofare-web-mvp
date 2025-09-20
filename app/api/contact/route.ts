// app/api/contact/route.ts
/// <reference path="../../../auth.d.ts" />

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { randomUUID, createHmac } from 'crypto';
import { z } from 'zod';

// --- INIZIO FUNZIONI INVARIATE ---
declare global {
  var __bucket: Map<string, { count: number; reset: number }>;
}
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
async function rateLimit(key: string) {
  const WINDOW_MS = 60_000;
  const MAX_REQ = 15;
  globalThis.__bucket ||= new Map<string, { count: number; reset: number }>();
  const now = Date.now();
  const b = globalThis.__bucket.get(key);
  if (!b || now > b.reset) {
    globalThis.__bucket.set(key, { count: 1, reset: now + WINDOW_MS });
    return;
  }
  if (b.count >= MAX_REQ) throw new Error('rate_limited');
  b.count++;
}
function safeHost(url: string) {
  const u = new URL(url);
  const allowlist = (process.env.N8N_HOST_ALLOWLIST || '').split(',').map(s => s.trim()).filter(Boolean);
  if (allowlist.length && !allowlist.includes(u.host)) {
    throw new Error(`Host non consentito: ${u.host}`);
  }
  return u.toString();
}
function hmacSignature(secret: string, payload: string) {
  return createHmac('sha256', secret).update(payload, 'utf8').digest('hex');
}
// --- FINE FUNZIONI INVARIATE ---

const ContactSchema = z.object({
  message: z.string().min(3).max(2000),
  name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  city: z.string().optional(),
  address: z.string().optional(),
  timeslot: z.string().optional(),
  // --- CORREZIONE: Sintassi di z.record() resa esplicita ---
  details: z.record(z.string(), z.string()).optional(),
  ai: z.object({
    category: z.string().optional(),
    request_type: z.enum(['problem', 'task']).optional(),
    acknowledgement: z.string().optional(),
    clarification_question: z.string().optional(),
    urgency: z.string().optional(),
    price_low: z.number().optional(),
    price_high: z.number().optional(),
    est_minutes: z.number().optional(),
    summary: z.string().optional(),
    requires_specialist_contact: z.boolean().optional(),
  }).optional(),
}).strict();

export async function POST(req: Request) {
  const correlationId = `c_${randomUUID().slice(0, 8)}`;
  try {
    const session = await auth().catch(() => null);
    
    const userId = session?.userId ?? `u_${randomUUID().slice(0, 8)}`;
    const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0]?.trim() || 'unknown';

    await rateLimit(session?.userId || ip);

    const body = await req.json();
    const parsed = ContactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'Dati inviati non validi', details: parsed.error.flatten(), correlationId },
        { status: 400 }
      );
    }

    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
    if (!n8nWebhookUrl) {
      return NextResponse.json({ ok: false, error: 'N8N_WEBHOOK_URL non configurato', correlationId }, { status: 500 });
    }
    
    const safeUrl = safeHost(n8nWebhookUrl);
    const dataToForward = { ...parsed.data, userId, receivedAt: new Date().toISOString(), correlationId };
    const payload = JSON.stringify(dataToForward);
    
    const secret = process.env.N8N_SHARED_SECRET || '';
    const signature = secret ? hmacSignature(secret, payload) : undefined;

    const res = await fetch(safeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(secret ? { 'x-signature-sha256': signature! } : {}), 'x-correlation-id': correlationId },
      body: payload,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => 'Errore sconosciuto da n8n');
      console.error(`[contact] Errore da n8n ${res.status} cid=${correlationId} :: ${errText.slice(0, 300)}`);
      return NextResponse.json({ ok: false, error: 'Impossibile inoltrare la richiesta', correlationId }, { status: 502 });
    }

    const responseData = await res.json().catch(() => ({}));
    const ticketId = responseData?.ticketId ?? responseData?.data?.[0]?.json?.ticketId ?? null;

    return NextResponse.json({ ok: true, ticketId, correlationId });

  } catch (error: any) {
    if (error?.message === 'rate_limited') {
      return NextResponse.json({ ok: false, error: 'Troppe richieste, riprova tra un minuto.' }, { status: 429 });
    }
    console.error(`[contact] Errore fatale cid=${correlationId}`, error);
    return NextResponse.json({ ok: false, error: 'Errore interno del server', correlationId }, { status: 500 });
  }
}