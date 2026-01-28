# 💬 Integrazione Chat con Supabase

## ✅ Modifiche Implementate

### 1. **ChatIntroScreen con Card di Primo Soccorso**
- ✅ Creato nuovo `ChatIntroScreen` con 4 card colorate per le categorie:
  - 🔵 **Idraulico** (plumbing) - Perdite d'acqua, tubi rotti, scarichi
  - ⚡ **Elettricista** (electric) - Interruttori, prese, problemi elettrici
  - 🔑 **Fabbro** (locksmith) - Serrature, chiavi perse, porte bloccate
  - 💨 **Clima** (climate) - Condizionatori, caldaie, riscaldamento
- ✅ Design intuitivo con icone, colori distintivi e descrizioni chiare
- ✅ Click su una card invia automaticamente un messaggio con la categoria

### 2. **MessageInput Migliorato**
- ✅ Barra di input in basso sempre visibile
- ✅ Pulsante per caricare immagini (icona 📎)
- ✅ Preview dell'immagine prima dell'invio
- ✅ Validazione: solo immagini, max 10MB
- ✅ Design moderno con bordi arrotondati e focus states

### 3. **Integrazione Supabase**

#### Funzioni Helper (`lib/supabase-helpers.ts`)
- ✅ `getOrCreateProfile()` - Crea o recupera profilo utente
- ✅ `createTicket()` - Crea un nuovo ticket
- ✅ `saveMessage()` - Salva messaggi associati ai ticket
- ✅ `getTicketMessages()` - Recupera messaggi di un ticket
- ✅ `getUserTickets()` - Recupera tutti i ticket di un utente
- ✅ `updateTicketStatus()` - Aggiorna lo stato di un ticket

#### API Routes
- ✅ `/api/tickets` - Crea e recupera ticket
- ✅ `/api/messages` - Salva messaggi su Supabase
- ✅ `/api/upload-image` - Carica immagini su Supabase Storage

### 4. **useChat Collegato a Supabase**
- ✅ Crea automaticamente un ticket al primo messaggio
- ✅ Rileva automaticamente la categoria dal messaggio
- ✅ Salva tutti i messaggi (utente e AI) su Supabase
- ✅ Carica immagini su Supabase Storage prima di salvare

### 5. **ChatBubble Aggiornato**
- ✅ Mostra immagini quando presenti
- ✅ Design responsive per immagini
- ✅ Timestamp per ogni messaggio

## 🔄 Flusso Completo

1. **Utente apre la chat** → Vede le 4 card di primo soccorso
2. **Utente clicca una card o scrive** → Viene creato un ticket su Supabase
3. **Utente carica un'immagine** → Immagine caricata su Supabase Storage
4. **Messaggio inviato** → Salvato su Supabase nella tabella `messages`
5. **Risposta AI** → Anche la risposta viene salvata su Supabase

## 📊 Struttura Dati

### Ticket
```typescript
{
  id: string (uuid)
// 1. Creare un ticket
const ticket = await createTicket({
  userId: 'user-id',
  category: 'plumbing',
  description: 'Problem description',
  priority: 'medium'
});
  user_id: string (uuid)
  category: 'plumbing' | 'electric' | 'locksmith' | 'climate' | 'handyman' | 'generic'
  status: 'new' | 'pending_verification' | 'confirmed' | 'assigned' | 'in_progress' | 'resolved' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'emergency'
  description: string
  address: string | null
  created_at: timestamptz
}

// STATI DEL TICKET:
// - 'new': Ticket appena creato (legacy)
// - 'pending_verification': In attesa di conferma Magic Link
// - 'confirmed': Verificato via Magic Link, notifica Telegram inviata
// - 'assigned': Tecnico ha accettato l'intervento
// - 'in_progress': Intervento in corso
// - 'resolved': Intervento completato
// - 'cancelled': Annullato
```

### Message
```typescript
{
  id: string (uuid)
  ticket_id: string (uuid)
  role: 'user' | 'assistant' | 'system'
  content: string
  image_url: string | null
  meta_data: jsonb | null
  created_at: timestamptz
}
```

## 🎨 Design

- **Card di Primo Soccorso**: Colori distintivi per categoria, hover effects, icone intuitive
- **MessageInput**: Design moderno con preview immagini, validazione in tempo reale
- **ChatBubble**: Mostra immagini inline, timestamp, design responsive

## ⚠️ Note Importanti

1. **Supabase Storage**: Assicurati di aver creato il bucket `ticket-photos` con le policy RLS corrette
2. **Variabili d'Ambiente**: Verifica che `.env` contenga tutte le chiavi Supabase
3. **Categoria Automatica**: Il sistema rileva automaticamente la categoria dal testo, ma può essere migliorata con AI

## 🚀 Prossimi Passi

1. Migliorare il rilevamento categoria con AI (usando Gemini)
2. Aggiungere geolocalizzazione per l'indirizzo
3. Implementare notifiche Telegram quando viene creato un ticket
4. Aggiungere dashboard per visualizzare i ticket
