# 📋 TODO: Cosa Manca da Implementare

**Data:** 2025-02-07
**Status:** Analisi gap funzionali

---

## 🚨 **CRITICI (Da fare SUBITO)**

### **1. ⚠️ Applicare Database Migration** - **BLOCCANTE**

**Status:** ❌ **NON FATTO**
**Priorità:** 🔴 **CRITICA**

**Problema:**
Il codice è pronto ma la migration database NON è stata applicata. Il sistema recensioni **NON funzionerà** fino a questo step.

**Azioni richieste:**
```bash
# Via Supabase Dashboard SQL Editor
1. Apri https://supabase.com/dashboard
2. SQL Editor → New Query
3. Copia/incolla: supabase/migrations/20260207000000_add_ticket_ratings.sql
4. Run query
5. Verifica: SELECT column_name FROM information_schema.columns
   WHERE table_name = 'tickets' AND column_name IN ('rating', 'review_text');
```

**Impatto se non fatto:**
- ❌ Pagina `/dashboard/review/[id]` → 500 error
- ❌ API `POST /api/tickets/[id]/review` → fail
- ❌ Conversazioni non mostrano stelle recensioni
- ❌ Type errors con Supabase queries

**Tempo stimato:** 5 minuti

---

### **2. 🔧 Rigenerare Types Supabase** - **IMPORTANTE**

**Status:** ❌ **NON FATTO**
**Priorità:** 🟠 **ALTA**

**Problema:**
Il codice usa `as any` temporanei per le nuove colonne. Questo bypassa type safety.

**Azioni richieste:**
```bash
# Trova Project ID: Dashboard → Settings → General → Reference ID
npx supabase gen types typescript --project-id TUO_PROJECT_ID > lib/database.types.ts
```

**Impatto se non fatto:**
- ⚠️ Type safety compromessa (errori non rilevati)
- ⚠️ Autocomplete IDE non funziona per rating/review_text
- ⚠️ Rischio runtime errors non catturati

**Dopo rigeneration:**
Rimuovi tutti i `as any` da:
- `app/api/tickets/[id]/review/route.ts`
- `app/dashboard/review/[id]/page.tsx`
- `app/dashboard/conversations/page.tsx`
- `components/dashboard/conversations-list.tsx`

**Tempo stimato:** 10 minuti

---

### **3. 🐛 Fix sender_role in messages table** - **CRITICO**

**Status:** ❌ **PROBLEMA TROVATO**
**Priorità:** 🔴 **CRITICA**

**Problema:**
Il codice usa `sender_role` ma nel database la colonna si chiama `role`:

```typescript
// app/dashboard/conversations/page.tsx:39
.select('content, created_at, sender_role')  // ❌ sender_role non esiste!
```

```sql
-- current_schema.sql
CREATE TABLE messages (
  role TEXT NOT NULL,  -- ✅ Si chiama "role", non "sender_role"
);
```

**Azioni richieste:**

**Opzione A - Fix codice (CONSIGLIATO):**
```typescript
// app/dashboard/conversations/page.tsx
const { data: lastMsg } = await supabase
  .from('messages')
  .select('content, created_at, role')  // Usa 'role' invece di 'sender_role'
  .eq('ticket_id', ticket.id)
  .order('created_at', { ascending: false })
  .limit(1)
  .single();

// Poi usa lastMsg.role invece di lastMsg.sender_role
```

**Opzione B - Fix database (sconsigliato):**
```sql
ALTER TABLE messages RENAME COLUMN role TO sender_role;
-- Ma dovrai aggiornare TUTTO il codice che usa 'role'
```

**Impatto se non fatto:**
- ❌ `/dashboard/conversations` non carica ultimo messaggio
- ❌ Query fallisce con "column sender_role does not exist"

**Tempo stimato:** 5 minuti

---

## 🎯 **IMPORTANTI (Da fare presto)**

### **4. 📧 Email Notifiche Recensioni** - **BUSINESS VALUE**

**Status:** ❌ **NON IMPLEMENTATO**
**Priorità:** 🟡 **MEDIA**

**Cosa manca:**
- Email al tecnico quando riceve recensione
- Email al cliente per conferma recensione salvata
- Email reminder se ticket resolved da >7 giorni senza recensione

