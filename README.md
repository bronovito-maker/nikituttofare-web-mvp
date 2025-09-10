# NTF Web (Next.js on Railway)

Sito minimale, mobile-first, con intake stile chat → invio a n8n → assegnazione su Telegram. Dashboard utente legge i **leads** da NocoDB.

## Setup

1. **Copia .env.example in .env** e compila le variabili.
2. `npm i`
3. `npm run dev`

## Deploy su Railway

- Crea un nuovo progetto → GitHub repo → seleziona questa cartella.
- Aggiungi le **Environment Variables** come da `.env.example`.
- Start command: `npm run start` (Railway build esegue `npm run build` automaticamente se rileva Next).
- Porta 3000 (default).

## Rotte

- `/` Landing minimal
- `/chat` Intake stile chat → POST `api/contact`
- `/login` Login email-only (qualsiasi email accettata)
- `/dashboard` Lista leads utente da NocoDB (richiede login)

## Note

- `api/contact` inoltra al webhook n8n (`N8N_WEBHOOK_URL`), producendo un `userId` **compatibile** con il normalizzatore di n8n.
- `api/requests` interroga NocoDB filtrando per `userId`.
- UI leggera con Tailwind, nessuna dipendenza UI extra.
