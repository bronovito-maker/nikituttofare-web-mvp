// app/api/n8n-proxy/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const n8nProxySchema = z.object({
  message: z.string(),
  chatId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Authentication (incoming request from our frontend)
    const authToken = req.headers.get('Authorization')?.split(' ')[1];
    if (authToken !== process.env.N8N_PROXY_SECRET) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    // 2. Environment variable for URL
    const n8nUrl = process.env.N8N_WEBHOOK_URL;
    if (!n8nUrl) {
      logger.error('N8N_WEBHOOK_URL not configured', { action: 'n8n_proxy' });
      return NextResponse.json({ error: "Errore di configurazione del server" }, { status: 500 });
    }

    // 3. Webhook Secret (outgoing request to n8n) - FAIL SAFE
    const webhookSecret = process.env.N8N_WEBHOOK_SECRET;
    if (!webhookSecret) {
      logger.error('N8N_WEBHOOK_SECRET not configured - blocking request for security', {
        action: 'n8n_proxy',
        component: 'n8n-proxy'
      });
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const body = await req.json();

    // 4. Input Validation
    const validation = n8nProxySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Dati non validi', details: validation.error.flatten() }, { status: 400 });
    }

    // 5. Forward to n8n with secure header
    const response = await fetch(n8nUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-n8n-secret': webhookSecret,
      },
      body: JSON.stringify(validation.data),
    });

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    logger.captureError(error, { action: 'n8n_proxy', component: 'n8n-proxy' });
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dati non validi', details: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ text: "Errore di connessione." }, { status: 500 });
  }
}