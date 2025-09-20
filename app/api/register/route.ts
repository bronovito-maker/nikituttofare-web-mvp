// app/api/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, createUser } from '@/lib/noco';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const RegisterSchema = z.object({
  name: z.string().min(2, "Il nome è troppo corto"),
  email: z.string().email("Formato email non valido"),
  password: z.string()
    .min(8, "La password deve essere di almeno 8 caratteri")
    .regex(/[A-Z]/, "La password deve contenere almeno una lettera maiuscola")
    .regex(/[0-9]/, "La password deve contenere almeno un numero"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = RegisterSchema.safeParse(body);

    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      const errorMessage = Object.values(errors).flat().join('. ');
      return NextResponse.json({ error: errorMessage || 'Dati forniti non validi.' }, { status: 400 });
    }
    
    const { name, email, password } = validation.data;

    // Controlla se l'utente esiste già
    const base = process.env.NOCO_BASE_URL || "";
    const token = process.env.NOCO_API_TOKEN || "";
    const usersTable = process.env.NOCO_USERS_TABLE_ID || "";

    const existingUser = await getUserByEmail(base, token, usersTable, email);
    if (existingUser) {
      return NextResponse.json({ error: 'Un utente con questa email esiste già.' }, { status: 409 });
    }

    // Cripta la password
    const password_hash = await bcrypt.hash(password, 10);

    // Crea il nuovo utente nel database
    const newUser = await createUser(base, token, usersTable, {
      name,
      email: email.toLowerCase(),
      password_hash,
    });

    // --- NUOVA PARTE: INVIA EMAIL DI BENVENUTO ---
    try {
      // Assicurati che NEXTAUTH_URL sia definito nel tuo file .env.local
      const baseUrl = process.env.NEXTAUTH_URL || `https://${process.env.VERCEL_URL}`;
      await fetch(`${baseUrl}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email,
          subject: 'Benvenuto in NikiTuttoFare!',
          html: `
            <div style="font-family: sans-serif; padding: 20px; color: #333;">
              <h1 style="color: #007bff;">Ciao ${name},</h1>
              <p>Grazie per esserti registrato su NikiTuttoFare!</p>
              <p>Siamo felici di averti con noi. Ora puoi accedere alla tua area personale per gestire le tue richieste di intervento in modo semplice e veloce.</p>
              <a href="${baseUrl}/login" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">
                Accedi Ora
              </a>
              <p style="margin-top: 30px; font-size: 12px; color: #888;">Se non ti sei registrato tu, puoi ignorare questa email.</p>
            </div>
          `,
        }),
      });
    } catch (emailError) {
      console.error("ATTENZIONE: Utente creato ma email di benvenuto non inviata:", emailError);
      // Non blocchiamo la registrazione se l'email fallisce, ma lo registriamo nei log del server.
    }
    // --- FINE NUOVA PARTE ---

    return NextResponse.json({ success: true, userId: newUser.id }, { status: 201 });

  } catch (error: any) {
    console.error("Errore nell'API di registrazione:", error);
    return NextResponse.json({ error: 'Errore interno del server.' }, { status: 500 });
  }
}