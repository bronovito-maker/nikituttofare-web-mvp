# Piano Implementazione: Storico Conversazioni (Stile ChatGPT/Gemini)

## Obiettivo
Creare un sistema di gestione conversazioni stile ChatGPT/Gemini per permettere ai clienti di:
- Visualizzare tutte le chat passate
- Riprendere conversazioni interrotte
- Consultare lo stato dei ticket in tempo reale
- Lasciare recensioni sui servizi ricevuti
- Ricevere notifiche quando il tecnico risponde

---

## 🏗️ ARCHITETTURA

### 1. Database - Nuove Tabelle/Colonne

#### A) Aggiungere colonna `rating` alla tabella `tickets`
```sql
-- Migration: add_ticket_rating.sql
ALTER TABLE tickets
ADD COLUMN rating INTEGER CHECK (rating >= 1 AND rating <= 5),
ADD COLUMN review_text TEXT,
ADD COLUMN review_created_at TIMESTAMPTZ;
```

#### B) Creare tabella `chat_sessions` (opzionale, per gestione avanzata)
```sql
-- Migration: create_chat_sessions.sql
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  session_id TEXT UNIQUE NOT NULL, -- Il chatId frontend
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_sessions_user ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_ticket ON chat_sessions(ticket_id);
CREATE INDEX idx_chat_sessions_session_id ON chat_sessions(session_id);

-- RLS Policy
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own chat sessions"
ON chat_sessions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
```

---

## 📁 NUOVI FILE DA CREARE

### 1. Pagina Storico Chat
**File:** `app/dashboard/conversations/page.tsx`

```typescript
import { createServerClient } from '@/lib/supabase-server';
import { ConversationsList } from '@/components/dashboard/conversations-list';
import { redirect } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';

export const dynamic = 'force-dynamic';

export default async function ConversationsPage() {
  const supabase = await createServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  // Fetch tickets with message counts
  const { data: tickets } = await supabase
    .from('tickets')
    .select(`
      *,
      messages:messages(count),
      last_message:messages(content, created_at, sender_role)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto max-w-6xl px-4 pt-24">
        <h1 className="text-3xl font-bold mb-6">Le Mie Conversazioni</h1>
        <ConversationsList tickets={tickets || []} />
      </main>
    </div>
  );
}
```

### 2. Componente Lista Conversazioni (Stile ChatGPT)
**File:** `components/dashboard/conversations-list.tsx`

```typescript
'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import { MessageSquare, Clock, Star, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { toast } from 'sonner';

interface ConversationsListProps {
  tickets: any[];
}

