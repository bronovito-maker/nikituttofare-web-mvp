# 🔐 Risoluzione Errore NextAuth MissingSecret

## Problema
Quando avvii il server, vedi errori come:
```
[auth][error] MissingSecret: Please define a `secret`
```

## Causa
NextAuth richiede un `secret` per firmare e verificare i token JWT. Questo secret deve essere definito nella variabile d'ambiente `NEXTAUTH_SECRET`.

## Soluzione Rapida

### Step 1: Genera un Secret
```bash
npm run generate-secret
```

Questo comando genera un secret sicuro e ti mostra come aggiungerlo al file `.env`.

### Step 2: Crea/Modifica il file .env
Crea un file `.env` nella root del progetto (se non esiste già) e aggiungi:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=il_tuo_secret_generato
```

### Step 3: Riavvia il Server
```bash
# Ferma il server (Ctrl+C) e riavvialo
npm run dev
```

## Verifica

Dopo aver aggiunto il secret, non dovresti più vedere errori `MissingSecret` nel terminale.

## Per Produzione

⚠️ **IMPORTANTE**: Per produzione, genera sempre un nuovo secret:

```bash
npm run generate-secret
```

E usa un secret diverso da quello di sviluppo. Non condividere mai il secret di produzione!

## Note

- Il file `.env` è già nel `.gitignore`, quindi non verrà committato
- Il secret deve essere lungo almeno 32 caratteri
- Puoi usare lo stesso secret per sviluppo, ma cambialo per produzione
