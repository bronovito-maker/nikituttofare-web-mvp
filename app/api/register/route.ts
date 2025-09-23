// File: app/api/register/route.ts

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { hashPassword } from '@/lib/crypto'; // <-- CORREZIONE: Import da crypto
import { getUserByEmail, createUser } from '@/lib/noco'; // <-- CORREZIONE: Import da noco

// Schema di validazione per i dati di registrazione
const RegisterSchema = z.object({
  name: z.string().min(2, "Il nome è troppo corto"),
  email: z.string().email("Formato email non valido"),
  password: z.string().min(6, "La password deve essere di almeno 6 caratteri"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = RegisterSchema.safeParse(body);

    if (!validation.success) {
      const errorMessage = validation.error.flatten().fieldErrors;
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }
    
    const { name, email, password } = validation.data;

    // Controlla se l'utente esiste già
    const existingUser = await getUserByEmail(email); // <-- CORREZIONE: Chiamata con 1 argomento
    if (existingUser) {
      return NextResponse.json({ error: 'Un utente con questa email esiste già.' }, { status: 409 });
    }

    // Hash della password
    const hashedPassword = await hashPassword(password);

    // Crea il nuovo utente
    const newUser = await createUser({ // <-- CORREZIONE: Chiamata con 1 oggetto
      name,
      email: email.toLowerCase(),
      passwordHash: hashedPassword,
    });

    if (!newUser) {
        throw new Error("La creazione dell'utente è fallita.");
    }
    
    return NextResponse.json({ message: 'Utente registrato con successo.' }, { status: 201 });

  } catch (error) {
    console.error('Errore durante la registrazione:', error);
    return NextResponse.json({ error: 'Errore interno del server.' }, { status: 500 });
  }
}