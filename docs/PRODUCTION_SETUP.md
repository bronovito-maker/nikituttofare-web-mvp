# 🚀 Guida Setup Produzione - NikiTuttoFare

Questa guida ti accompagna nella configurazione completa per il deploy in produzione.

---

## 📋 Indice

1. [Configurazione Supabase](#1-configurazione-supabase)
2. [Variabili d'Ambiente](#2-variabili-dambiente)
3. [Google Gemini AI](#3-google-gemini-ai)
4. [Telegram Bot](#4-telegram-bot)
5. [Deploy e Test](#5-deploy-e-test)

---

## 1. Configurazione Supabase

### 1.1 Crea un progetto Supabase

1. Vai su [supabase.com](https://supabase.com) e accedi/registrati
2. Clicca **"New Project"**
3. Compila i campi:
   - **Name**: `nikituttofare-production`
   - **Database Password**: genera una password sicura e salvala
   - **Region**: scegli la più vicina (es. `eu-central-1` per l'Italia)
4. Clicca **"Create new project"** e attendi 2-3 minuti

### 1.2 Esegui le Migration SQL

Vai su **SQL Editor** nel pannello Supabase ed esegui in ordine:

#### Migration 1: Schema Iniziale
```sql
-- Copia il contenuto di: supabase/migrations/001_initial_schema.sql
```

#### Migration 2: RLS Admin e Storage
```sql
-- Copia il contenuto di: supabase/migrations/002_admin_rls_and_storage.sql
```

### 1.3 Configura l'Autenticazione

1. Vai su **Authentication** > **URL Configuration**
2. Imposta:
   - **Site URL**: `https://tuo-dominio.com` (o `http://localhost:3000` per test)
   - **Redirect URLs**: aggiungi:
     - `https://tuo-dominio.com/chat`
     - `http://localhost:3000/chat` (per sviluppo)

3. Vai su **Authentication** > **Email Templates**
4. Personalizza il template "Magic Link" (opzionale):

```html
<h2>Benvenuto su NikiTuttoFare!</h2>
<p>Clicca il pulsante per accedere:</p>
<a href="{{ .ConfirmationURL }}" style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">
  Accedi a NikiTuttoFare
</a>
<p>Se non hai richiesto questo link, ignora questa email.</p>
```

### 1.4 Ottieni le Chiavi API

1. Vai su **Settings** > **API**
2. Copia queste chiavi:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ MAI ESPORRE PUBBLICAMENTE

### 1.5 Crea un Account Admin

Esegui questo SQL per promuovere un utente ad admin:

```sql
-- Dopo che l'utente si è registrato con Magic Link, esegui:
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'tua-email@esempio.com';

-- Verifica:
SELECT * FROM public.profiles WHERE role = 'admin';
```

---

## 2. Variabili d'Ambiente

### 2.1 Crea il file `.env.local`

```bash
cp env.example .env.local
```

### 2.2 Compila tutte le variabili

```env
# ==========================================
# SUPABASE
# ==========================================
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx

# ==========================================
# NEXTAUTH (opzionale se usi solo Supabase Auth)
# ==========================================
NEXTAUTH_URL=https://tuo-dominio.com
NEXTAUTH_SECRET=genera-con-openssl-rand-base64-32

# ==========================================
# GOOGLE GEMINI AI
# ==========================================
GOOGLE_GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxx

# ==========================================
# TELEGRAM NOTIFICATIONS
# ==========================================
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=-1001234567890
```

---

## 3. Google Gemini AI

### 3.1 Ottieni la API Key

1. Vai su [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Clicca **"Create API Key"**
3. Seleziona o crea un progetto Google Cloud
4. Copia la chiave generata

### 3.2 Modelli Consigliati

- **Chat veloce**: `gemini-1.5-flash` (default)
- **Ragionamento complesso**: `gemini-1.5-pro`

---

## 4. Telegram Bot

### 4.1 Crea il Bot

1. Apri Telegram e cerca `@BotFather`
2. Invia `/newbot`
3. Segui le istruzioni:
   - Nome: `NikiTuttoFare Alerts`
   - Username: `nikituttofare_alerts_bot` (unico)
4. Copia il **Bot Token** che ricevi

### 4.2 Ottieni il Chat ID

#### Per un gruppo:
1. Crea un gruppo Telegram per le notifiche
2. Aggiungi il bot al gruppo
3. Invia un messaggio nel gruppo
4. Vai su: `https://api.telegram.org/bot<TOKEN>/getUpdates`
5. Cerca `"chat":{"id":-100xxxxxxxxxx}` - questo è il Chat ID

#### Per notifiche personali:
1. Invia `/start` al tuo bot
2. Vai su: `https://api.telegram.org/bot<TOKEN>/getUpdates`
3. Copia il tuo Chat ID personale

---

## 5. Deploy e Test

### 5.1 Test Locale

```bash
# Installa dipendenze
npm install

# Avvia in development
npm run dev

# Apri http://localhost:3000
```

### 5.2 Checklist Test

#### ✅ Magic Link
- [ ] Vai su `/login` e inserisci email
- [ ] Ricevi l'email con il link
- [ ] Clicca il link → redirect a `/chat`
- [ ] La sessione è attiva (vedi header con avatar utente)

#### ✅ Creazione Ticket
- [ ] Dalla chat, descrivi un problema
- [ ] Il ticket viene creato (verifica in Supabase > Table Editor > tickets)
- [ ] Vai su `/dashboard` → vedi il tuo ticket

#### ✅ Admin Dashboard
- [ ] Promuovi il tuo utente ad admin (vedi sezione 1.5)
- [ ] Vai su `/admin` → vedi tutti i ticket
- [ ] Cambia stato di un ticket → verifica persistenza

#### ✅ Upload Immagine
- [ ] Dalla chat, clicca icona fotocamera
- [ ] Carica un'immagine
- [ ] L'immagine appare nella chat
- [ ] Verifica in Supabase > Storage > ticket-photos

#### ✅ Telegram Notifications
- [ ] Crea un nuovo ticket
- [ ] Ricevi notifica nel gruppo/chat Telegram

### 5.3 Deploy su Vercel

```bash
# Installa Vercel CLI
npm i -g vercel

# Deploy
vercel

# Configura variabili d'ambiente
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add GOOGLE_GEMINI_API_KEY
vercel env add TELEGRAM_BOT_TOKEN
vercel env add TELEGRAM_CHAT_ID

# Rideploy con le nuove env vars
vercel --prod
```

### 5.4 Aggiorna Supabase URL

Dopo il deploy, aggiorna in Supabase:
1. **Authentication** > **URL Configuration**
2. Aggiungi il dominio Vercel ai **Redirect URLs**:
   - `https://tuo-progetto.vercel.app/chat`

---

## 🔧 Troubleshooting

### "Bucket not found" per upload immagini
Verifica che la migration `002_admin_rls_and_storage.sql` sia stata eseguita.

### Magic Link non funziona
1. Controlla che l'URL sia nei "Redirect URLs" di Supabase
2. Verifica che l'email non sia in spam
3. Controlla i log in Supabase > Authentication > Logs

### Admin non vede i ticket
1. Verifica che `profiles.role = 'admin'` per l'utente
2. Verifica che le RLS policies admin siano attive

### Errori CORS
Verifica che il dominio sia configurato correttamente in Supabase API settings.

---

## 📞 Supporto

Per problemi tecnici, controlla i log in:
- Vercel Dashboard > Functions > Logs
- Supabase Dashboard > Logs

---

*Ultimo aggiornamento: Gennaio 2026*
