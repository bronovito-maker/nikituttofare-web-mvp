'use client';

import React, { useEffect, useRef, useState, ReactNode } from 'react';
import Link from 'next/link';
import ChatBubble from '@/components/ChatBubble';
import { copy, getTone, useEmoji } from '@/lib/tone';

/* ───────── Types ───────── */
type Step =
  | 'problem' | 'post-quote' | 'name' | 'phone' | 'email'
  | 'city' | 'address' | 'timeslot' | 'confirm' | 'sending' | 'done';

type AiResult = {
  category?: string;
  urgency?: 'bassa' | 'media' | 'alta' | 'critica' | string;
  feasible?: boolean;
  summary?: string;
  price?: number;
  price_low?: number;
  price_high?: number;
  est_minutes?: number;
  source?: 'n8n' | 'local' | 'none';
};

type PhotonFeature = {
  properties?: {
    name?: string; city?: string; postcode?: string; country?: string;
    street?: string; housenumber?: string;
  };
  geometry?: { coordinates?: [number, number] };
};

/* ───────── Geo ───────── */
const LIVORNO = { lat: 43.551, lng: 10.308 };
const BBOX = { minLon: 9.877, minLat: 43.235, maxLon: 10.743, maxLat: 43.865 };
const COVER_RADIUS_M = 35000;
function distanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLon = (b.lng - a.lng) * Math.PI / 180;
  const sLat1 = a.lat * Math.PI / 180;
  const sLat2 = b.lat * Math.PI / 180;
  const A = Math.sin(dLat / 2) ** 2 + Math.cos(sLat1) * Math.cos(sLat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(A));
}

/* ───────── Helpers ───────── */
const PROFANITY = ['cazzo', 'merda', 'stronzo', 'vaffanc', 'minchia', 'porca', 'fuck', 'shit', 'porco dio' , 'porcamadonna', 'porca madonna' , ' porcodio ' , 'puttana' ];

/** Sceglie un prezzo “operativo” da inviare anche se manca `price` ma ci sono low/high */
function pickOpsPrice(ai?: AiResult | null): number | null {
  if (!ai) return null;
  const cand = [ai.price, ai.price_high, ai.price_low].find(
    (v) => typeof v === 'number' && !Number.isNaN(v)
  );
  return typeof cand === 'number' ? Math.round(cand) : null;
}

