# 🚀 Setup Supabase - FASE 1

## ✅ Cosa è stato fatto

### 1. Configurazione Supabase Client
- ✅ Creato `lib/supabase.ts` con tre funzioni helper:
  - `createServerClient()` - per Server Components, Server Actions, API Routes
  - `createBrowserClient()` - per Client Components
  - `createAdminClient()` - per operazioni admin (usa service role key)

### 2. Tipi TypeScript
- ✅ Creato `lib/database.types.ts` con i tipi per tutte le tabelle:
  - `profiles`
  - `tickets`
  - `messages`

### 3. Migrazione SQL
- ✅ Creato `supabase/migrations/001_initial_schema.sql` con:
  - Creazione tabelle (`profiles`, `tickets`, `messages`)
  - Indici per performance
  - Row Level Security (RLS) policies
  - Trigger per auto-creare profilo all'iscrizione

### 4. File di configurazione
- ✅ Creato `env.example` con tutte le variabili necessarie
- ✅ Creato `supabase/README.md` con guida dettagliata

## 📋 Prossimi Passi

### Step 1: Crea progetto Supabase
1. Vai su [supabase.com](https://supabase.com) e crea un nuovo progetto
2. Prendi nota di:
   - **Project URL** (es: `https://xxxxx.supabase.co`)
   - **Anon/Public Key**
   - **Service Role Key** (tienila segreta!)

### Step 2: Configura variabili d'ambiente
```bash
# Copia il file di esempio
cp env.example .env

# Apri .env e compila con le tue chiavi Supabase
```

### Step 3: Esegui la migrazione SQL
1. Vai al dashboard Supabase → **SQL Editor**
2. Copia il contenuto di `supabase/migrations/001_initial_schema.sql`
3. Incolla ed esegui

### Step 4: Configura Storage Bucket
1. Vai su **Storage** nel dashboard
2. Crea bucket `ticket-photos`
3. Configura le policy RLS (vedi `supabase/README.md`)

## 🔧 Come usare Supabase nel codice

### Server Components / Server Actions
```typescript
import { createServerClient } from '@/lib/supabase';

export async function MyServerComponent() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('tickets')
    .select('*');
  // ...
}
```

### Client Components
```typescript
'use client';
import { createBrowserClient } from '@/lib/supabase';
import { useEffect, useState } from 'react';

export function MyClientComponent() {
  const [tickets, setTickets] = useState([]);
  const supabase = createBrowserClient();

  useEffect(() => {
    supabase
      .from('tickets')
      .select('*')
      .then(({ data, error }) => {
        if (data) setTickets(data);
      });
  }, []);

  // ...
}
```

### API Routes
```typescript
import { createServerClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('tickets')
    .select('*');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
```

## 🔐 Autenticazione

Il progetto attualmente usa Next-Auth con Credentials provider (mock). 

**Prossimo step (FASE 1):** Sostituire con Supabase Auth Magic Link.

Per ora, le tabelle sono pronte e il client è configurato. Quando implementeremo l'auth Supabase, il trigger `handle_new_user` creerà automaticamente un profilo nella tabella `profiles` quando un utente si registra.

## 📊 Schema Database

### `profiles`
- Estende `auth.users` con dati aggiuntivi
- Campi: `id`, `email`, `full_name`, `phone`, `role`, `created_at`

### `tickets`
- Ticket/richieste di servizio
- Campi: `id`, `user_id`, `status`, `category`, `priority`, `description`, `address`, `payment_status`, `created_at`

### `messages`
- Messaggi della chat associati ai ticket
- Campi: `id`, `ticket_id`, `role`, `content`, `image_url`, `meta_data`, `created_at`

## ⚠️ Note Importanti

1. **RLS è abilitato**: Gli utenti vedono solo i propri dati (tranne admin/technician)
2. **Service Role Key**: Usala solo server-side, mai esporla al client
3. **Tipi TypeScript**: Importa `Database` da `@/lib/database.types` per type safety
4. **Frontend esistente**: Non è stato modificato, solo preparato per la connessione

## 🐛 Troubleshooting

### Errore: "Missing Supabase environment variables"
- Verifica che `.env` esista e contenga tutte le variabili necessarie
- Riavvia il server di sviluppo dopo aver modificato `.env`

### Errore: "relation does not exist"
- La migrazione SQL non è stata eseguita
- Esegui `001_initial_schema.sql` nel SQL Editor di Supabase

### Errore: "permission denied"
- Verifica le RLS policies
- Controlla che l'utente sia autenticato correttamente