export function ConversationsList({ tickets }: ConversationsListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (ticketId: string) => {
    if (!confirm('Vuoi davvero eliminare questa conversazione?')) return;

    setDeletingId(ticketId);
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Conversazione eliminata');
        window.location.reload();
      } else {
        throw new Error('Errore');
      }
    } catch {
      toast.error('Impossibile eliminare la conversazione');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tickets.map((ticket) => {
        const messageCount = ticket.messages?.[0]?.count || 0;
        const lastMessage = ticket.last_message?.[0];
        const isResolved = ['resolved', 'closed'].includes(ticket.status);

        return (
          <Card key={ticket.id} className="p-4 hover:shadow-lg transition-shadow">
            <Link href={`/chat?ticket_id=${ticket.id}${isResolved ? '&readonly=true' : ''}`}>
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <Badge variant={isResolved ? 'secondary' : 'default'}>
                    {ticket.status}
                  </Badge>
                  {ticket.rating && (
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="text-sm font-semibold">{ticket.rating}</span>
                    </div>
                  )}
                </div>

                {/* Title */}
                <h3 className="font-semibold text-lg line-clamp-2">
                  {ticket.description || 'Conversazione senza titolo'}
                </h3>

                {/* Metadata */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MessageSquare className="w-4 h-4" />
                  <span>{messageCount} messaggi</span>
                  <Clock className="w-4 h-4 ml-2" />
                  <span>
                    {formatDistanceToNow(new Date(ticket.created_at), {
                      addSuffix: true,
                      locale: it,
                    })}
                  </span>
                </div>

                {/* Last Message Preview */}
                {lastMessage && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {lastMessage.content}
                  </p>
                )}
              </div>
            </Link>

            {/* Actions */}
            <div className="mt-4 pt-4 border-t flex items-center justify-between">
              <Button asChild variant="outline" size="sm">
                <Link href={`/chat?ticket_id=${ticket.id}`}>
                  Apri Chat
                </Link>
              </Button>

              {isResolved && !ticket.rating && (
                <Button asChild variant="default" size="sm">
                  <Link href={`/dashboard/review/${ticket.id}`}>
                    <Star className="w-4 h-4 mr-2" />
                    Recensisci
                  </Link>
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(ticket.id)}
                disabled={deletingId === ticket.id}
                className="text-red-500 hover:text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
```

### 3. Pagina Recensione Ticket
**File:** `app/dashboard/review/[id]/page.tsx`

```typescript
import { createServerClient } from '@/lib/supabase-server';
import { ReviewForm } from '@/components/dashboard/review-form';
import { redirect } from 'next/navigation';

export default async function ReviewPage({ params }: { params: { id: string } }) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: ticket } = await supabase
    .from('tickets')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();

  if (!ticket) redirect('/dashboard/tickets');
  if (ticket.rating) redirect(`/chat?ticket_id=${ticket.id}`); // Già recensito

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <ReviewForm ticket={ticket} />
      </div>
    </div>
  );
}
```

### 4. Componente Form Recensione
**File:** `components/dashboard/review-form.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface ReviewFormProps {
  ticket: any;
}

export function ReviewForm({ ticket }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Seleziona una valutazione');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, review }),
      });

      if (!res.ok) throw new Error();

      toast.success('Grazie per la tua recensione! 🌟');
      router.push('/dashboard/tickets');
    } catch {
      toast.error('Errore durante l\'invio della recensione');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Come è andato l'intervento?</CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          La tua opinione ci aiuta a migliorare il servizio
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Star Rating */}
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-12 h-12 ${
                      star <= (hoverRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-muted-foreground">
                {rating === 5 && 'Eccellente! ⭐'}
                {rating === 4 && 'Molto buono! 👍'}
                {rating === 3 && 'Buono'}
                {rating === 2 && 'Discreto'}
                {rating === 1 && 'Da migliorare'}
              </p>
            )}
          </div>

          {/* Review Text */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Vuoi aggiungere un commento? (opzionale)
            </label>
            <Textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Racconta la tua esperienza..."
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {review.length}/500 caratteri
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={isSubmitting || rating === 0}
              className="flex-1"
            >
              {isSubmitting ? 'Invio in corso...' : 'Invia Recensione'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Annulla
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
```

### 5. API Endpoint per Recensioni
**File:** `app/api/tickets/[id]/review/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { z } from 'zod';

const ReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  review: z.string().max(500).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const body = await request.json();
    const validation = ReviewSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dati non validi', details: validation.error },
        { status: 400 }
      );
    }

    const { rating, review } = validation.data;

    // Verifica che il ticket appartenga all'utente
    const { data: ticket } = await supabase
      .from('tickets')
      .select('id, user_id, status')
      .eq('id', params.id)
      .single();

    if (!ticket || ticket.user_id !== user.id) {
      return NextResponse.json({ error: 'Ticket non trovato' }, { status: 404 });
    }

    if (!['resolved', 'closed'].includes(ticket.status)) {
      return NextResponse.json(
        { error: 'Il ticket non è ancora concluso' },
        { status: 400 }
      );
    }

    // Salva la recensione
    const { error } = await supabase
      .from('tickets')
      .update({
        rating,
        review_text: review || null,
        review_created_at: new Date().toISOString(),
      })
      .eq('id', params.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving review:', error);
    return NextResponse.json(
      { error: 'Errore del server' },
      { status: 500 }
    );
  }
}
```

---

## 🔄 MODIFICHE AI FILE ESISTENTI

### 1. Modificare `app/chat/page.tsx`

Aggiungere gestione parametro `readonly`:

```typescript
// Dopo riga 49
const searchParams = useSearchParams();
const ticketId = searchParams.get('ticket_id');
const isReadonly = searchParams.get('readonly') === 'true'; // NUOVO

