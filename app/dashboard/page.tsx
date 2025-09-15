// app/dashboard/page.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Euro, MapPin, Clock, MessageSquare, CheckCircle, AlertCircle, Loader, XCircle, Hash } from 'lucide-react'; // MODIFICA: Aggiunto Hash
import { useSession } from 'next-auth/react';
import Link from 'next/link';

// Tipo Lead
type Lead = {
  id?: string;
  CreatedAt?: string;
  ticketId?: string;
  category?: string;
  urgency?: string;
  message?: string;
  address?: string;
  price_low?: number;
  price_high?: number;
  est_minutes?: number;
  city?: string;
  Stato?: 'Inviata' | 'In carico' | 'Completata' | 'Annullata';
};

function parseDate(dateString?: string): string {
  if (!dateString) return 'Data non disponibile';
  try {
    return new Date(dateString).toLocaleString('it-IT', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  } catch {
    return 'Data non valida';
  }
}

function SkeletonCard() {
  return (
    <div className="bg-card rounded-lg p-5 border animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-5 bg-muted rounded w-1/4"></div>
        <div className="h-4 bg-muted rounded w-1/3"></div>
      </div>
      <div className="mt-4 h-4 bg-muted rounded w-3/4"></div>
      <div className="mt-6 space-y-3">
        <div className="flex items-center">
          <div className="h-5 w-5 bg-muted rounded-full mr-2"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
        <div className="flex items-center">
          <div className="h-5 w-5 bg-muted rounded-full mr-2"></div>
          <div className="h-4 bg-muted rounded w-1/3"></div>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16 px-6 bg-card border rounded-lg">
      <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-semibold text-foreground">Nessuna richiesta trovata</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Non hai ancora inviato nessuna richiesta. Inizia una nuova conversazione per vedere i tuoi lavori qui.
      </p>
      <div className="mt-6">
        <Link
          href="/chat"
          className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md shadow-sm hover:bg-primary/90"
        >
          Inizia una nuova richiesta
        </Link>
      </div>
    </div>
  );
}

const StatusBadge = ({ status }: { status: Lead['Stato'] }) => {
    const statusMap = {
        'Inviata': { text: 'Inviata', icon: <Loader size={12} className="mr-1 animate-spin" />, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
        'In carico': { text: 'In carico', icon: <AlertCircle size={12} className="mr-1" />, color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
        'Completata': { text: 'Completata', icon: <CheckCircle size={12} className="mr-1" />, color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
        'Annullata': { text: 'Annullata', icon: <XCircle size={12} className="mr-1" />, color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
    };
    const currentStatus = status && statusMap[status] ? statusMap[status] : statusMap['Inviata'];

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full ${currentStatus.color}`}>
            {currentStatus.icon}
            {currentStatus.text}
        </span>
    );
};

function RequestCard({ request: r }: { request: Lead }) {
  const date = parseDate(r.CreatedAt);
  const price = r.price_low && r.price_high ? `~${r.price_low}–${r.price_high}€` : 'Da definire';
  
  return (
    <div className="bg-card text-card-foreground rounded-lg p-4 sm:p-5 border transition-shadow hover:shadow-md">
      <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={r.Stato} />
          <span className="inline-block px-3 py-1 text-xs font-semibold uppercase rounded-full bg-secondary text-secondary-foreground">{r.category || 'TUTTOFARE'}</span>
        </div>
        
        {/* --- MODIFICA CHIAVE: Aggiunto ID Ticket qui --- */}
        <div className="text-xs text-muted-foreground flex-shrink-0 font-mono mt-2 sm:mt-0 text-left sm:text-right">
            <div>{date}</div>
            {r.ticketId && (
                <div className="flex items-center gap-1 justify-start sm:justify-end mt-1">
                    <Hash size={12} />
                    <span>ID: {r.ticketId}</span>
                </div>
            )}
        </div>
      </div>

      {r.message && <p className="mt-3 text-foreground whitespace-pre-wrap">{r.message.split('\n')[0]}</p>}
      
      <div className="mt-4 pt-4 border-t border-border/60 text-sm text-muted-foreground space-y-2">
        {r.address && <div className="flex items-center gap-2"><MapPin size={14} /><span>{r.address}, {r.city}</span></div>}
        <div className="flex items-center gap-2"><Euro size={14} /><span>Stima: <strong>{price}</strong></span></div>
        {r.est_minutes && <div className="flex items-center gap-2"><Clock size={14} /><span>Durata: ~{r.est_minutes} min</span></div>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: session, status } = useSession({ required: true });
  const [items, setItems] = useState<Lead[]>([]);
  const [error, setError] = useState<string>('');
  
  const isLoading = status === 'loading';

  const fetchRequests = useCallback(async (userId: string) => {
    try {
      const res = await fetch(`/api/requests?userId=${encodeURIComponent(userId)}`);
      if (!res.ok) throw new Error('Errore nel caricamento delle richieste');
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Errore API sconosciuto');
      setItems(json.data);
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.email) {
      fetchRequests(session.user.email);
    }
  }, [status, session, fetchRequests]);

  if (error) {
    return <main className="flex-grow container mx-auto px-4 py-8"><p className='text-destructive'>Errore: {error}</p></main>;
  }

  const activeItems = items.filter(item => !item.Stato || item.Stato === 'Inviata' || item.Stato === 'In carico');
  const archivedItems = items.filter(item => item.Stato === 'Completata' || item.Stato === 'Annullata');

  return (
    <main className="flex-grow container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-6">Le mie richieste</h1>
        
        {isLoading ? (
          <div className="grid gap-4"> <SkeletonCard /> <SkeletonCard /> </div>
        ) : items.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-10">
            {activeItems.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">In corso</h2>
                <div className="grid gap-4">
                  {activeItems.map((r) => <RequestCard key={r.id || r.ticketId} request={r} />)}
                </div>
              </section>
            )}

            {archivedItems.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">Archiviate</h2>
                <div className="grid gap-4">
                  {archivedItems.map((r) => <RequestCard key={r.id || r.ticketId} request={r} />)}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}