**Implementazione suggerita:**
```typescript
// app/api/tickets/[id]/review/route.ts dopo save review

// 1. Notifica tecnico
await sendEmail({
  to: technician.email,
  subject: '⭐ Hai ricevuto una nuova recensione!',
  template: 'technician-review-received',
  data: { rating, reviewText, ticketDescription }
});

// 2. Conferma cliente
await sendEmail({
  to: user.email,
  subject: '✅ Grazie per la tua recensione!',
  template: 'customer-review-confirmation',
  data: { rating, ticketDescription }
});
```

**Tecnologie da usare:**
- Supabase Edge Functions per email async
- Resend.com o SendGrid per invio
- Template HTML professionale

**Tempo stimato:** 2-3 ore

---

### **5. 🔔 Notifiche Real-time Stato Ticket** - **UX ENHANCEMENT**

**Status:** ❌ **NON IMPLEMENTATO**
**Priorità:** 🟡 **MEDIA**

**Cosa manca:**
Cliente non sa in tempo reale quando:
- Tecnico accetta il lavoro
- Tecnico è in viaggio
- Lavoro completato
- Necessita azione cliente

**Implementazione suggerita:**
```typescript
// hooks/useTicketRealtimeUpdates.ts
export const useTicketRealtimeUpdates = (ticketId: string) => {
  useEffect(() => {
    const supabase = createBrowserClient();

    const channel = supabase
      .channel(`ticket:${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tickets',
          filter: `id=eq.${ticketId}`
        },
        (payload) => {
          const newStatus = payload.new.status;

          // Toast notification
          if (newStatus === 'assigned') {
            toast.success('🎉 Un tecnico ha accettato il lavoro!');
          }
          if (newStatus === 'in_progress') {
            toast.info('🚗 Il tecnico è in viaggio');
          }
          if (newStatus === 'resolved') {
            toast.success('✅ Lavoro completato!');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId]);
};
```

**Uso:**
```typescript
// app/chat/page.tsx
const { status } = useTicketRealtimeUpdates(ticketId);
```

**Tempo stimato:** 2 ore

---

### **6. 📱 Push Notifications (PWA)** - **MOBILE EXPERIENCE**

**Status:** ❌ **NON IMPLEMENTATO**
**Priorità:** 🟡 **MEDIA**

**Cosa manca:**
- Service Worker per push notifications
- Richiesta permessi notifiche
- Backend per inviare notifiche
- Badge count su icon app

**Implementazione suggerita:**
```typescript
// public/service-worker.js
self.addEventListener('push', (event) => {
  const data = event.data.json();

  self.registration.showNotification(data.title, {
    body: data.body,
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    data: { url: data.url }
  });
});

