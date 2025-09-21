// app/dashboard/[ticketId]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AlertCircle, Calendar, CheckCircle, Euro, Hash, Home, Lightbulb, Loader, Mail, MapPin, MessageSquare, Phone, User, Wrench, XCircle, Droplets, Frown, Clock } from 'lucide-react';
import { Lead } from '@/lib/types'; // <-- CORREZIONE: Importa il tipo Lead
import Link from 'next/link';
import { Button } from '@/components/ui/button'; // <-- Ora questo import funziona

const DetailRow = ({ icon, label, value }: { icon: React.ReactNode, label: string, value?: string | number | null }) => {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-start text-sm sm:text-base">
      <div className="text-muted-foreground w-6 h-6 flex-shrink-0">{icon}</div>
      <div className="ml-3">
        <span className="font-semibold text-foreground">{label}:</span>
        <span className="ml-2 text-muted-foreground">{String(value)}</span>
      </div>
    </div>
  );
};

const StatusHeader = ({ status }: { status: Lead['Stato'] }) => {
    const statusMap = {
        'Inviata': { text: 'Richiesta Inviata', icon: <Loader size={22} className="animate-spin"/>, color: 'text-blue-500' },
        'In carico': { text: 'Presa in Carico', icon: <AlertCircle size={22} />, color: 'text-yellow-500' },
        'Completata': { text: 'Lavoro Completato', icon: <CheckCircle size={22} />, color: 'text-green-500' },
        'Annullata': { text: 'Richiesta Annullata', icon: <XCircle size={22} />, color: 'text-red-500' },
    };
    // --- CORREZIONE: Gestisce il caso in cui lo stato non sia definito ---
    const currentStatus = status && statusMap[status] ? statusMap[status] : statusMap['Inviata'];

    return (
        <div className={`flex items-center gap-3 text-xl font-bold p-4 rounded-lg bg-secondary ${currentStatus.color}`}>
            {currentStatus.icon}
            <h2>{currentStatus.text}</h2>
        </div>
    );
};

export default function TicketDetailPage() {
  const params = useParams();
  const ticketId = params.ticketId as string;
  const [request, setRequest] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (ticketId) {
      const fetchTicketDetails = async () => {
        setLoading(true);
        try {
          const res = await fetch(`/api/requests/${ticketId}`);
          if (!res.ok) throw new Error('Dettagli richiesta non trovati.');
          const json = await res.json();
          if (!json.ok) throw new Error(json.error || 'Errore API.');
          setRequest(json.data);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchTicketDetails();
    }
  }, [ticketId]);

  if (loading) {
    return <div className="container mx-auto px-4 py-8 text-center"><Loader className="animate-spin inline-block" /></div>;
  }

  if (error) {
    return <div className="container mx-auto px-4 py-8 text-center text-destructive">{error}</div>;
  }

  if (!request) {
    return <div className="container mx-auto px-4 py-8 text-center">Richiesta non trovata.</div>;
  }

  const date = request.CreatedAt ? new Date(request.CreatedAt).toLocaleString('it-IT', { dateStyle: 'full', timeStyle: 'short' }) : 'N/D';
  const price = request.price_low && request.price_high ? `~${request.price_low}–${request.price_high}€` : 'In valutazione';

  return (
    <main className="flex-grow container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dettaglio Richiesta</h1>
            <span className="font-mono text-muted-foreground"><Hash size={16} className="inline-block -mt-1" /> {request.ticketId}</span>
        </div>
        
        <StatusHeader status={request.Stato} />

        <div className="bg-card border rounded-lg p-6 space-y-4">
          <h3 className="font-semibold text-lg border-b pb-2 mb-4">Riepilogo Intervento</h3>
          <DetailRow icon={<MessageSquare />} label="Richiesta" value={request.message} />
          <DetailRow icon={<Wrench />} label="Categoria" value={request.category} />
          <DetailRow icon={<Calendar />} label="Data Richiesta" value={date} />
          <DetailRow icon={<Clock />} label="Disponibilità" value={request.timeslot} />
          <DetailRow icon={<Euro />} label="Stima Costo" value={price} />
        </div>

        <div className="bg-card border rounded-lg p-6 space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2 mb-4">I Tuoi Dati</h3>
            <DetailRow icon={<User />} label="Nome" value={request.name} />
            <DetailRow icon={<MapPin />} label="Indirizzo" value={`${request.address}, ${request.city}`} />
            <DetailRow icon={<Phone />} label="Telefono" value={request.phone} />
            <DetailRow icon={<Mail />} label="Email" value={request.email} />
        </div>

        {request.Stato === 'In carico' && request.technicianPhone && (
            <div className="bg-card border rounded-lg p-6">
                 <h3 className="font-semibold text-lg border-b pb-2 mb-4">Azioni Rapide</h3>
                 <Button asChild className="w-full">
                    <a href={`tel:${request.technicianPhone}`}>
                    <Phone size={16} className="mr-2" />
                    Chiama il tecnico
                    </a>
                </Button>
            </div>
        )}

        <div className="text-center pt-4">
            <Button variant="outline" asChild>
                <Link href="/dashboard">Torna alle mie richieste</Link>
            </Button>
        </div>
      </div>
    </main>
  );
}