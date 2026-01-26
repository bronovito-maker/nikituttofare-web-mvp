'use client';

import { useEffect, useState, Suspense } from 'react';
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
  Euro
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createBrowserClient } from '@/lib/supabase-browser';

type AcceptanceState = 'loading' | 'ready' | 'accepting' | 'success' | 'error' | 'already_assigned';

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
export default function TechnicianAcceptPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <TechnicianAcceptContent />
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
function TechnicianAcceptContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [state, setState] = useState<AcceptanceState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [ticket, setTicket] = useState<TicketDetails | null>(null);
  const [client, setClient] = useState<ClientDetails | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      setState('ready');
    };

    checkAuth();
  }, []);

  const handleAccept = async () => {
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
      setState('error');
      setError('Errore di connessione. Riprova.');
    }
  };

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
            <Link href="/login">Vai al Login</Link>
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
            <p className="text-slate-600">Caricamento in corso...</p>
          </div>
        )}

        {state === 'ready' && (
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
              {!isAuthenticated && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                  <p className="text-sm text-yellow-800">
                    <strong>Nota:</strong> Per accettare devi essere loggato come tecnico.
                    Se non lo sei ancora, verrai reindirizzato al login.
                  </p>
                </div>
              )}
              <Button
                onClick={handleAccept}
                className="w-full h-14 text-lg bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white font-bold rounded-xl shadow-lg"
              >
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Accetta Intervento
              </Button>
            </div>
          </div>
        )}

        {state === 'accepting' && (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <Loader2 className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
            <p className="text-slate-700 font-semibold">Accettazione in corso...</p>
            <p className="text-slate-500 mt-2">Attendi qualche secondo mentre processiamo la tua richiesta.</p>
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
            <Button onClick={() => setState('ready')}>
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
                <Link href="/technician/dashboard">
                  Dashboard
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
