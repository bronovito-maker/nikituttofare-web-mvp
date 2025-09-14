// app/api/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, createUser } from '@/lib/noco'; // Assumiamo che creerai la funzione createUser
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    // 1. Validazione base dei dati
    if (!name || !email || !password || password.length < 8) {
      return NextResponse.json({ error: 'Dati forniti non validi o password troppo corta.' }, { status: 400 });
    }

    // 2. Controlla se l'utente esiste già
    const base = process.env.NOCO_BASE_URL || "";
    const token = process.env.NOCO_API_TOKEN || "";
    const usersTable = process.env.NOCO_USERS_TABLE_ID || "";

    const existingUser = await getUserByEmail(base, token, usersTable, email);
    if (existingUser) {
      return NextResponse.json({ error: 'Un utente con questa email esiste già.' }, { status: 409 }); // 409 Conflict
    }

    // 3. Cripta la password
    const password_hash = await bcrypt.hash(password, 10);

    // 4. Crea il nuovo utente nel database
    // NOTA: Dovrai creare la funzione `createUser` nel tuo file `lib/noco.ts`
    // per fare una richiesta POST a NocoDB e inserire i dati.
    const newUser = await createUser(base, token, usersTable, {
      name,
      email: email.toLowerCase(),
      password_hash,
    });

    return NextResponse.json({ success: true, userId: newUser.id }, { status: 201 }); // 201 Created

  } catch (error: any) {
    console.error("Errore nell'API di registrazione:", error);
    return NextResponse.json({ error: 'Errore interno del server.' }, { status: 500 });
  }
}