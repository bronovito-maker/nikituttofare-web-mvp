// app/dashboard/page.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Euro, MapPin, Clock, MessageSquare } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

type Lead = {
  id?: string;
  CreatedAt?: string; // NocoDB usa PascalCase per le colonne di sistema
  ticketId?: string;
  category?: string;
  urgency?: string;
  message?: string;
  address?: string;
  price?: number;
  price_low?: number;
  price_high?: number;
  est_minutes?: number;
  city?: string;
};

const parseDate = (dateString?: string): Date | null => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
};

// --- Componenti di Caricamento e Stati Vuoti ---
const SkeletonCard = () => (
    <div className="bg-card text-card-foreground rounded-lg p-4 sm:p-5 border animate-pulse">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div className="flex items-center gap-2 flex-wrap">
                <div className="h-6 w-24 bg-muted rounded-full"></div>
                <div className="h-6 w-20 bg-muted rounded-full"></div>
            </div>
            <div className="h-4 w-32 bg-muted rounded-md mt-2 sm:mt-0"></div>
        </div>
        <div className="mt-4 h-5 w-3/4 bg-muted rounded-md"></div>
        <div className="mt-4 border-t border-border pt-3 space-y-2">
            <div className="h-5 w-1/2 bg-muted rounded-md"></div>
            <div className="h-5 w-2/5 bg-muted rounded-md"></div>
        </div>
    </div>
);

const EmptyState = () => (
    <div className="text-center bg-card rounded-lg p-8 border">
        <h2 className="text-xl font-medium text-card-foreground">Nessuna richiesta trovata</h2>
        <p className="mt-2 text-sm text-muted-foreground">Le richieste che invierai tramite la chat appariranno qui.</p>
        <Link href="/chat" className="mt-6 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-10 px-4 bg-primary text-primary-foreground hover:bg-primary/90">
            <MessageSquare className="h-4 w-4 mr-2"/>
            Inizia una nuova richiesta
        </Link>
    </div>
);

// --- Card Richiesta ---
function RequestCard({ request: r }: { request: Lead }) {
  const dateObject = parseDate(r.CreatedAt); // Usa `CreatedAt`
  const requestDate = dateObject 
    ? dateObject.toLocaleString('it-IT', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : "Data non disponibile";
  
  const price = (typeof r.price_low === 'number' && typeof r.price_high === 'number')
    ? `~${r.price_low}–${r.price_high}€`
    : (typeof r.price === 'number' ? `~${r.price}€` : 'Stima non disponibile');
  
  return (
    <div className="bg-card text-card-foreground rounded-lg p-4 sm:p-5 border transition-shadow hover:shadow-md">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-block px-3 py-1 text-xs font-semibold uppercase rounded-full bg-secondary text-secondary-foreground">{r.category || 'TUTTOFARE'}</span>
          <span className="inline-block px-3 py-1 text-xs font-semibold capitalize rounded-full bg-muted text-muted-foreground">{r.urgency || 'Media'}</span>
        </div>
        <div className="text-xs text-muted-foreground flex-shrink-0 font-mono">{requestDate}</div>
      </div>
      {r.message && <p className="mt-3 text-foreground whitespace-pre-wrap">{r.message.split('\n')[0]}</p>}
      <div className="mt-4 border-t border-border pt-3 space-y-2 text-sm">
        <div className="flex items-center gap-3 text-muted-foreground"><MapPin size={16} /><span>{r.address || r.city || 'Indirizzo non specificato'}</span></div>
        <div className="flex items-center gap-3 text-muted-foreground">
            <Euro size={16} /><span className="font-semibold text-foreground">{price}</span>
            <span className="text-muted-foreground/50">·</span>
            <Clock size={16} /><span>{r.est_minutes ? `${r.est_minutes} min` : 'N/D'}</span>
        </div>
      </div>
    </div>
  );
}


export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [items, setItems] = useState<Lead[]>([]);
  const [error, setError] = useState<string>('');
  
  // Lo stato di caricamento è ora gestito da `status` di NextAuth e dalla presenza di `items`
  const isLoading = status === 'loading' || (status === 'authenticated' && items.length === 0 && !error);

  const fetchRequests = useCallback(async (userId: string) => {
    setError('');
    try {
      const res = await fetch(`/api/requests?userId=${encodeURIComponent(userId)}`, { cache: 'no-store' });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j?.error || 'Errore nel caricamento delle richieste');
      
      let rows: Lead[] = Array.isArray(j.data) ? j.data : [];

      // Ordina per data, NocoDB dovrebbe già farlo, ma è una sicurezza in più
      rows.sort((a, b) => {
        const dateB = parseDate(b.CreatedAt)?.getTime() || 0;
        const dateA = parseDate(a.CreatedAt)?.getTime() || 0;
        return dateB - dateA;
      });

      setItems(rows);
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    // @ts-ignore
    const userId = session?.userId;
    if (status === 'authenticated' && userId) {
      fetchRequests(userId);
    }
  }, [status, session, fetchRequests]);

  if (status === 'unauthenticated') {
    return <div className="p-8 text-center bg-destructive/10 text-destructive rounded-md">Per favore, <Link href="/login" className="font-bold underline">effettua il login</Link> per vedere le tue richieste.</div>;
  }
  
  if (error) return <div className="p-8 text-center bg-destructive/10 text-destructive rounded-md">{error}</div>;

  return (
    <main className="flex-grow container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-6">Le mie richieste</h1>
        {isLoading ? (
          <div className="grid gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : items.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-4">
            {items.map((r) => <RequestCard key={r.id || r.ticketId} request={r} />)}
          </div>
        )}
      </div>
    </main>
  );
}