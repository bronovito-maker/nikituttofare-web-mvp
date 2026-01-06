# Supabase Setup Guide

Questa cartella contiene le migrazioni SQL per il database Supabase.

## Setup Iniziale

### 1. Crea un progetto Supabase

1. Vai su [supabase.com](https://supabase.com)
2. Crea un nuovo progetto
3. Prendi nota di:
   - **Project URL** (es: `https://xxxxx.supabase.co`)
   - **Anon/Public Key** (chiave pubblica)
   - **Service Role Key** (chiave privata, solo per operazioni server-side)

### 2. Configura le variabili d'ambiente

Copia `.env.example` in `.env` e compila:

```bash
cp .env.example .env
```

Aggiungi le tue chiavi Supabase:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 3. Esegui la migrazione SQL

#### Opzione A: Via Supabase Dashboard (Consigliato)

1. Vai al tuo progetto Supabase
2. Apri **SQL Editor**
3. Copia il contenuto di `migrations/001_initial_schema.sql`
4. Incolla ed esegui

#### Opzione B: Via Supabase CLI

```bash
# Installa Supabase CLI (se non l'hai già)
npm install -g supabase

# Login
supabase login

# Link al tuo progetto
supabase link --project-ref your-project-ref

# Esegui la migrazione
supabase db push
```

### 4. Configura Storage Bucket (per le foto)

1. Vai su **Storage** nel dashboard Supabase
2. Crea un nuovo bucket chiamato `ticket-photos`
3. Imposta come **Public** o **Authenticated** (a seconda delle tue esigenze)
4. Configura le policy RLS:

```sql
-- Policy: Users can upload photos
CREATE POLICY "Users can upload photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'ticket-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can view their own photos
CREATE POLICY "Users can view own photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'ticket-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Admins can view all photos
CREATE POLICY "Admins can view all photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'ticket-photos' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

## Verifica

Dopo aver eseguito la migrazione, verifica che le tabelle siano state create:

1. Vai su **Table Editor** nel dashboard Supabase
2. Dovresti vedere:
   - `profiles`
   - `tickets`
   - `messages`

## Note Importanti

- **RLS (Row Level Security)** è abilitato su tutte le tabelle
- Gli utenti possono vedere solo i propri dati (tranne admin/technician)
- Il trigger `handle_new_user` crea automaticamente un profilo quando un utente si registra
- La tabella `profiles` estende `auth.users` con dati aggiuntivi
