'use client';

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  MapPin,
  Phone,
  User,
  Wrench,
  Zap,
  Key,
  Thermometer,
  AlertTriangle,
  Euro,
  Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createBrowserClient } from '@/lib/supabase-browser';
import { COMPANY_PHONE, COMPANY_PHONE_LINK } from '@/lib/constants';

type ClaimState = 'loading' | 'phone_input' | 'verifying' | 'ready' | 'accepting' | 'success' | 'error' | 'already_assigned';

interface TicketDetails {
  id: string;
  category: string;
  priority: string;
  description: string;
  address: string;
  city: string;
  photo_url?: string;
  price_range_min?: number;
  price_range_max?: number;
}

interface ClientDetails {
  full_name: string;
  phone: string;
  email: string;
}

const categoryConfig: Record<string, { icon: typeof Wrench; color: string; label: string }> = {
  plumbing: { icon: Wrench, color: 'bg-blue-100 text-blue-600', label: 'Idraulico' },
  electric: { icon: Zap, color: 'bg-yellow-100 text-yellow-600', label: 'Elettricista' },
  locksmith: { icon: Key, color: 'bg-slate-100 text-slate-600', label: 'Fabbro' },
  climate: { icon: Thermometer, color: 'bg-cyan-100 text-cyan-600', label: 'Clima' },
  generic: { icon: Wrench, color: 'bg-purple-100 text-purple-600', label: 'Generico' },
};

const priorityConfig: Record<string, { color: string; label: string }> = {
  emergency: { color: 'bg-red-100 text-red-700 border-red-200', label: '🚨 Emergenza' },
  high: { color: 'bg-orange-100 text-orange-700 border-orange-200', label: '🔴 Alta' },
  medium: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: '🟡 Media' },
  low: { color: 'bg-green-100 text-green-700 border-green-200', label: '🟢 Bassa' },
};

// Wrapper component for Suspense boundary
export default function TechnicianClaimPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <TechnicianClaimContent />
    </Suspense>
  );
}

// Loading state component
function LoadingState() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
        <p className="text-slate-600">Caricamento in corso...</p>
      </div>
    </div>
  );
}

