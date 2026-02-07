# 🔗 Sistema di Abbinamento Chat-Utente

**Domanda:** Come vengono abbinate le chat agli utenti? Usiamo ID univoco, email, o altro?

**Risposta:** Il sistema usa un **approccio a due fasi** che combina `chat_session_id` (anonimo) e `user_id` (autenticato).

---

## 📊 SCHEMA DATABASE

### **Tabella `tickets`**
```sql
CREATE TABLE tickets (
  id UUID PRIMARY KEY,
  user_id UUID,                    -- 👤 ID utente Supabase (NULL per guest)
  chat_session_id TEXT,            -- 🔑 Session ID chat (collega messaggi anonimi)
  status TEXT,
  category TEXT,
  description TEXT,
  -- ... altri campi
);
```

### **Tabella `messages`**
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY,
  ticket_id UUID,                  -- 🎫 FK al ticket
  chat_session_id TEXT,            -- 🔑 Session ID chat (per messaggi prima del ticket)
  role TEXT,                       -- 'user' | 'assistant' | 'system'
  content TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ
);
```

### **Tabella `profiles`**
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,             -- 👤 Uguale a auth.users.id
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'user'         -- 'customer' | 'technician' | 'admin'
);
```

---

## 🔄 FLUSSO DI ABBINAMENTO

### **FASE 1: Chat Anonima (Utente NON loggato)**

#### 1. **Generazione Session ID** (Frontend)
```typescript
// hooks/useN8NChat.tsx:34-35
const array = new Uint32Array(1);
crypto.getRandomValues(array);
const chatId = array[0].toString(36);  // Es: "3f7k2m9a"
localStorage.setItem('chat_session_id', chatId);
```

**Caratteristiche:**
- ✅ Generato randomicamente con `crypto.getRandomValues()`
- ✅ Salvato in `localStorage` (browser-specific)
- ✅ Formato: Base36 string (Es: `"k3m9x2a"`)
- ✅ Univoco per ogni nuova chat
- ⚠️ **NON collegato a un utente specifico** (ancora)

#### 2. **Salvataggio Messaggi Anonimi**
```typescript
// Durante la chat PRIMA del login
{
  id: "uuid-random",
  ticket_id: null,                    // ❌ Nessun ticket ancora
  chat_session_id: "k3m9x2a",        // ✅ Session ID anonimo
  role: "user",
  content: "Ho un problema con il rubinetto",
  created_at: "2025-02-07T10:30:00Z"
}
```

**Stato database:**
- ✅ Messaggi salvati in `messages` con solo `chat_session_id`
- ❌ `ticket_id = NULL` (nessun ticket creato ancora)
- ❌ **Nessun collegamento a utente specifico**

---

### **FASE 2: Creazione Ticket (Con o senza login)**

#### Scenario A: **Utente Guest** (non loggato)

1. **Chat completa → AI chiede email per sicurezza**
2. **Sistema crea ticket "pending_verification":**
```sql
INSERT INTO tickets (
  id,
  user_id,                    -- ❌ NULL (nessun user_id ancora)
  chat_session_id,            -- ✅ "k3m9x2a" (collega alla chat anonima)
  status,                     -- ⏳ 'pending_verification'
  description,
  -- ...
);
```

3. **Update messaggi esistenti:**
```sql
UPDATE messages
SET ticket_id = 'nuovo-ticket-uuid'
WHERE chat_session_id = 'k3m9x2a';  -- Collega tutti i messaggi anonimi al ticket
```

4. **Email di verifica inviata**
   - Link magico con token
   - Cliccando il link → utente si registra automaticamente

5. **Dopo verifica email:**
```sql
-- Sistema crea profilo utente
INSERT INTO profiles (id, email) VALUES ('user-uuid', 'mario@example.com');

-- Collega ticket all'utente
UPDATE tickets
SET user_id = 'user-uuid',
    status = 'confirmed'
WHERE chat_session_id = 'k3m9x2a';
```

**Risultato finale:**
```sql
-- Ticket ora ha ENTRAMBI
user_id: "uuid-utente"           -- ✅ Utente autenticato
chat_session_id: "k3m9x2a"       -- ✅ Traccia della chat originale
```

---

#### Scenario B: **Utente Loggato** (già registrato)

1. **Chat completa → utente già autenticato**
2. **Sistema crea ticket immediatamente "confirmed":**
```sql
INSERT INTO tickets (
  id,
  user_id,                    -- ✅ "uuid-utente" (già loggato)
  chat_session_id,            -- ✅ "k3m9x2a" (collega alla chat)
  status,                     -- ✅ 'confirmed' (skip verifica)
  description,
  -- ...
);
```

