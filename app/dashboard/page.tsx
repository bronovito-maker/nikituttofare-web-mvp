'use client';
import { useEffect, useState } from 'react';

type Lead = {
  id?: string;
  createdAt?: string;
  ticketId?: string;
  status?: string;
  message?: string;
  address?: string;
  address_compact?: string;
  city?: string;
  category?: string;
  urgency?: string;
  price?: number;
  price_low?: number;
  price_high?: number;
  est_minutes?: number;
};

const TECH_PHONE = process.env.NEXT_PUBLIC_TECH_PHONE || ''; // es. +39 351 234 5678

export default function Dashboard() {
  const [items, setItems]   = useState<Lead[]>([]);
  const [error, setError]   = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const s = await fetch('/api/auth/session', { cache: 'no-store' });
        const sj = await s.json();
        const userId = sj?.userId || sj?.user?.id || sj?.user?.email || '';
        const res = await fetch(`/api/requests${userId ? `?userId=${encodeURIComponent(userId)}` : ''}`, { cache: 'no-store' });
        const j = await res.json();
        if (!res.ok || !j.ok) throw new Error(j?.error || res.statusText);
        const rows: Lead[] = Array.isArray(j.data) ? j.data : (j.data?.list || []);
        setItems(rows || []);
      } catch (e: any) {
        setError(e?.message || 'Errore');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const telHref = (p: string) => `tel:${p.replace(/\s+/g, '')}`;

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl sm:text-3xl font-semibold mb-4 sm:mb-6">Le mie richieste</h1>

      {loading && <div className="text-premium-sub">Caricamento…</div>}

      {!loading && error && (
        <div className="card">
          <div className="text-rose-400 font-medium mb-1">Impossibile caricare</div>
          <div className="text-sm text-rose-300/90">{error}</div>
          <div className="text-xs text-premium-sub mt-2">
            Verifica di essere loggato e che le variabili NocoDB siano corrette.
          </div>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="card">
          <div className="text-premium-ink">Non ci sono richieste salvate.</div>
          <div className="text-sm text-premium-sub mt-1">
            Crea una richiesta dalla <a className="underline" href="/chat">chat</a>.
          </div>
        </div>
      )}

      <div className="grid gap-3">
        {items.map((r) => {
          const when = r.createdAt ? new Date(r.createdAt).toLocaleString('it-IT') : '—';
          const addr = r.address_compact || r.address || (r.city ? r.city : '—');
          const price =
            typeof r.price_low === 'number' && typeof r.price_high === 'number'
              ? `~€${r.price_low}–${r.price_high}`
              : typeof r.price === 'number'
              ? `~€${r.price}`
              : '—';

          return (
            <div key={r.id || r.ticketId || when + (r.message || '')} className="card">
              {/* header riga */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="badge">{r.category || 'tuttofare'}</span>
                  <span className="badge">{r.urgency || 'media'}</span>
                  {r.ticketId && <span className="badge">{r.ticketId}</span>}
                </div>
                <div className="text-xs text-premium-sub">{when}</div>
              </div>

              {/* testo */}
              {r.message && <div className="mt-2 text-[15px]">{r.message}</div>}

              <div className="mt-2 text-sm text-premium-sub">
                📍 {addr}{r.city && !addr.includes(r.city) ? `, ${r.city}` : ''}
              </div>

              <div className="mt-1 text-sm text-premium-sub">
                💶 {price} <span className="opacity-60">·</span> ⏱️ {r.est_minutes ? `${r.est_minutes} min` : '—'}
              </div>

              {/* azioni */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {TECH_PHONE && (
                  <a
                    href={telHref(TECH_PHONE)}
                    className="btn-primary"
                    aria-label={`Chiama tecnico al numero ${TECH_PHONE}`}
                  >
                    📞 Chiama tecnico
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}