// Main content component
function TechnicianClaimContent() {
  const searchParams = useSearchParams();
  // router removed - unused
  const token = searchParams.get('token');

  const [state, setState] = useState<ClaimState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [ticket, setTicket] = useState<TicketDetails | null>(null);
  const [client, setClient] = useState<ClientDetails | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');


  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        // User is logged in, check if they're a technician
        type ProfileRole = 'user' | 'admin' | 'technician';
        const { data: profileRaw } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle();

        const profile = profileRaw as { role: ProfileRole } | null;

        if (profile?.role === 'technician' || profile?.role === 'admin') {
          setState('ready');
        } else {
          // Logged in but not a technician
          setState('error');
          setError('Accesso riservato ai tecnici. Il tuo account non ha i permessi necessari.');
        }
      } else {
        // Not logged in, show phone input
        setState('phone_input');
      }
    };

    checkAuth();
  }, []);

  // Handle phone number verification
  const handlePhoneVerify = useCallback(async () => {
    if (!phoneNumber.trim()) {
      setError('Inserisci il tuo numero di telefono');
      return;
    }

    // Normalize phone number
    const normalizedPhone = phoneNumber.replaceAll(/\s|-/g, '').trim();

    setState('verifying');
    setError(null);

    try {
      // Call the fast-claim API to verify phone and auto-login
      const response = await fetch('/api/technician/fast-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: normalizedPhone,
          token
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setState('phone_input');
        setError(data.message || 'Numero non riconosciuto. Contatta l\'amministrazione.');
        return;
      }

      // Success! Phone verified, technician auto-logged in

      // If the API already assigned the ticket, show success
      if (data.ticket && data.client) {
        setTicket(data.ticket);
        setClient(data.client);
        setState('success');
      } else {
        setState('ready');
      }

    } catch (err) {
      console.error('Phone verification failed:', err);
      setState('phone_input');
      setError('Errore di connessione. Riprova.');
    }
  }, [phoneNumber, token]);

  // Handle ticket acceptance (for already authenticated users)
  const handleAccept = useCallback(async () => {
    if (!token) {
      setError('Token mancante');
      setState('error');
      return;
    }

    setState('accepting');
    setError(null);

    try {
      const response = await fetch('/api/technician/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!data.success) {
        if (data.error === 'already_assigned') {
          setState('already_assigned');
          setError(data.message);
        } else {
          setState('error');
          setError(data.message || 'Errore durante l\'accettazione');
        }
        return;
      }

      // Success!
      setTicket(data.ticket);
      setClient(data.client);
      setState('success');

    } catch (err) {
      console.error('Ticket acceptance failed:', err);
      setState('error');
      setError('Errore di connessione. Riprova.');
    }
  }, [token]);

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Link non valido</h1>
          <p className="text-slate-600 mb-6">
            Questo link non contiene un token valido. Assicurati di aver cliccato il link corretto dal messaggio Telegram.
          </p>
          <Button asChild>
            <Link href="/">Torna alla Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="relative h-10 w-10 overflow-hidden rounded-lg shadow">
            <Image src="/logo_ntf.png" alt="NTF Logo" fill className="object-cover" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">NikiTuttoFare</h1>
            <p className="text-xs text-slate-500">Area Tecnici</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">

        {/* Loading State */}
        {state === 'loading' && (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Verifica in corso...</p>
          </div>
        )}

        {/* Phone Input State - FRICTIONLESS LOGIN */}
        {state === 'phone_input' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                  <Smartphone className="w-8 h-8 text-blue-600" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                  Verifica Tecnico
                </h1>
                <p className="text-slate-600">
                  Inserisci il tuo numero di cellulare registrato per accettare l&apos;intervento.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="phone-input" className="block text-sm font-semibold text-slate-700 mb-2">
                    Numero di Telefono
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      id="phone-input"
                      type="tel"
                      placeholder="+39 345 123 4567"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-100 border-0 rounded-xl text-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                      autoFocus
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Usa il numero registrato nel tuo profilo tecnico
                  </p>
                </div>

                <Button
                  onClick={handlePhoneVerify}
                  disabled={!phoneNumber.trim()}
                  className="w-full h-14 text-lg bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white font-bold rounded-xl shadow-lg disabled:opacity-50"
                >
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Verifica e Accetta Intervento
                </Button>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-200 text-center">
                <p className="text-sm text-slate-500">
                  Problemi? Contatta <a href={COMPANY_PHONE_LINK} className="text-blue-600 font-semibold hover:underline">+39 {COMPANY_PHONE}</a>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Verifying State */}
        {state === 'verifying' && (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Verifica numero in corso...</p>
          </div>
        )}

        {/* Ready to Accept State (for already authenticated users) */}
        {(state === 'ready' || state === 'accepting') && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                  <AlertTriangle className="w-8 h-8 text-blue-600" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                  Nuovo Intervento Disponibile
                </h1>
                <p className="text-slate-600">
                  Clicca il pulsante per accettare questo intervento.
                  <br />
                  <span className="text-sm text-orange-600 font-medium">
                    ⚠️ Attenzione: il primo tecnico che accetta ottiene il lavoro!
                  </span>
                </p>
              </div>

              <Button
                onClick={handleAccept}
                disabled={state === 'accepting'}
                className="w-full h-14 text-lg bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white font-bold rounded-xl shadow-lg"
              >
                {state === 'accepting' ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Accettazione in corso...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Accetta Intervento
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Already Assigned State */}
        {state === 'already_assigned' && (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 mb-4">
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Intervento Già Assegnato
            </h1>
            <p className="text-slate-600 mb-6">
              {error || 'Un altro tecnico ha già accettato questo intervento.'}
            </p>
            <p className="text-sm text-slate-500">
              Non preoccuparti, ci saranno altre richieste a breve!
            </p>
          </div>
        )}

        {/* Error State */}
        {state === 'error' && (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Errore</h1>
            <p className="text-slate-600 mb-6">{error}</p>
            <Button onClick={() => setState('phone_input')}>
              Riprova
            </Button>
          </div>
        )}

        {/* Success State - Show Full Ticket Details */}
        {state === 'success' && ticket && client && (
          <div className="space-y-6">
            {/* Success Banner */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl shadow-xl p-6 text-white text-center">
              <CheckCircle2 className="w-16 h-16 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">
                Intervento Assegnato a Te!
              </h1>
              <p className="opacity-90">
                Contatta il cliente il prima possibile per confermare l&apos;appuntamento.
              </p>
            </div>

            {/* Client Details Card */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-blue-600 px-6 py-4">
                <h2 className="text-white font-bold flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Dati Cliente
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Nome</p>
                    <p className="font-semibold text-slate-900">{client.full_name || 'Non specificato'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Telefono</p>
                    <a
                      href={`tel:${client.phone}`}
                      className="font-semibold text-green-600 text-lg hover:underline"
                    >
                      {client.phone || 'Non specificato'}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Indirizzo</p>
                    <p className="font-semibold text-slate-900">
                      {ticket.address || ticket.city || 'Non specificato'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="px-6 pb-6">
                <Button asChild className="w-full h-12 bg-green-600 hover:bg-green-700">
                  <a href={`tel:${client.phone}`}>
                    <Phone className="w-5 h-5 mr-2" />
                    Chiama il Cliente
                  </a>
                </Button>
              </div>
            </div>

            {/* Ticket Details Card */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-slate-800 px-6 py-4 flex items-center justify-between">
                <h2 className="text-white font-bold flex items-center gap-2">
                  <Wrench className="w-5 h-5" />
                  Dettagli Intervento
                </h2>
                <span className="text-slate-400 text-sm">
                  #{ticket.id.slice(-8).toUpperCase()}
                </span>
              </div>
              <div className="p-6 space-y-4">
                {/* Category & Priority */}
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    const cat = categoryConfig[ticket.category] || categoryConfig.generic;
                    const CatIcon = cat.icon;
                    return (
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${cat.color}`}>
                        <CatIcon className="w-4 h-4" />
                        {cat.label}
                      </span>
                    );
                  })()}
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${priorityConfig[ticket.priority]?.color || priorityConfig.medium.color}`}>
                    {priorityConfig[ticket.priority]?.label || ticket.priority}
                  </span>
                </div>

                {/* Description */}
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Descrizione</p>
                  <p className="text-slate-900">{ticket.description}</p>
                </div>

                {/* Price Range */}
                {ticket.price_range_min && ticket.price_range_max && (
                  <div className="flex items-center gap-3 bg-green-50 p-4 rounded-xl border border-green-200">
                    <Euro className="w-6 h-6 text-green-600" />
                    <div>
                      <p className="text-xs text-green-700 uppercase tracking-wide">Preventivo stimato</p>
                      <p className="font-bold text-green-800 text-lg">
                        {ticket.price_range_min}€ - {ticket.price_range_max}€
                      </p>
                    </div>
                  </div>
                )}

                {/* Photo */}
                {ticket.photo_url && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Foto del problema</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={ticket.photo_url}
                      alt="Foto del guasto"
                      className="rounded-xl border border-slate-200 max-h-64 w-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button asChild variant="outline" className="flex-1 h-12">
                <Link href="/">
                  Home
                </Link>
              </Button>
              <Button asChild className="flex-1 h-12 bg-green-600 hover:bg-green-700">
                <a href={`tel:${client.phone}`}>
                  <Phone className="w-5 h-5 mr-2" />
                  Chiama
                </a>
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
