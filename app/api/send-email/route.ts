// app/api/send-email/route.ts
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Inizializza Resend con la tua API Key (assicurati sia nel file .env.local)
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Estrae i dati necessari dal corpo della richiesta
    const { to, subject, html } = body;

    // Controlla che tutti i campi necessari siano presenti
    if (!to || !subject || !html) {
      return NextResponse.json({ error: "Dati mancanti per l'invio dell'email" }, { status: 400 });
    }

    // Invia l'email usando Resend
    const { data, error } = await resend.emails.send({
      // IMPORTANTE: Sostituisci questa email con il tuo dominio verificato su Resend
      from: 'NikiTuttoFare <noreply@tuo-dominio-verificato.com>', 
      to: [to],
      subject: subject,
      html: html, // Il contenuto dell'email in formato HTML
    });

    // Se Resend restituisce un errore, lo inoltriamo
    if (error) {
      console.error("Errore da Resend:", error);
      return NextResponse.json({ error: "Errore durante l'invio dell'email" }, { status: 500 });
    }

    // Se l'invio ha successo, restituiamo una risposta positiva
    return NextResponse.json(data);

  } catch (error) {
    // Gestisce qualsiasi altro errore imprevisto
    console.error("Errore nell'API send-email:", error);
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 });
  }
}