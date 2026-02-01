# Infrastruttura & Migrazione n8n - Manuale Operativo

Questo documento serve come riferimento unico per la gestione dell'infrastruttura di produzione, con focus particolare sulla migrazione di n8n su Railway e il collegamento con il Frontend su Vercel.

## 1. Architettura del Sistema

Il sistema adotta un'architettura a microservizi distribuiti per garantire scalabilità e resilienza.

**Flusso Dati:**
```mermaid
graph TD
    User[Utente Finale] -->|HTTPS| Vercel[Vercel (Next.js Frontend)]
    Vercel -->|Webhook POST /api/chat| Railway[Railway (n8n Automation)]
    Railway -->|Query/Mutations| Supabase[(Supabase DB)]
    Railway -->|API Call| Gemini[Google Gemini AI]
    Railway -->|API Call| Telegram[Telegram Bot]
    Railway -->|Response JSON| Vercel
    Vercel -->|UI Update| User
```

## 2. Checklist Migrazione n8n (Railway)

### Setup Iniziale
1.  Crea un nuovo progetto su **[Railway.app](https://railway.app)**.
2.  Aggiungi un nuovo servizio selezionando **Docker Image**.
3.  Immagine: `n8nio/n8n:latest` (consigliato pinnare una versione specifica per stabilità, es. `n8nio/n8n:1.x.x`).

### Variabili d'Ambiente (Railway)
Configura le seguenti variabili nel tab *Variables* del servizio n8n. **Queste sono critiche per il funzionamento.**

| Chiave | Valore / Descrizione |
| :--- | :--- |
| `N8N_ENCRYPTION_KEY` | **CRITICO**: Stringa alfanumerica casuale per criptare le credenziali nel DB. **Salvala in un password manager.** Se persa, perdi l'accesso a tutte le credenziali salvate. |
| `N8N_HOST` | Il dominio pubblico generato da Railway (es. `n8n-production.up.railway.app`). |
| `N8N_PORT` | `5678` |
| `N8N_PROTOCOL` | `https` |
| `WEBHOOK_URL` | `https://${N8N_HOST}/` (Assicura che i link dei webhook nell'UI siano corretti). |
| `N8N_PROXY_HOPS` | `1` (Risolve errore `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` su Railway). |
| `N8N_BASIC_AUTH_ACTIVE`| `true` (Protegge l'accesso alla dashboard n8n). |
| `N8N_BASIC_AUTH_USER` | Tuo username amministratore. |
| `N8N_BASIC_AUTH_PASSWORD`| Tua password amministratore. |

### Persistenza Dati (Volume)
⚠️ **Fondamentale**: Senza un volume persistente, perderai tutti i workflow a ogni riavvio/deploy.

1.  Vai su **Settings** del servizio n8n in Railway.
2.  Scorri fino alla sezione **Volumes**.
3.  Aggiungi un volume montato su: `/home/node/.n8n`.

## 3. Configurazione Vercel (Frontend)

Dopo aver avviato n8n su Railway, devi istruire il Frontend su Vercel a parlare con la nuova istanza.

1.  Vai su **Vercel Dashboard** > Seleziona Progetto > **Settings** > **Environment Variables**.
2.  Aggiorna le seguenti variabili (o aggiungile se mancano):

| Variabile Vercel | Valore da Inserire |
| :--- | :--- |
| `N8N_WEBHOOK_URL` | **URL di Produzione**: `https://<TUO-DOMINIO-RAILWAY>/webhook/<tuo-endpoint-chat>` <br> *Nota: Copialo direttamente dal nodo Webhook in n8n (tab Production).* |
| `N8N_SIGNING_SECRET` | **MATCH OBBLIGATORIO**: Deve essere identico al segreto che imposti/leggi nel frontend o nel backend (se usi validazione HMAC). |
| `N8N_SECRET_TOKEN` | **HEADER AUTH**: Token da inserire nel nodo Webhook di n8n (Credential Type: Header Auth). |

### Verifica Funzionale
1.  Attiva il workflow su n8n (Switch **Active** in alto a destra su verde).
2.  Apri il sito di produzione (versione Vercel).
3.  Invia un messaggio nella chat.
4.  Controlla la tab **Executions** su n8n Railway:
    -   **Successo**: Esecuzione verde.
    -   **Errore**: Se non appare nulla, l'URL su Vercel è errato.
    -   **401/403**: Il `N8N_SIGNING_SECRET` o i token di auth non corrispondono.

## 4. Sicurezza & Best Practices

-   **Secret Rotation**: Se sospetti che `N8N_ENCRYPTION_KEY` o `N8N_BASIC_AUTH_PASSWORD` siano compromessi, ruotali immediatamente e riavvia il servizio (⚠️ Attenzione: il cambio della encryption key invaliderà le credenziali salvate in n8n).
-   **Workflow Active**: Ricorda che cliccare "Execute Node" nell'editor è solo per test. Per la produzione il workflow deve essere salvato e attivato.
-   **Environment Promotion**: Evita di modificare workflow "live" in produzione. Sviluppa su n8n locale, esporta il JSON, e importa su Railway.