// Richiesta permessi
const requestNotificationPermission = async () => {
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    // Subscribe to push
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: VAPID_PUBLIC_KEY
    });

    // Save subscription to DB
    await saveSubscription(subscription);
  }
};
```

**Tecnologie:**
- Web Push Protocol
- Firebase Cloud Messaging (FCM)
- Supabase Edge Functions

**Tempo stimato:** 4-6 ore

---

## 🎨 **NICE-TO-HAVE (Opzionali)**

### **7. 🏆 Gamification Sistema Punti** - **ENGAGEMENT**

**Status:** ❌ **NON IMPLEMENTATO**
**Priorità:** 🟢 **BASSA**

**Cosa implementare:**
- Badge "Cliente Fedele" dopo 5 interventi
- Badge "Recensore Top" dopo 10 recensioni 5 stelle
- Badge "Early Adopter" per primi 100 utenti
- Punti loyalty: 10 punti per recensione, 5 per foto caricata
- Sconto 10% coupon dopo 50 punti

**Database changes needed:**
```sql
CREATE TABLE user_badges (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  badge_type TEXT,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

-- Add to profiles table
ALTER TABLE profiles
ADD COLUMN total_reviews INTEGER DEFAULT 0,
ADD COLUMN total_tickets INTEGER DEFAULT 0;
```

**Tempo stimato:** 1-2 giorni

---

### **8. 📊 Dashboard Analytics Recensioni** - **ADMIN TOOL**

**Status:** ❌ **NON IMPLEMENTATO**
**Priorità:** 🟢 **BASSA**

**Cosa manca:**
Admin dashboard per vedere:
- Media rating per categoria
- Trend recensioni nel tempo
- Top tecnici per rating
- Peggiori performance
- Sentiment analysis commenti

**Implementazione suggerita:**
```typescript
// app/admin/analytics/page.tsx
export default async function AnalyticsPage() {
  const avgRatingByCategory = await supabase
    .from('tickets')
    .select('category, rating')
    .not('rating', 'is', null);

  const topTechnicians = await supabase
    .from('tickets')
    .select(`
      assigned_technician_id,
      technicians(full_name),
      rating
    `)
    .not('rating', 'is', null)
    .order('rating', { ascending: false });

  return <AnalyticsDashboard data={...} />;
}
```

**Charts necessari:**
- Line chart: rating medio nel tempo
- Bar chart: rating per categoria
- Pie chart: distribuzione 1-5 stelle
- Table: top/bottom 10 tecnici

**Librerie:**
- Recharts o Chart.js
- React Query per caching

**Tempo stimato:** 1 giorno

---

### **9. 🌐 Pagina Pubblica Recensioni** - **SOCIAL PROOF**

**Status:** ❌ **NON IMPLEMENTATO**
**Priorità:** 🟢 **BASSA**

**Cosa implementare:**
- `/recensioni` - Pagina pubblica (no login)
- Grid recensioni 5 stelle
- Filtro per categoria servizio
- Condivisione social (Twitter, FB)
- Widget per embedding su siti esterni

**Esempio:**
```typescript
// app/recensioni/page.tsx
export default async function RecensioniPage() {
  // Public query (no RLS needed)
  const { data: reviews } = await supabase
    .from('tickets')
    .select('rating, review_text, category, created_at, profiles(full_name)')
    .eq('rating', 5)
    .not('review_text', 'is', null)
    .order('created_at', { ascending: false })
    .limit(20);

  return <PublicReviewsGrid reviews={reviews} />;
}
```

**SEO Optimization:**
- Schema.org markup (Review, AggregateRating)
- Open Graph tags per social sharing
- Sitemap include `/recensioni`

**Tempo stimato:** 4-6 ore

---

### **10. 📝 Edit/Delete Recensioni** - **USER CONTROL**

**Status:** ❌ **NON IMPLEMENTATO**
**Priorità:** 🟢 **BASSA**

**Problema attuale:**
Una volta inviata, la recensione è immutabile. Cliente non può:
- Correggere errori
- Aggiornare rating dopo follow-up
- Eliminare recensione negativa se problema risolto

**Implementazione suggerita:**

**Opzione A - Edit entro 24h:**
```typescript
// Business rule: edit solo entro 24h dalla creazione
const canEdit = (review_created_at: string) => {
  const hoursSince = (Date.now() - new Date(review_created_at).getTime()) / (1000 * 60 * 60);
  return hoursSince < 24;
};

// UI: mostra pulsante Edit se canEdit()
{canEdit(ticket.review_created_at) && (
  <Button onClick={() => router.push(`/dashboard/review/${ticket.id}/edit`)}>
    ✏️ Modifica
  </Button>
)}
```

**Opzione B - Delete con motivo:**
```typescript
// Soft delete con audit trail
UPDATE tickets
SET review_text = NULL,
    rating = NULL,
    review_deleted_at = NOW(),
    review_delete_reason = 'Cliente ha richiesto rimozione'
WHERE id = ticket_id;

// Store in audit log
INSERT INTO review_audit_log (ticket_id, action, old_rating, reason)
VALUES (ticket_id, 'deleted', old_rating, reason);
```

**Tempo stimato:** 3-4 ore

---

### **11. 💬 Risposta Tecnico a Recensione** - **TWO-WAY FEEDBACK**

**Status:** ❌ **NON IMPLEMENTATO**
**Priorità:** 🟢 **BASSA**

**Cosa implementare:**
Tecnico può rispondere pubblicamente a recensioni (come Google/TripAdvisor).

**Database changes:**
```sql
CREATE TABLE review_responses (
  id UUID PRIMARY KEY,
  ticket_id UUID REFERENCES tickets(id),
  technician_id UUID REFERENCES profiles(id),
  response_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**UI:**
```typescript
// Sotto la recensione cliente
{ticket.review_text && (
  <div className="border-t pt-4 mt-4">
    <p className="text-sm font-semibold">Risposta del tecnico:</p>
    {ticket.review_response ? (
      <p className="text-sm mt-2">{ticket.review_response}</p>
    ) : (
      <Button onClick={handleAddResponse}>Rispondi</Button>
    )}
  </div>
)}
```

**Tempo stimato:** 2-3 ore

---

### **12. 📤 Export Conversazioni (PDF/CSV)** - **DATA PORTABILITY**

**Status:** ❌ **NON IMPLEMENTATO**
**Priorità:** 🟢 **BASSA**

**Cosa implementare:**
- Export singola conversazione come PDF
- Export tutte conversazioni come CSV
- Include messaggi + metadata

**Implementazione:**
```typescript
// Button in /dashboard/conversations
<Button onClick={() => exportConversation(ticket.id, 'pdf')}>
  📄 Esporta PDF
</Button>

// API endpoint
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const messages = await getMessages(params.id);
  const pdf = await generatePDF(messages);

  return new Response(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="conversazione-${params.id}.pdf"`
    }
  });
}
```

**Librerie:**
- jsPDF per PDF generation
- Papa Parse per CSV

**Tempo stimato:** 3-4 ore

---

### **13. 🔍 Filtri Avanzati Conversazioni** - **POWER USER**

**Status:** ⚠️ **PARZIALMENTE IMPLEMENTATO**
**Priorità:** 🟢 **BASSA**

**Cosa c'è:**
- ✅ Search bar (città, categoria, descrizione)
- ✅ Tabs (In Corso, Completate, Annullate)

**Cosa manca:**
- ❌ Filtro per rating (solo 5 stelle, solo 1 stella)
- ❌ Filtro per data range
- ❌ Filtro per categoria specifica
- ❌ Sort: più recenti, più vecchi, rating alto/basso
- ❌ Filtro multi-select (es: Completate + 5 stelle + Idraulico)

**Implementazione:**
```typescript
// Filter state
const [filters, setFilters] = useState({
  status: ['new', 'assigned', 'in_progress'],
  category: null,
  rating: null,
  dateRange: { from: null, to: null }
});

