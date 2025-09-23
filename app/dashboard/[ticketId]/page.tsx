// File: app/dashboard/[ticketId]/page.tsx

// Importiamo prima le dipendenze per il Client Component
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Request } from '@/lib/types';

// ====================================================================
// 1. IL NOSTRO CLIENT COMPONENT (con 'use client')
//    Questo componente contiene tutta la logica interattiva.
// ====================================================================

// Mettiamo la direttiva 'use client' qui, all'inizio del componente
'use client';

function TicketDetailClient({ ticketId }: { ticketId: string }) {
  // Nota: ora riceve 'ticketId' direttamente come prop
  const { data: session, status } = useSession();
  const [request, setRequest] = useState<Request | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRequestDetails = async () => {
      if (status === 'authenticated') {
        try {
          const response = await fetch(`/api/requests/${ticketId}`);
          if (!response.ok) {
            throw new Error('Errore nel recupero dei dettagli della richiesta');
          }
          const data = await response.json();
          setRequest({ ...data, status: data.status || 'new', category: data.category || 'N/D' });
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Si è verificato un errore sconosciuto');
        } finally {
          setIsLoading(false);
        }
      } else if (status === 'unauthenticated') {
        setIsLoading(false);
        setError('Devi essere loggato per vedere questa pagina.');
      }
    };

    fetchRequestDetails();
  }, [ticketId, status]);

  if (isLoading) return <div className="text-center p-8">Caricamento dettagli...</div>;
  if (error) return <div className="text-center p-8 text-red-500">{error}</div>;
  if (!request) return <div className="text-center p-8">Richiesta non trovata.</div>;

  // Il resto del JSX rimane identico...
  return (
    <div className="container mx-auto p-4 md:p-8">
      <Link href="/dashboard" className="text-primary hover:underline mb-6 block">&larr; Torna alla Dashboard</Link>
      <div className="bg-card border rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-3xl font-bold">{request.category}</h1>
          <span
            className={`px-3 py-1 text-sm font-medium rounded-full ${
              request.status === 'new' ? 'bg-blue-100 text-blue-800' :
              request.status === 'assigned' ? 'bg-yellow-100 text-yellow-800' :
              request.status === 'completed' ? 'bg-green-100 text-green-800' :
              'bg-gray-100 text-gray-800'
            }`}
          >
            {request.status}
          </span>
        </div>
        <div className="space-y-4">
          <div>
            <h2 className="font-semibold text-foreground">Ticket ID</h2>
            <p className="text-muted-foreground">{request.ticketId}</p>
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Data Richiesta</h2>
            <p className="text-muted-foreground">{new Date(request.createdAt).toLocaleString('it-IT')}</p>
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Descrizione</h2>
            <p className="text-muted-foreground whitespace-pre-wrap">{request.message}</p>
          </div>
        </div>
      </div>
    </div>
  );
}


// ====================================================================
// 2. IL NOSTRO SERVER COMPONENT (l'export di default)
//    Questo componente gestisce la Promise e passa i dati al Client Component.
// ====================================================================

export default async function TicketDetailPage({ params }: { params: Promise<{ ticketId: string }> }) {
  // Aspettiamo che la Promise dei parametri sia risolta
  const { ticketId } = await params;

  // Renderizziamo il nostro Client Component, passandogli il ticketId come una semplice stringa
  return <TicketDetailClient ticketId={ticketId} />;
}