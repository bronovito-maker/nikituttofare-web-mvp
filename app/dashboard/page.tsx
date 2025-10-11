'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import type { Request } from '@/lib/types';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [requests, setRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = async (userId: string) => {
    try {
      const response = await fetch(`/api/requests?userId=${userId}`);
      if (!response.ok) {
        throw new Error('Errore nel recupero delle richieste');
      }
      const data = await response.json();
      setRequests(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Si è verificato un errore sconosciuto');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // ## PRIMA MODIFICA QUI ##
    // Usiamo session?.user?.id invece di session?.userId
    if (status === 'authenticated' && session?.user?.id) {
      // ## SECONDA MODIFICA QUI ##
      // Usiamo session.user.id invece di session.userId
      const userId = session.user.id;
      fetchRequests(userId);
      const intervalId = setInterval(() => fetchRequests(userId), 30000); // Aggiorna ogni 30 secondi
      return () => clearInterval(intervalId); // Pulisce l'intervallo quando il componente viene smontato
    } else if (status === 'unauthenticated') {
      setIsLoading(false);
    }
  }, [status, session]);

  if (isLoading) {
    return <div className="text-center p-8">Caricamento in corso...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">{error}</div>;
  }

  if (status === 'unauthenticated') {
    return (
      <div className="text-center p-8">
        <p>Devi essere loggato per vedere questa pagina.</p>
        <Link href="/login" className="text-blue-500 hover:underline">
          Vai al Login
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6">Le Tue Richieste</h1>
      {requests.length === 0 ? (
        <p>Non hai ancora nessuna richiesta attiva.</p>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <Link key={req.ticketId} href={`/dashboard/${req.ticketId}`} passHref>
              <div className="block p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-xl font-semibold">{req.category}</h2>
                  <span
                    className={`px-2 py-1 text-sm font-medium rounded-full ${
                      req.status === 'new' ? 'bg-blue-100 text-blue-800' :
                      req.status === 'assigned' ? 'bg-yellow-100 text-yellow-800' :
                      req.status === 'completed' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {req.status}
                  </span>
                </div>
                <p className="text-gray-600 truncate mb-2">{req.message}</p>
                <p className="text-sm text-gray-400">
                  Ticket: {req.ticketId} - Creato il: {new Date(req.createdAt).toLocaleDateString('it-IT')}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