3. **Messaggi già collegati:**
```sql
UPDATE messages
SET ticket_id = 'nuovo-ticket-uuid'
WHERE chat_session_id = 'k3m9x2a';
```

**Risultato finale:**
- ✅ Ticket ha `user_id` da subito
- ✅ Ticket ha `chat_session_id` per tracciare l'origine
- ✅ Messaggi collegati al ticket
- ✅ Tecnico notificato immediatamente

---

## 🔒 ROW LEVEL SECURITY (RLS)

### **Policy sui Messaggi:**
```sql
CREATE POLICY "messages_select_hardening"
ON messages FOR SELECT
USING (
  is_admin()
  OR EXISTS (
    SELECT 1 FROM tickets
    WHERE tickets.id = messages.ticket_id
    AND (
      tickets.user_id = auth.uid()              -- ✅ Proprietario ticket
      OR tickets.assigned_technician_id = auth.uid()  -- ✅ Tecnico assegnato
    )
  )
);
```

**Significato:**
- ✅ Un utente può vedere SOLO i messaggi dei suoi ticket (`user_id = auth.uid()`)
- ✅ Un tecnico può vedere SOLO i messaggi dei ticket assegnati a lui
- ✅ Admin può vedere tutto
- ❌ **Non si può accedere ai messaggi altrui** (anche conoscendo il `chat_session_id`)

### **Policy sui Ticket:**
```sql
CREATE POLICY "tickets_select"
ON tickets FOR SELECT
USING (
  user_id = auth.uid()                    -- ✅ Proprietario
  OR assigned_technician_id = auth.uid()  -- ✅ Tecnico assegnato
  OR is_admin()                           -- ✅ Admin
);
```

**Significato:**
- ✅ Ogni utente vede SOLO i propri ticket
- ✅ Identificazione basata su `user_id` (non email, non session ID)

---

## 📋 CARICAMENTO STORICO CONVERSAZIONI

### **Dashboard Conversazioni** (`/dashboard/conversations`)
```typescript
// app/dashboard/conversations/page.tsx
const { data: { user } } = await supabase.auth.getUser();

// Query automaticamente filtrata da RLS
const { data: tickets } = await supabase
  .from('tickets')
  .select('*')
  .eq('user_id', user.id)  // ✅ Solo ticket dell'utente
  .order('created_at', { ascending: false });
```

**Come funziona:**
1. Supabase legge `auth.uid()` dalla sessione JWT
2. RLS policy confronta `tickets.user_id = auth.uid()`
3. Query restituisce **solo** ticket di quell'utente
4. **Impossibile** vedere ticket altrui (anche sapendo gli UUID)

### **Riapertura Chat Specifica** (`/chat?ticket_id=XXX`)
```typescript
// app/chat/page.tsx:69-96
const { data: ticket } = await supabase
  .from('tickets')
  .select('*')
  .eq('id', ticketId)  // Richiesto dalla URL
  .single();

// RLS verifica automaticamente: ticket.user_id = auth.uid()

const { data: history } = await supabase
  .from('messages')
  .select('*')
  .eq('ticket_id', ticketId)
  .order('created_at', { ascending: true });

// RLS verifica che il ticket appartenga all'utente
```

**Sicurezza:**
- ✅ Se `ticket.user_id ≠ auth.uid()` → query restituisce `NULL` (RLS blocca)
- ✅ Se utente non loggato → `auth.uid() = NULL` → nessun risultato
- ✅ **Impossibile** accedere a conversazioni altrui

---

## 🎯 PUNTI CHIAVE

### **1. Identificazione Utente:**
- **Prima del login:** `chat_session_id` (anonimo, browser-local)
- **Dopo il login:** `user_id` (UUID da Supabase Auth)
- **Email:** Usata SOLO per autenticazione, NON per abbinamento dati

### **2. Collegamento Chat-Ticket-Utente:**
```
chat_session_id → ticket → user_id
     (anonim)      (ponte)   (autenticato)
```

### **3. Persistenza:**
- **`chat_session_id`:** Mantiene traccia dell'origine (utile per analytics)
- **`user_id`:** Identificatore principale per RLS e privacy

### **4. Sicurezza:**
- ✅ RLS protegge TUTTI gli accessi al database
- ✅ Basato su `user_id = auth.uid()` (JWT verificato da Supabase)
- ✅ Impossibile bypassare (anche conoscendo UUID altrui)
- ✅ Admin bypass con `is_admin()` function

---

## 🔍 ESEMPI PRATICI

