'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft,
  Ticket,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  MessageCircle,
  Phone,
  Wrench,
  Zap,
  Key,
  Thermometer,
  Calendar,
  MapPin,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClientAnimationWrapper } from '@/components/ui/client-animation-wrapper';

// Types
interface UserTicket {
  id: string;
  category: 'plumbing' | 'electric' | 'locksmith' | 'climate' | 'generic';
  status: 'new' | 'assigned' | 'in_progress' | 'resolved' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'emergency';
  description: string;
  address: string | null;
  created_at: string;
  technician_name?: string;
  estimated_arrival?: string;
}

const CATEGORY_CONFIG: Record<string, { icon: typeof Wrench; color: string; bgColor: string; label: string }> = {
  plumbing: { icon: Wrench, color: 'text-blue-600', bgColor: 'bg-blue-50', label: 'Idraulico' },
  electric: { icon: Zap, color: 'text-yellow-600', bgColor: 'bg-yellow-50', label: 'Elettricista' },
  locksmith: { icon: Key, color: 'text-slate-600', bgColor: 'bg-slate-100', label: 'Fabbro' },
  climate: { icon: Thermometer, color: 'text-cyan-600', bgColor: 'bg-cyan-50', label: 'Clima' },
  generic: { icon: Wrench, color: 'text-purple-600', bgColor: 'bg-purple-50', label: 'Generico' },
};

const STATUS_CONFIG: Record<string, { color: string; bgColor: string; label: string; icon: typeof Clock }> = {
  new: { color: 'text-blue-700', bgColor: 'bg-blue-100', label: 'In attesa', icon: Clock },
  assigned: { color: 'text-purple-700', bgColor: 'bg-purple-100', label: 'Tecnico assegnato', icon: CheckCircle2 },
  in_progress: { color: 'text-yellow-700', bgColor: 'bg-yellow-100', label: 'In corso', icon: Wrench },
  resolved: { color: 'text-green-700', bgColor: 'bg-green-100', label: 'Completato', icon: CheckCircle2 },
  cancelled: { color: 'text-slate-500', bgColor: 'bg-slate-100', label: 'Annullato', icon: AlertCircle },
};

export default function ClientDashboard() {
  const [tickets, setTickets] = useState<UserTicket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTickets = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/user/tickets');
        if (!res.ok) {
          throw new Error('Impossibile recuperare i tuoi ticket');
        }
        const data = await res.json();
        setTickets(data.tickets || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Errore sconosciuto');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTickets();
  }, []);

  // Stats
  const activeTickets = tickets.filter(t => ['new', 'assigned', 'in_progress'].includes(t.status));
  const completedTickets = tickets.filter(t => t.status === 'resolved');

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/30 bg-white/90 backdrop-blur-xl shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link 
              href="/" 
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-slate-900">I Miei Interventi</h1>
              <p className="text-xs text-slate-500">Storico e stato richieste</p>
            </div>
          </div>

          <Button
            asChild
            className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white rounded-full px-4 py-2 shadow-lg shadow-orange-200/50 font-semibold text-sm"
          >
            <Link href="/chat" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nuovo Intervento</span>
            </Link>
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Stats Summary */}
        <ClientAnimationWrapper delay={0.1} duration={0.5}>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-xl bg-blue-50">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-slate-500">In Corso</span>
              </div>
              <p className="text-3xl font-black text-slate-900">{activeTickets.length}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-xl bg-green-50">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-sm font-medium text-slate-500">Completati</span>
              </div>
              <p className="text-3xl font-black text-slate-900">{completedTickets.length}</p>
            </div>
          </div>
        </ClientAnimationWrapper>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {isLoading && (
          <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-sm text-slate-600">
            Caricamento interventi...
          </div>
        )}

        {/* Active Tickets */}
        {activeTickets.length > 0 && (
          <ClientAnimationWrapper delay={0.2} duration={0.5}>
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900">Interventi Attivi</h2>
              
              {activeTickets.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} isActive />
              ))}
            </div>
          </ClientAnimationWrapper>
        )}

        {/* Completed Tickets */}
        {completedTickets.length > 0 && (
          <ClientAnimationWrapper delay={0.3} duration={0.5}>
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900">Storico Interventi</h2>
              
              {completedTickets.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} />
              ))}
            </div>
          </ClientAnimationWrapper>
        )}

        {/* Empty State */}
        {tickets.length === 0 && !isLoading && !error && (
          <ClientAnimationWrapper delay={0.2} duration={0.5}>
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 mb-4">
                <Ticket className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Nessun intervento</h3>
              <p className="text-slate-500 mb-6">Non hai ancora richiesto nessun intervento</p>
              <Button asChild className="btn-urgent rounded-full">
                <Link href="/chat">
                  Richiedi Intervento
                  <ChevronRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
            </div>
          </ClientAnimationWrapper>
        )}

        {/* Help Section */}
        <ClientAnimationWrapper delay={0.4} duration={0.5}>
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border border-blue-200/50 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Hai bisogno di aiuto?</h3>
            <p className="text-sm text-slate-600 mb-4">
              Il nostro team è disponibile 24/7 per assisterti.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild variant="outline" className="rounded-full">
                <Link href="/chat" className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Chatta con Niki
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full">
                <a href="tel:+390541123456" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Chiama Ora
                </a>
              </Button>
            </div>
          </div>
        </ClientAnimationWrapper>
      </main>
    </div>
  );
}

// Ticket Card Component
function TicketCard({ ticket, isActive = false }: { ticket: UserTicket; isActive?: boolean }) {
  const categoryConfig = CATEGORY_CONFIG[ticket.category];
  const statusConfig = STATUS_CONFIG[ticket.status];
  const CategoryIcon = categoryConfig.icon;
  const StatusIcon = statusConfig.icon;

  return (
    <div className={`bg-white rounded-2xl border ${isActive ? 'border-blue-200 shadow-lg shadow-blue-100/50' : 'border-slate-200'} overflow-hidden hover:shadow-lg transition-shadow`}>
      {/* Status Banner for Active */}
      {isActive && ticket.status === 'in_progress' && ticket.technician_name && (
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-3 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Wrench className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">{ticket.technician_name} sta arrivando</p>
                {ticket.estimated_arrival && (
                  <p className="text-xs text-white/80">Arrivo stimato: {ticket.estimated_arrival}</p>
                )}
              </div>
            </div>
            <Button size="sm" variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0 rounded-full text-xs">
              Traccia
            </Button>
          </div>
        </div>
      )}

      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Category Icon */}
          <div className={`p-3 rounded-xl ${categoryConfig.bgColor}`}>
            <CategoryIcon className={`w-6 h-6 ${categoryConfig.color}`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusConfig.bgColor} ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
              <span className="text-xs text-slate-400">#{ticket.id.slice(-6)}</span>
            </div>
            
            <h4 className="text-base font-semibold text-slate-900 mb-2 line-clamp-2">
              {ticket.description}
            </h4>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
              {ticket.address && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="line-clamp-1">{ticket.address}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  {new Date(ticket.created_at).toLocaleDateString('it-IT', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Action */}
          <Button variant="ghost" size="sm" className="rounded-full">
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </Button>
        </div>
      </div>
    </div>
  );
}