// Nella sezione input (riga 344-412), wrappare in:
{!isReadonly ? (
  // ... tutto il codice dell'input esistente ...
) : (
  <div className="p-4 bg-secondary/30 rounded-2xl text-center">
    <p className="text-sm text-muted-foreground">
      Questa conversazione è conclusa. Non puoi inviare nuovi messaggi.
    </p>
    {ticket?.status === 'resolved' && !ticket?.rating && (
      <Button asChild className="mt-3">
        <Link href={`/dashboard/review/${ticketId}`}>
          <Star className="w-4 h-4 mr-2" />
          Lascia una Recensione
        </Link>
      </Button>
    )}
  </div>
)}
```

### 2. Aggiungere link "Conversazioni" alla Dashboard

In `components/dashboard/dashboard-header.tsx` o nel menu:

```typescript
<Link href="/dashboard/conversations">
  <MessageSquare className="w-5 h-5 mr-2" />
  Le Mie Conversazioni
</Link>
```

---

## 🚀 ROADMAP IMPLEMENTAZIONE

### Fase 1 - FIX Immediati (1-2 ore)
1. ✅ Fix chatId persistence (FIX 1)
2. ✅ Migliorare tasto "Nuova Chat" (FIX 2)
3. ✅ Aggiungere gestione `readonly` in chat page

### Fase 2 - Database (30 min)
1. ✅ Creare migration per colonne `rating`, `review_text`, `review_created_at`
2. ✅ (Opzionale) Creare tabella `chat_sessions` se serve gestione avanzata

### Fase 3 - Storico Conversazioni (2-3 ore)
1. ✅ Creare pagina `/dashboard/conversations`
2. ✅ Implementare componente `ConversationsList`
3. ✅ Aggiungere link nel menu dashboard

### Fase 4 - Sistema Recensioni (2-3 ore)
1. ✅ Creare pagina recensione `/dashboard/review/[id]`
2. ✅ Implementare componente `ReviewForm`
3. ✅ Creare API endpoint `POST /api/tickets/[id]/review`
4. ✅ Aggiungere pulsante "Recensisci" per ticket conclusi

### Fase 5 - Notifiche (opzionale, 3-4 ore)
1. Implementare Supabase Realtime per aggiornamenti live
2. Aggiungere notifiche push (via Supabase o FCM)
3. Email notifications quando tecnico accetta/completa

---

## 📊 METRICHE DI SUCCESSO

- ✅ Utenti possono visualizzare tutte le conversazioni passate
- ✅ Chat concluse sono in modalità readonly
- ✅ Utenti possono lasciare recensioni 1-5 stelle
- ✅ Dashboard mostra statistiche (es: "3 chat attive, 12 completate")
- ✅ Tasso di recensioni > 50% dei ticket conclusi

---

## 🎨 UI/UX SUGGERIMENTI

1. **Sidebar conversazioni (come ChatGPT):**
   - Mostra ultime 10 chat
   - Raggruppa per data (Oggi, Ieri, Questa settimana, etc.)
   - Search bar per cercare vecchie chat

2. **Badge stato in tempo reale:**
   - "Tecnico in arrivo" (rosso pulsante)
   - "Lavoro completato" (verde con checkmark)

3. **Animazioni:**
   - Slide-in quando arriva nuovo messaggio
   - Confetti quando lasci 5 stelle

4. **Gamification:**
   - Badge "Cliente fedele" dopo 5 interventi
   - Sconto 10% dopo 3 recensioni a 5 stelle