// Apply filters
const filtered = tickets.filter(t =>
  filters.status.includes(t.status) &&
  (!filters.category || t.category === filters.category) &&
  (!filters.rating || t.rating === filters.rating)
);
```

**Tempo stimato:** 2-3 ore

---

## 🔒 **SICUREZZA & PERFORMANCE**

### **14. 🛡️ Rate Limiting Recensioni** - **ANTI-SPAM**

**Status:** ❌ **NON IMPLEMENTATO**
**Priorità:** 🟡 **MEDIA**

**Problema:**
Un utente malintenzionato potrebbe:
- Creare ticket fake per lasciare recensioni false
- Spammare API recensioni

**Implementazione:**
```typescript
// app/api/tickets/[id]/review/route.ts
import { checkRateLimit } from '@/lib/rate-limit';

const rateLimitResult = checkRateLimit(
  `review:${user.id}`,
  { maxRequests: 5, windowMs: 3600000 } // 5 recensioni per ora
);

if (!rateLimitResult.success) {
  return NextResponse.json(
    { error: 'Troppe recensioni in poco tempo' },
    { status: 429 }
  );
}
```

**Tempo stimato:** 30 minuti

---

### **15. 🗜️ Image Optimization Recensioni** - **PERFORMANCE**

**Status:** ❌ **NON IMPLEMENTATO (SE AGGIUNGI FOTO RECENSIONI)**
**Priorità:** 🟢 **BASSA**

**Se in futuro aggiungi foto alle recensioni:**
- Resize automatico (max 1200x1200)
- Compressione (WebP format)
- CDN caching
- Lazy loading

**Tempo stimato:** 2 ore (se necessario)

---

## 📱 **MOBILE & ACCESSIBILITY**

### **16. ♿ Accessibility Audit** - **INCLUSIVITÀ**

**Status:** ⚠️ **DA VERIFICARE**
**Priorità:** 🟡 **MEDIA**

**Checklist:**
- [ ] Keyboard navigation (Tab, Enter, Esc)
- [ ] Screen reader support (ARIA labels)
- [ ] Contrasto colori (WCAG AA)
- [ ] Focus visible su elementi interattivi
- [ ] Immagini con alt text
- [ ] Form labels corretti

**Tool:**
- Lighthouse audit (Chrome DevTools)
- axe DevTools extension
- WAVE accessibility checker

**Tempo stimato:** 1-2 ore

---

### **17. 📲 PWA Manifest & Offline Mode** - **MOBILE**

**Status:** ⚠️ **PARZIALE**
**Priorità:** 🟢 **BASSA**

**Cosa verificare:**
```json
// public/manifest.json
{
  "name": "NikiTuttoFare",
  "short_name": "Niki",
  "description": "Assistenza domestica AI",
  "start_url": "/",
  "display": "standalone",
  "icons": [ ... ],
  "theme_color": "#2563eb",
  "background_color": "#ffffff"
}
```

**Offline support:**
- Cache pagine principali
- Fallback UI quando offline
- Queue azioni per sync quando torna online

**Tempo stimato:** 3-4 ore

---

## 🧪 **TESTING**

### **18. 🧪 Test E2E Sistema Recensioni** - **QUALITY**

**Status:** ❌ **NON IMPLEMENTATO**
**Priorità:** 🟡 **MEDIA**

**Test necessari:**
```typescript
// tests/e2e/reviews.spec.ts
describe('Sistema Recensioni', () => {
  test('Cliente può lasciare recensione su ticket resolved', async () => {
    // 1. Login cliente
    // 2. Vai su /dashboard/conversations
    // 3. Trova ticket resolved
    // 4. Clicca "Recensisci"
    // 5. Seleziona 5 stelle
    // 6. Aggiungi commento
    // 7. Submit
    // 8. Verifica toast success
    // 9. Verifica stelle appaiono su card
  });

  test('Non può recensire ticket non resolved', async () => {
    // Verifica redirect se status != resolved
  });

  test('Non può recensire due volte', async () => {
    // Verifica redirect se già recensito
  });
});
```

**Tool:** Playwright o Cypress

**Tempo stimato:** 2-3 ore

---

## 📝 **SUMMARY PRIORITÀ**

### **🔴 CRITICI (Fare OGGI):**
1. ✅ Applicare migration database (5 min)
2. ✅ Fix sender_role → role (5 min)
3. ✅ Rigenerare Supabase types (10 min)

**Totale:** ~20 minuti

---

### **🟠 IMPORTANTI (Fare questa settimana):**
4. Email notifiche recensioni (2-3h)
5. Notifiche real-time (2h)
6. Push notifications PWA (4-6h)
7. Rate limiting recensioni (30min)

**Totale:** ~8-12 ore

---

### **🟡 DESIDERABILI (Prossimo sprint):**
8. Gamification (1-2 giorni)
9. Analytics dashboard (1 giorno)
10. Pagina pubblica recensioni (4-6h)
11. Accessibility audit (1-2h)

**Totale:** ~3-4 giorni

---

### **🟢 NICE-TO-HAVE (Backlog):**
12. Edit/delete recensioni (3-4h)
13. Risposta tecnico (2-3h)
14. Export conversazioni (3-4h)
15. Filtri avanzati (2-3h)
16. PWA offline mode (3-4h)
17. Test E2E (2-3h)

**Totale:** ~15-21 ore

---

## ✅ **AZIONI IMMEDIATE**

**Prossimi 30 minuti:**
```bash
# 1. Applica migration
# (copia/incolla SQL in Supabase Dashboard)

# 2. Fix sender_role bug
git checkout -b fix/sender-role-column

# 3. Rigenera types
npx supabase gen types typescript --project-id XXX > lib/database.types.ts

# 4. Test tutto
npm run dev
# → Visita /dashboard/conversations
# → Crea recensione su ticket resolved

# 5. Commit & push
git add .
git commit -m "fix: applica migration rating e fix sender_role bug"
git push origin fix/sender-role-column
```

**Questa settimana:**
- Implementa email notifiche
- Setup notifiche real-time
- Push notifications base

**Prossimo sprint:**
- Gamification
- Analytics
- Pagina pubblica recensioni

---

## 🎯 **RACCOMANDAZIONE**

**Focus su:**
1. **Critici** (20 min) → Sistema funzionante
2. **Email notifiche** (3h) → Business value immediato
3. **Realtime updates** (2h) → UX migliorata significativamente

**Dopo questi 3, hai un sistema completo e professionale!** 🚀

Il resto sono enhancement che puoi aggiungere gradualmente basato sul feedback utenti.
