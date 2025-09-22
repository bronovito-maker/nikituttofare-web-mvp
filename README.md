NTF Web MVP (Next.js, Next-Auth, NocoDB)
Questa applicazione è un MVP (Minimum Viable Product) per un servizio di assistenza domestica. L'obiettivo è fornire un'interfaccia mobile-first e intuitiva, basata su una chat, per raccogliere le richieste degli utenti. Le richieste vengono poi elaborate e inviate a un workflow di n8n per l'assegnazione a un tecnico tramite Telegram.

L'applicazione include anche un'area utente protetta da autenticazione, dove gli utenti registrati possono visualizzare lo storico e lo stato delle loro richieste.

Stack Tecnologico
Framework: Next.js (App Router)

Stile: Tailwind CSS con Shadcn UI per componenti pronti all'uso.

Autenticazione: Next-Auth v5 con un provider di credenziali (email/password).

Database: NocoDB utilizzato come backend, con un adapter custom per Next-Auth.

Intelligenza Artificiale: Google AI (Gemini) per l'analisi e la categorizzazione delle richieste utente.

Deployment: Ottimizzato per Railway.

Funzionalità Principali
Chatbot Intelligente (/chat): Un'interfaccia di chat guida l'utente attraverso la creazione di una richiesta di servizio. Il chatbot pone domande mirate per raccogliere tutti i dettagli necessari.

Registrazione e Login Utente (/register, /login): Un sistema di autenticazione completo che permette agli utenti di creare un account e accedere a un'area riservata.

Dashboard Utente (/dashboard): Una volta autenticati, gli utenti possono visualizzare una lista di tutte le loro richieste, con lo stato di avanzamento in tempo reale.

Dettaglio Richiesta (/dashboard/[ticketId]): Ogni richiesta ha una pagina di dettaglio dedicata per una visione completa.

Profilo Utente (/profilo): Una sezione dove l'utente può gestire i propri dati (funzionalità in sviluppo).

Architettura e Flusso Dati
Intake via Chat: L'utente descrive il problema nella chat. La richiesta viene inviata all'endpoint /api/assist.

Analisi AI: L'API /api/assist interroga il modello AI di Google per analizzare il testo, categorizzare il servizio (es. "idraulico", "elettricista"), stimare l'urgenza e preparare un riassunto per il tecnico.

Raccolta Dati: La chat continua a raccogliere informazioni anagrafiche (nome, indirizzo, telefono, ecc.).

Invio a n8n: Una volta confermata, la richiesta completa (inclusi i dati analizzati dall'AI) viene inviata all'endpoint /api/contact, che a sua volta la inoltra a un webhook di n8n.

Creazione del Lead: Il workflow di n8n processa i dati e crea un nuovo record nella tabella dei "Leads" su NocoDB.

Visualizzazione su Dashboard: L'utente, se registrato, può vedere la richiesta appena creata nella sua dashboard, che legge i dati direttamente da NocoDB tramite l'endpoint /api/requests.

Setup del Progetto
Clona il repository:

Bash

git clone https://github.com/nikituttofare-web-mvp.git
cd nikituttofare-web-mvp
Installa le dipendenze:

Bash

npm install
Configura le variabili d'ambiente:
Copia il file .env.example in un nuovo file chiamato .env e compila tutte le variabili richieste.

Bash

cp .env.example .env
Le variabili includono le chiavi per NocoDB, Google AI, Next-Auth, e l'URL del webhook di n8n.

Avvia il server di sviluppo:

Bash

npm run dev
L'applicazione sarà disponibile su http://localhost:3000.

Deploy su Railway
Questo progetto è configurato per un deploy semplice e veloce su Railway.

Crea un Nuovo Progetto: Collega il tuo account GitHub e seleziona questo repository.

Aggiungi le Variabili d'Ambiente: Nel pannello di configurazione del progetto su Railway, aggiungi tutte le variabili definite nel tuo file .env.

Comando di Avvio: Railway dovrebbe rilevare automaticamente che si tratta di un'app Next.js e usare npm run start (dopo aver eseguito npm run build in automatico).

Porta: La porta di default è 3000.