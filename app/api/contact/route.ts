// app/api/contact/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generateTicketId } from '@/lib/ticket'; // <-- IMPORTIAMO LA NUOVA FUNZIONE

// Lo schema di validazione rimane invariato
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
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = ContactSchema.safeParse(body);

    if (!validation.success) {
      console.error("Errore di validazione:", validation.error.flatten().fieldErrors);
      return NextResponse.json({ error: "Dati inviati non validi" }, { status: 400 });
    }
    
    // --- MODIFICA CHIAVE ---
    // 1. Generiamo il Ticket ID QUI, subito.
    const ticketId = generateTicketId();

    // 2. Aggiungiamo il ticketId al payload che inviamo a n8n
    const payloadForN8n = {
      ...validation.data,
      ticketId: ticketId, // Includiamo l'ID generato
    };
    // --- FINE MODIFICA ---

    const n8nWebhookUrl = process.env.N8N_CONTACT_WEBHOOK_URL;
    if (!n8nWebhookUrl) {
      throw new Error("Webhook URL per n8n non configurato.");
    }
    
    // Invia i dati a n8n (ma non aspettare la sua risposta completa)
    fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadForN8n), // Invia il payload con il ticketId
    }).catch(err => {
      // Logga l'errore ma non bloccare la risposta al cliente
      console.error("Errore nell'invio a n8n (asincrono):", err);
    });

    // 3. Rispondiamo IMMEDIATAMENTE al frontend con il ticketId
    return NextResponse.json({
      ok: true,
      message: "Richiesta ricevuta con successo.",
      ticketId: ticketId, // Restituiamo l'ID che abbiamo creato!
    });

  } catch (error: any) {
    console.error("Errore nell'API /api/contact:", error);
    return NextResponse.json({ error: "Errore interno del server." }, { status: 500 });
  }
}