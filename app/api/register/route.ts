// app/api/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, createUser } from '@/lib/noco';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// --- MODIFICA #1: Aggiunto Zod per una validazione più forte ---
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

    // --- MODIFICA #2: Utilizzo dello schema Zod per validare i dati ---
    const validation = RegisterSchema.safeParse(body);

    if (!validation.success) {
      // Estrai i messaggi di errore e inviali come risposta
      const errors = validation.error.flatten().fieldErrors;
      const errorMessage = Object.values(errors).flat().join('. ');
      return NextResponse.json({ error: errorMessage || 'Dati forniti non validi.' }, { status: 400 });
    }
    
    const { name, email, password } = validation.data;

    // 2. Controlla se l'utente esiste già (logica invariata)
    const base = process.env.NOCO_BASE_URL || "";
    const token = process.env.NOCO_API_TOKEN || "";
    const usersTable = process.env.NOCO_USERS_TABLE_ID || "";

    const existingUser = await getUserByEmail(base, token, usersTable, email);
    if (existingUser) {
      return NextResponse.json({ error: 'Un utente con questa email esiste già.' }, { status: 409 });
    }

    // 3. Cripta la password (logica invariata)
    const password_hash = await bcrypt.hash(password, 10);

    // 4. Crea il nuovo utente nel database (logica invariata)
    const newUser = await createUser(base, token, usersTable, {
      name,
      email: email.toLowerCase(),
      password_hash,
    });

    return NextResponse.json({ success: true, userId: newUser.id }, { status: 201 });

  } catch (error: any) {
    console.error("Errore nell'API di registrazione:", error);
    return NextResponse.json({ error: 'Errore interno del server.' }, { status: 500 });
  }
}