/* Quick replies */
function QuickReplies({ items, onPick }: { items: string[]; onPick: (s: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {items.map((t) => (
        <button key={t} type="button" onClick={() => onPick(t)} className="chip cursor-pointer">
          {t}
        </button>
      ))}
    </div>
  );
}

/* Progress bar 3 segmenti */
function Progress3({ stage }: { stage: 0 | 1 | 2 }) {
  return (
    <div>
      <div className="progress3">
        <div className={`progress3-seg ${stage >= 0 ? 'is-active' : ''}`} />
        <div className={`progress3-seg ${stage >= 1 ? 'is-active' : ''}`} />
        <div className={`progress3-seg ${stage >= 2 ? 'is-active' : ''}`} />
      </div>
      <div className="progress3-labels">
        <span>Descrizione</span><span>Stima</span><span>Dati &amp; invio</span>
      </div>
    </div>
  );
}

/* CTA auth in bubble */
function AuthCTA() {
  return (
    <div className="flex gap-2 mt-2">
      <Link href="/register" className="btn-outline">Registrati</Link>
      <Link href="/login" className="btn-primary">Accedi</Link>
    </div>
  );
}

/* Intro bubble (concisa) */
function Intro({ badges, coverage }: { badges: string[]; coverage: string[] }) {
  return (
    <div className="space-y-2">
      <div className="leading-relaxed">
        <div className="font-medium">Ciao, sono NikiTuttoFare. Dimmi cosa non funziona o per cosa ti serve una mano.</div>
        <div className="text-premium-sub">Ti preparo un preventivo senza impegno.</div>
      </div>
      <div className="flex flex-wrap gap-2">
        {badges.map((b, i) => (<span key={i} className="badge">{b}</span>))}
      </div>
      <div className="text-xs text-premium-sub">Copertura: {coverage.join(' · ')}</div>
    </div>
  );
}

/* Stima */
function EstimateBlock({ ai }: { ai: AiResult }) {
  const price =
    typeof ai.price_low === 'number' && typeof ai.price_high === 'number'
      ? `~${ai.price_low}–${ai.price_high}€`
      : typeof ai.price === 'number'
        ? `~${ai.price}€`
        : '—';
  return (
    <div className="space-y-1">
      <div className="font-medium">Stima iniziale</div>
      <div className="text-sm leading-6">
        {ai.category && <div>🏷️ Servizio: {ai.category}</div>}
        {ai.urgency && <div>⚡ Urgenza: {ai.urgency}</div>}
        <div>💶 Stima: {price}</div>
        {typeof ai.est_minutes === 'number' && <div>⏱️ Tempo: {ai.est_minutes} min</div>}
        {ai.summary && <div className="mt-1 text-premium-sub">{ai.summary}</div>}
      </div>
      <div className="text-xs text-premium-sub">
        Il totale viene confermato prima dell’intervento. Include uscita + 60 min.
      </div>
    </div>
  );
}

/* Riepilogo */
function RecapBlock({
  name, phone, email, address, city, message, ai
}: {
  name: string; phone: string; email: string; address: string; city: string; message: string; ai: AiResult | null;
}) {
  const price =
    ai && typeof (ai as any)?.price_low === 'number' && typeof (ai as any)?.price_high === 'number'
      ? `~${(ai as any).price_low}–${(ai as any).price_high}€`
      : ai && typeof ai.price === 'number'
        ? `~${ai.price}€`
        : '—';
  return (
    <div className="space-y-1">
      <div className="font-medium">Riepilogo</div>
      <div className="text-sm leading-6">
        <div>👤 {name || '—'}</div>
        <div>📞 {phone || '—'}</div>
        <div>✉️ {email || '—'}</div>
        <div>📍 {address || '—'}{city ? `, ${city}` : ''}</div>
        <div>📝 {message || '—'}</div>
        {ai?.category && <div>🏷️ Servizio: {ai.category}</div>}
        {ai?.urgency && <div>⚡ Urgenza: {ai.urgency}</div>}
        <div>💶 Stima: {price}</div>
        {typeof ai?.est_minutes === 'number' && <div>⏱️ Tempo: {ai.est_minutes} min</div>}
      </div>
      <div className="text-sm mt-1">Confermi l’invio per trovare il tuo tecnico? (sì/no)</div>
    </div>
  );
}

type Msg = { role: 'user' | 'assistant'; content: ReactNode };

/* Normalizza “pittura” → imbianchino */
const PAINT_RE = /(tinteggi|tintegg|imbianc|vernici|cartongesso|rasatura|stucc|muro|parete|pareti|soffitto)/i;
function normalizeCategory(userText: string, aiCat?: string) {
  if (PAINT_RE.test(userText)) return 'imbianchino';
  return (aiCat && aiCat !== 'none') ? aiCat : 'tuttofare';
}

/* ───────── Component ───────── */
export default function ChatPage() {
  const tone = getTone();
  const txt = copy(tone);
  useEmoji();

  const [msgs, setMsgs] = useState<Msg[]>([
    { role: 'assistant', content: <Intro badges={txt.trustBadges} coverage={txt.coverageChips} /> },
  ]);

  const [step, setStep] = useState<Step>('problem');
  const [stage, setStage] = useState<0 | 1 | 2>(0);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [ai, setAi] = useState<AiResult | null>(null);

  const [form, setForm] = useState<any>({
    name: '', phone: '', email: '', city: '', address: '', timeslot: '', message: '',
    geo: undefined as undefined | { lat: number; lng: number }
  });

  /* Autoscroll con rispetto reduced-motion */
  const endRef = useRef<HTMLDivElement>(null);
  const reduceMotionRef = useRef(false);
  useEffect(() => {
    reduceMotionRef.current = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  }, []);
  const scrollToBottom = () =>
    endRef.current?.scrollIntoView({
      behavior: reduceMotionRef.current ? 'auto' : 'smooth',
      block: 'end' as ScrollLogicalPosition
    });
  useEffect(() => { scrollToBottom(); }, [msgs, step]);

  /* LocalStorage: salva solo form/step/stage */
  useEffect(() => {
    try {
      const s = localStorage.getItem('ntf-chat'); if (!s) return;
      const saved = JSON.parse(s);
      if (saved.form) setForm(saved.form);
      if (saved.step) setStep(saved.step);
      if (saved.stage !== undefined) setStage(saved.stage);
    } catch { /* noop */ }
  }, []);
  useEffect(() => {
    try { localStorage.setItem('ntf-chat', JSON.stringify({ form, step, stage })); } catch { /* noop */ }
  }, [form, step, stage]);

  const addUser = (content: ReactNode) =>
    setMsgs((m) => [...m, { role: 'user', content }]);
  const addBot = (content: ReactNode) =>
    setMsgs((m) => [...m, { role: 'assistant', content }]);

  /* Autocomplete indirizzo (solo step address) */
  const [addrOpts, setAddrOpts] = useState<Array<{ label: string; value: { address: string; city: string; lat: number; lng: number } }>>([]);
  const addrTimer = useRef<any>(0);
  useEffect(() => {
    if (step !== 'address') return;
    if (addrTimer.current) clearTimeout(addrTimer.current);
    addrTimer.current = setTimeout(async () => {
      const q = input.trim();
      if (!q) { setAddrOpts([]); return; }
      try {
        const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&lang=it&limit=5&bbox=${BBOX.minLon},${BBOX.minLat},${BBOX.maxLon},${BBOX.maxLat}`;
        const r = await fetch(url);
        const j = await r.json();
        const opts = ((j.features as PhotonFeature[]) || []).map((f) => {
          const p = f.properties || {};
          const label = [p.name, p.street, p.housenumber, p.postcode, p.city].filter(Boolean).join(' ');
          const coords = f.geometry?.coordinates || [0, 0];
          return {
            label: label || p.name || '',
            value: { address: label || '', city: p.city || '', lat: coords[1], lng: coords[0] }
          };
        }).filter(o => o.label);
        setAddrOpts(opts);
      } catch { setAddrOpts([]); }
    }, 250);
  }, [input, step]);

  /* Geolocazione */
  async function useMyLocation() {
    if (!navigator.geolocation) { addBot('Il browser non supporta la geolocalizzazione.'); return; }
    navigator.geolocation.getCurrentPosition((pos) => {
      const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setForm((f: any) => ({ ...f, geo: c }));
      const d = distanceMeters(LIVORNO, c);
      if (d > COVER_RADIUS_M) addBot('Posizione fuori copertura standard: possiamo intervenire con extra spostamento (+€30) o indicami un altro indirizzo.');
      else addBot('Posizione in copertura ✅ (puoi comunque indicare l’indirizzo esatto).');
    }, () => addBot('Non sono riuscito a leggere la posizione. Puoi inserire l’indirizzo manualmente.'));
  }

  const isProfane = (t: string) => PROFANITY.some((w) => (t || '').toLowerCase().includes(w));
  const phoneOk = (v: string) => v.replace(/[^\d+]/g, '').length >= 8;

  /* Flow */
  async function handleSend() {
    if (!input.trim() || loading) return;
    const text = input.trim();
    addUser(text);
    setInput('');

    if (isProfane(text) && step === 'problem') {
      addBot('Capisco, vediamo di risolvere subito 😊 È in cucina o in bagno?');
      return;
    }

    switch (step) {
      case 'problem': {
        setLoading(true);
        addBot('Un attimo…');
        try {
          const res = await fetch('/api/assist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text })
          });
          const j = await res.json(); if (!j.ok) throw new Error(j.error || 'Errore');

          const raw: AiResult = j.data || {};
          const normalized: AiResult = { ...raw, category: normalizeCategory(text, raw.category) };
          setAi(normalized);
          setForm((f: any) => ({
            ...f,
            message: text,
            category: normalized.category,
            urgency: normalized.urgency,
            price: normalized.price,
            price_low: (normalized as any).price_low,
            price_high: (normalized as any).price_high,
            est_minutes: normalized.est_minutes
          }));

          if (
            normalized.category === 'none' ||
            (!normalized.price && !normalized.price_low && !normalized.price_high)
          ) {
            // Messaggio guida conciso
            addBot('Ok! Dimmi in una frase cosa succede e dove. Es.: "perdita sotto il lavandino in cucina", "scintille da una presa in salotto", "porta bloccata, Livorno".');
            setStage(0);
            return;
          }

          setStage(1);
          addBot(<EstimateBlock ai={normalized} />);
          addBot('Se ti va bene, procediamo: scrivi "sì" oppure aggiungi dettagli.');
          setStep('post-quote');
        } catch {
          addBot('Ops, qualcosa non ha funzionato. Riprova.');
        } finally { setLoading(false); }
        break;
      }

      case 'post-quote': {
        if (/^(s|si|sì|ok|va bene)/i.test(text)) {
          setStage(2); addBot('Come ti chiami?'); setStep('name');
        } else {
          setForm((f: any) => ({ ...f, message: `${f.message || ''}\nDettagli: ${text}` }));
          addBot('Perfetto, vuoi procedere? (scrivi "sì")');
        }
        break;
      }

      case 'name':
        setForm((f: any) => ({ ...f, name: text })); addBot('Numero di telefono?'); setStep('phone'); break;

      case 'phone':
        if (!phoneOk(text)) { addBot('Un numero valido? (Es: +39 333 1234567)'); return; }
        setForm((f: any) => ({ ...f, phone: text })); addBot('Email (opzionale). Scrivi "no" per saltare.'); setStep('email'); break;

      case 'email':
        setForm((f: any) => ({ ...f, email: text.toLowerCase() === 'no' ? '' : text })); addBot('Città?'); setStep('city'); break;

      case 'city':
        setForm((f: any) => ({ ...f, city: text })); addBot('Indirizzo completo?'); setStep('address'); break;

      case 'address': {
        const c = form.geo;
        setForm((f: any) => ({ ...f, address: text }));
        addBot('Hai una fascia oraria preferita? (scrivi "no" se non ti interessa)');
        setStep('timeslot');
        if (c) {
          const d = distanceMeters(LIVORNO, c);
          if (d > COVER_RADIUS_M) addBot('Nota: fuori copertura standard (extra spostamento +€30) oppure indica un altro indirizzo.');
        }
        setAddrOpts([]);
        break;
      }

      case 'timeslot': {
        const v = text.toLowerCase() === 'no' ? '' : text;
        const nf = { ...form, timeslot: v }; setForm(nf);
        addBot(<RecapBlock
          name={nf.name} phone={nf.phone} email={nf.email}
          address={nf.address} city={nf.city} message={nf.message} ai={ai}
        />);
        setStep('confirm');
        break;
      }

      case 'confirm': {
        if (!/^(s|si|sì|ok|va bene)/i.test(text)) {
          addBot('Ok, annullato. Se vuoi, descrivi di nuovo il problema per rifare il preventivo.');
          setStep('problem'); setStage(0);
          return;
        }

        setLoading(true); setStep('sending');
        try {
          const res = await fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...form,
              category: ai?.category,
              urgency: ai?.urgency,
              price: ai?.price,
              price_low: (ai as any)?.price_low,
              price_high: (ai as any)?.price_high,
              est_minutes: ai?.est_minutes,
              // opzionale: prezzo “operativo” coerente per altri sistemi
              ops_price: pickOpsPrice(ai)
            })
          });
          const j = await res.json();
          if (!j.ok) throw new Error(j.error || 'Invio fallito');

          const id = j.ticketId || 'NTF-XXXX';
          addBot(
            <>
              Richiesta inviata.<br />
              Numero richiesta: <span className="font-medium">{id}</span><br />
              Ti aggiorniamo col primo tecnico disponibile (12–20 min).
            </>
          );

          // Proponi account se guest
          try {
            const s = await fetch('/api/auth/session', { cache: 'no-store' });
            const sj = await s.json();
            const logged = !!(sj?.user || sj?.userId || sj?.token);
            if (!logged) {
              addBot('Vuoi salvare questa richiesta e tenere lo storico? Crea un account oppure accedi:');
              addBot(<AuthCTA />);
            }
          } catch { /* noop */ }

          setStep('done');
        } catch {
          addBot('Ops, qualcosa non ha funzionato nell’invio. Riprova tra poco o chiama il +(39) 346 1027447.');
          setStep('confirm');
        } finally { setLoading(false); }
        break;
      }
    }
  }

  function pickAddress(o: { label: string; value: { address: string; city: string; lat: number; lng: number } }) {
    const c = { lat: o.value.lat, lng: o.value.lng };
    setForm((f: any) => ({ ...f, address: o.value.address, city: o.value.city || f.city, geo: c }));
    setAddrOpts([]); setInput('');
    const d = distanceMeters(LIVORNO, c);
    if (d > COVER_RADIUS_M) addBot('Zona fuori copertura standard. Possiamo intervenire con extra spostamento (+€30) o indica un altro indirizzo.');
    else addBot('Indirizzo in copertura ✅');
    addBot('Hai preferenze di orario?');
    setStep('timeslot');
  }

  const disabling = loading || step === 'sending';
  const isAddressStep = step === 'address';

  return (
    <div className="mx-auto w-full max-w-2xl mt-3">
      <div className="card chat-shell">
        {/* HEADER */}
        <div><Progress3 stage={stage} /></div>

        {/* SCROLL */}
        <div className="chat-scroll">
          {msgs.map((m, i) => (
            <ChatBubble key={i} role={m.role as any}>{m.content}</ChatBubble>
          ))}

          {step === 'problem' && (
            <QuickReplies
              items={['Perdita lavandino', 'Scintille presa', 'Serratura bloccata', 'Montaggio mensola']}
              onPick={(t) => {
                setInput(t);
                setTimeout(() => {
                  (document.querySelector('form') as HTMLFormElement)
                    ?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
                }, 0);
              }}
            />
          )}

          {step === 'timeslot' && (
            <QuickReplies items={['Oggi', 'Domani mattina', 'Fascia 18–20']} onPick={setInput} />
          )}

          <div ref={endRef} />
        </div>

        {/* FOOTER */}
        {step !== 'done' && (
          <div className="mt-1">
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative flex gap-2">
              <div className="relative flex-1">
                <input
                  className="input w-full"
                  placeholder={
                    step === 'problem' ? 'Scrivi qui…'
                      : step === 'phone' ? 'Es: +39 333 1234567'
                        : step === 'address' ? 'Inizia a digitare via / civico / CAP'
                          : 'Scrivi qui...'
                  }
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={disabling}
                />

                {/* Suggerimenti indirizzo (dark fisso) */}
                {isAddressStep && addrOpts.length > 0 && (
                  <div
                    className="absolute left-0 right-0 z-20 mt-1 max-h-48 overflow-y-auto
                               rounded-xl border shadow bg-premium-surface border-premium-line"
                  >
                    {addrOpts.map((o, idx) => (
                      <div
                        key={idx}
                        className="px-3 py-2 text-sm hover:bg-premium-surface2 cursor-pointer"
                        onClick={() => pickAddress(o)}
                      >
                        {o.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {isAddressStep && (
                <button type="button" onClick={useMyLocation} className="btn">
                  Usa la mia posizione
                </button>
              )}

              <button className="btn-primary" disabled={disabling}>
                {loading ? '...' : (step === 'confirm' ? 'Conferma e trova il tuo tecnico' : 'Invia')}
              </button>
            </form>

            <div className="meta">Tempo medio di risposta: 12–20 min</div>
          </div>
        )}
      </div>
    </div>
  );
}