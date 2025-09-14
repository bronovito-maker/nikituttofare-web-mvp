// app/dashboard/page.tsx
'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Phone, MapPin, Clock, AlertTriangle, Euro } from 'lucide-react';
import { useSession } from 'next-auth/react';

type Lead = {
  id?: string;
  createdAt?: string;
  ticketId?: string;
  category?: string;
  urgency?: string;
  message?: string;
  address?: string;
  price?: number; // Aggiunto per fallback
  price_low?: number;
  price_high?: number;
  est_minutes?: number;
  city?: string;
};

// Funzione helper per la data, ancora più robusta
const parseDate = (dateString?: string): Date | null => {
  if (!dateString) return null;
  // Sostituisce lo spazio con 'T' per renderlo un formato ISO 8601 valido
  const correctedDateString = dateString.replace(' ', 'T');
  const date = new Date(correctedDateString);
  return isNaN(date.getTime()) ? null : date;
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const [items, setItems] = useState<Lead[]>([]);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async (userId: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/requests?userId=${encodeURIComponent(userId)}`, { cache: 'no-store' });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j?.error || 'Errore nel caricamento delle richieste');
      
      let rows: Lead[] = Array.isArray(j.data) ? j.data : (j.data?.list || []);

      // ⚠️ PASSO FONDAMENTALE PER IL DEBUG ⚠️
      console.log('--- INIZIO DEBUG DATI RAW DAL DATABASE ---');
      rows.forEach(row => {
        // Logghiamo il createdAt di ogni singola riga per trovare quello problematico
        console.log(`ID Richiesta: ${row.id}, Valore di CreatedAt:`, row.createdAt);
      });
      console.log('--- FINE DEBUG DATI RAW ---');

      rows.sort((a, b) => {
        const dateB = parseDate(b.createdAt)?.getTime() || 0;
        const dateA = parseDate(a.createdAt)?.getTime() || 0;
        return dateB - dateA;
      });

      setItems(rows);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // @ts-ignore - Questo va sistemato con la tipizzazione corretta di NextAuth
    const userId = session?.userId; 
    if (userId) {
      fetchRequests(userId);
    } else if (session === null) {
      setLoading(false);
      setError("Per favore, effettua il login per vedere le tue richieste.");
    }
  }, [session, fetchRequests]);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Caricamento...</div>;
  if (error) return <div className="p-8 text-center bg-destructive/10 text-destructive rounded-md">{error}</div>;

  return (
    <main className="flex-grow container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-6">Le mie richieste</h1>
        {items.length === 0 ? (
          <div className="text-center bg-card rounded-lg p-8 border">
            <h2 className="text-xl font-medium text-card-foreground">Nessuna richiesta trovata</h2>
            <p className="mt-2 text-sm text-muted-foreground">Le richieste inviate tramite chat appariranno qui.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {items.map((r) => <RequestCard key={r.id || r.ticketId} request={r} />)}
          </div>
        )}
      </div>
    </main>
  );
}

function RequestCard({ request: r }: { request: Lead }) {
  const dateObject = parseDate(r.createdAt);
  const requestDate = dateObject 
    ? dateObject.toLocaleString('it-IT', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : "Data non disponibile";
  
  // Logica del prezzo migliorata per includere un fallback al campo 'price'
  const price = (typeof r.price_low === 'number' && typeof r.price_high === 'number')
    ? `~${r.price_low}–${r.price_high}€`
    : (typeof r.price === 'number' ? `~${r.price}€` : '—');
  
  return (
    <div className="bg-card text-card-foreground rounded-lg p-4 sm:p-5 border">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="chip uppercase">{r.category || 'TUTTOFARE'}</span>
          <span className="chip capitalize">{r.urgency || 'Media'}</span>
        </div>
        <div className="text-xs text-muted-foreground flex-shrink-0 font-mono">{requestDate}</div>
      </div>
      {r.message && <p className="mt-3 text-foreground whitespace-pre-wrap">{r.message}</p>}
      <div className="mt-4 border-t border-border pt-3 space-y-2 text-sm">
        <div className="flex items-center gap-3 text-muted-foreground"><MapPin size={16} /><span>{r.address || r.city || 'Indirizzo non specificato'}</span></div>
        <div className="flex items-center gap-3 text-muted-foreground"><Euro size={16} /><span className="font-semibold text-foreground">{price}</span><span className="mx-2">·</span><Clock size={16} /><span>{r.est_minutes ? `${r.est_minutes} min` : 'N/D'}</span></div>
      </div>
    </div>
  );
}