// app/dashboard/page.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Euro, MapPin, MessageSquare, CheckCircle, AlertCircle, Loader, XCircle, Hash, Wrench, Droplets, Lightbulb, Frown, Phone } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Lead } from '@/lib/types';

function parseDate(dateString?: string): string {
  if (!dateString) return 'Data non disponibile';
  try {
    return new Date(dateString).toLocaleString('it-IT', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  } catch { return 'Data non valida'; }
}

function SkeletonCard() {
  return <div className="bg-card rounded-lg p-5 border animate-pulse h-[220px]"></div>;
}

function EmptyState() {
  return (
    <div className="text-center py-16 px-6 bg-card border rounded-lg">
      <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-semibold text-foreground">Nessuna richiesta trovata</h3>
      <p className="mt-2 text-sm text-muted-foreground">Inizia una nuova conversazione per vedere i tuoi lavori qui.</p>
      <div className="mt-6">
        <Button asChild>
          <Link href="/chat">Inizia una nuova richiesta</Link>
        </Button>
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

const categoryIcons: { [key: string]: React.ReactNode } = {
  'serramenti': <Wrench size={16} className="mr-2 text-primary" />,
  'idraulico': <Droplets size={16} className="mr-2 text-primary" />,
  'elettricista': <Lightbulb size={16} className="mr-2 text-primary" />,
  'default': <Frown size={16} className="mr-2 text-muted-foreground" />,
};

function RequestCard({ request: r }: { request: Lead }) {
  const date = parseDate(r.CreatedAt);
  const price = r.price_low && r.price_high ? `~${r.price_low}–${r.price_high}€` : (r.price_low ? `~${r.price_low}€` : 'In valutazione');
  const categoryKey = r.category?.toLowerCase() || 'default';
  const icon = categoryIcons[categoryKey] || categoryIcons['default'];
  const detailUrl = `/dashboard/${r.ticketId || r.id}`;

  return (
    <div className="bg-card text-card-foreground rounded-lg p-4 sm:p-5 border flex flex-col justify-between transition-all duration-200 hover:shadow-lg hover:border-primary/50">
      <Link href={detailUrl} className="block w-full group">
        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={r.Stato} />
            <span className="inline-block px-3 py-1 text-xs font-semibold uppercase rounded-full bg-secondary text-secondary-foreground">{r.category || 'TUTTOFARE'}</span>
          </div>
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
        
        <div className="mt-3 flex items-start">
          {icon}
          <p className="font-semibold text-foreground line-clamp-2 group-hover:text-primary">{r.message || "Dettagli non disponibili"}</p>
        </div>

        <div className="mt-4 pt-4 border-t border-border/60 text-sm text-muted-foreground space-y-2">
          {r.address && <div className="flex items-center gap-2"><MapPin size={14} /><span>{r.address}, {r.city}</span></div>}
          <div className="flex items-center gap-2"><Euro size={14} /><span>Stima: <strong>{price}</strong></span></div>
        </div>
      </Link>
      
      {r.Stato === 'In carico' && r.technicianPhone && (
        <div className="mt-4 pt-4 border-t border-dashed">
          <Button asChild className="w-full">
            <a href={`tel:${r.technicianPhone}`}>
              <Phone size={16} className="mr-2" />
              Chiama il tecnico
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { data: session, status } = useSession({ required: true });
  const [items, setItems] = useState<Lead[]>([]);
  const [error, setError] = useState<string>('');
  
  const isLoading = status === 'loading' && items.length === 0;

  const fetchRequests = useCallback(async (userId: string) => {
    try {
      const res = await fetch(`/api/requests?userId=${encodeURIComponent(userId)}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Errore nel caricamento delle richieste' }));
        throw new Error(errorData.error);
      }
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Errore API sconosciuto');
      setItems(json.data);
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated' && session?.userId) {
      const userId = session.userId;
      fetchRequests(userId);
      const intervalId = setInterval(() => fetchRequests(userId), 30000);
      return () => clearInterval(intervalId);
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