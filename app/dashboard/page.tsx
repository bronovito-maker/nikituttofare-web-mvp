// app/dashboard/page.tsx
'use client'
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface Request {
  id: string;
  ticketId: string;
  category: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

const statusTranslations: { [key: string]: string } = {
  pending: 'In attesa',
  assigned: 'Assegnato',
  in_progress: 'In corso',
  completed: 'Completato',
  cancelled: 'Annullato',
};

const statusColors: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  pending: 'default',
  assigned: 'secondary',
  in_progress: 'outline',
  completed: 'secondary',
  cancelled: 'destructive',
};

export default function DashboardPage() {
  const { data: session, status } = useSession({ required: true });
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async (userId: string) => {
    try {
      const response = await fetch(`/api/requests?userId=${userId}`);
      if (!response.ok) {
        throw new Error('Errore nel recupero delle richieste');
      }
      const data = await response.json();
      setRequests(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      const userId = session.user.id;
      fetchRequests(userId);
      const intervalId = setInterval(() => fetchRequests(userId), 30000); // Aggiorna ogni 30 secondi
      return () => clearInterval(intervalId);
    }
  }, [status, session, fetchRequests]);

  if (status === 'loading' || loading) {
    return <div className="container mx-auto p-4 text-center">Caricamento...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Le Tue Richieste</CardTitle>
          <CardDescription>Qui puoi vedere lo stato di tutte le tue richieste di intervento.</CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-8">
              <p className="mb-4">Non hai ancora nessuna richiesta attiva.</p>
              <Button asChild>
                <Link href="/chat">Crea una Nuova Richiesta</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((req) => (
                <div key={req.id} className="border p-4 rounded-lg flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">{req.category} - #{req.ticketId}</h3>
                    <p className="text-sm text-gray-500">
                      Ultimo aggiornamento: {format(new Date(req.updatedAt), "d MMMM yyyy 'alle' HH:mm", { locale: it })}
                    </p>
                    <Badge variant={statusColors[req.status] || 'default'} className="mt-2">
                      {statusTranslations[req.status] || req.status}
                    </Badge>
                  </div>
                  <Button asChild variant="outline">
                    <Link href={`/dashboard/${req.ticketId}`}>Vedi Dettagli</Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}