### **Caso 1: Utente Guest → Login dopo chat**
```
1. Guest inizia chat
   chat_session_id: "abc123"
   user_id: NULL

2. Completa chat, sistema chiede email
   → Mario inserisce: mario@example.com

3. Sistema crea ticket pending_verification
   ticket.chat_session_id: "abc123"
   ticket.user_id: NULL

4. Mario clicca link verifica → sistema crea account
   auth.users.id: "uuid-mario"
   auth.users.email: "mario@example.com"

5. Sistema aggiorna ticket
   ticket.user_id: "uuid-mario"  ← ORA COLLEGATO
   ticket.status: "confirmed"

6. Mario accede a /dashboard/conversations
   → Vede il suo ticket (RLS: user_id = uuid-mario)
```

### **Caso 2: Utente già loggato**
```
1. Mario (loggato) inizia chat
   auth.uid(): "uuid-mario"
   chat_session_id: "xyz789"

2. Completa chat
   → Sistema crea ticket immediato
   ticket.user_id: "uuid-mario"  ← GIÀ COLLEGATO
   ticket.chat_session_id: "xyz789"
   ticket.status: "confirmed"

3. Messaggi collegati
   messages.ticket_id: ticket.id
   messages.chat_session_id: "xyz789"

4. Mario vede conversazione in /dashboard/conversations
   → RLS: tickets.user_id = auth.uid() ✅
```

### **Caso 3: Tentativo accesso non autorizzato**
```
1. Attacker trova UUID ticket di Mario: "ticket-123"

2. Attacker prova ad accedere:
   GET /api/tickets/ticket-123

3. Supabase RLS verifica:
   ticket.user_id = auth.uid()
   "uuid-mario" ≠ "uuid-attacker"  ❌

4. Query restituisce: NULL (ticket non esiste per attacker)

5. Attacker NON può vedere:
   - Dati ticket
   - Messaggi
   - Info cliente
```

---

## 🚨 PROBLEMI NOTI E LIMITAZIONI

### **1. Cambio Browser/Dispositivo**
**Problema:** `chat_session_id` è in localStorage → non sincronizzato tra dispositivi

**Impatto:**
- ✅ Dopo login: nessun problema (usa `user_id`)
- ⚠️ Prima login: chat persa se cambi browser

**Soluzione:** Non risolvibile senza login (by design per privacy)

### **2. Clear Browser Data**
**Problema:** Cancellare localStorage perde `chat_session_id`

**Impatto:**
- ✅ Ticket già creato: recuperabile dopo login
- ❌ Chat in corso (prima ticket): persa

**Mitigazione:** Invitare utenti a registrarsi presto

### **3. Sessioni Multiple Stesso Utente**
**Problema:** Utente apre 2 tab → 2 `chat_session_id` diversi

**Impatto:**
- ✅ Entrambe le chat salvate (ticket separati)
- ✅ Visibili in /dashboard/conversations

**Nota:** Comportamento corretto (chat indipendenti)

---

## 📊 QUERY UTILI PER DEBUG

### **Trovare tutti i ticket di un utente:**
```sql
SELECT * FROM tickets
WHERE user_id = 'uuid-utente'
ORDER BY created_at DESC;
```

### **Trovare tutti i messaggi di una chat:**
```sql
SELECT * FROM messages
WHERE chat_session_id = 'abc123'
ORDER BY created_at ASC;
```

### **Trovare chat orfane (senza ticket):**
```sql
SELECT DISTINCT chat_session_id, MAX(created_at) AS last_message
FROM messages
WHERE ticket_id IS NULL
  AND created_at < NOW() - INTERVAL '2 hours'
GROUP BY chat_session_id;
```

### **Collegare chat orfana a utente:**
```sql
-- Dopo che utente si è loggato
UPDATE messages
SET ticket_id = 'nuovo-ticket-uuid'
WHERE chat_session_id = 'abc123'
  AND ticket_id IS NULL;
```

---

## ✅ CONCLUSIONE

**Il sistema usa un approccio ibrido:**
1. **`chat_session_id`** (anonimo) → Traccia chat PRIMA del login
2. **`user_id`** (autenticato) → Identifica proprietario DOPO login
3. **RLS policies** → Garantiscono privacy e sicurezza

**Vantaggi:**
- ✅ Privacy: chat anonime fino a login
- ✅ Sicurezza: RLS basato su `user_id` immutabile
- ✅ Tracciabilità: `chat_session_id` mantiene storia
- ✅ Flessibilità: supporta guest e utenti loggati

**NON usiamo email per abbinamento** perché:
- ❌ Email può cambiare
- ❌ Email non è univoca nel sistema (guest possono avere email temporanee)
- ✅ `user_id` (UUID) è immutabile e garantito univoco da Supabase Auth
