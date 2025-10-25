'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Conversation } from '@/lib/types';

export type DashboardStatsResponse = {
  totalCustomers: number;
  totalBookings: number;
  bookingsToday: number;
  bookingsThisMonth: number;
  pendingBookings: number;
  recentConversations: Conversation[];
  updatedAt: string;
  error?: string;
};

type DashboardOverviewProps = {
  data?: DashboardStatsResponse | null;
  isLoading: boolean;
  error?: Error;
};

const formatChatDate = (input?: string): string => {
  if (!input) return 'N/D';
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return input;
  return date.toLocaleString('it-IT', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatUpdatedAt = (input?: string) => {
  if (!input) return undefined;
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export default function DashboardOverview({
  data,
  isLoading,
  error,
}: DashboardOverviewProps) {
  const metrics = [
    {
      key: 'totalCustomers',
      label: 'Clienti Registrati',
      description: 'Numero totale di clienti presenti nel CRM.',
      value: data?.totalCustomers ?? null,
    },
    {
      key: 'totalBookings',
      label: 'Prenotazioni Totali',
      description: 'Prenotazioni registrate dal sistema.',
      value: data?.totalBookings ?? null,
    },
    {
      key: 'bookingsToday',
      label: 'Prenotazioni di Oggi',
      description: 'Richieste con data odierna.',
      value: data?.bookingsToday ?? null,
    },
    {
      key: 'bookingsThisMonth',
      label: 'Prenotazioni del Mese',
      description: 'Totale prenotazioni del mese corrente.',
      value: data?.bookingsThisMonth ?? null,
    },
    {
      key: 'pendingBookings',
      label: 'Prenotazioni da Approvare',
      description: 'Prenotazioni con stato “richiesta”.',
      value: data?.pendingBookings ?? null,
      highlight: (data?.pendingBookings ?? 0) > 0,
    },
  ];

  const recentConversations = data?.recentConversations ?? [];
  const updatedAtLabel = formatUpdatedAt(data?.updatedAt);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        {updatedAtLabel && data && (
          <p className="text-sm text-muted-foreground">
            Aggiornato alle {updatedAtLabel} · refresh automatico ogni 15 secondi
          </p>
        )}
      </div>

      {error && (
        <Card className="border-red-500">
          <CardHeader>
            <CardTitle>Errore</CardTitle>
            <CardDescription>
              Impossibile caricare le statistiche della dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="text-sm text-red-600 whitespace-pre-wrap break-words">
              {error.message}
            </pre>
          </CardContent>
        </Card>
      )}

      {!error && !data && isLoading && (
        <Card>
          <CardHeader>
            <CardTitle>Caricamento dashboard</CardTitle>
            <CardDescription>Recupero dati in corso...</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Uno sguardo ai dati arriverà tra pochi secondi.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => (
          <Card
            key={metric.key}
            className={metric.highlight ? 'border-yellow-500' : undefined}
          >
            <CardHeader>
              <CardTitle>{metric.label}</CardTitle>
              <CardDescription>{metric.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">
                {isLoading && !data ? (
                  <span className="inline-flex h-6 items-center animate-pulse">
                    …
                  </span>
                ) : (
                  metric.value ?? '—'
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ultime Conversazioni</CardTitle>
          <CardDescription>
            Gli ultimi 5 ticket automatici generati dal chatbot.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Intento</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead>Riepilogo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentConversations.length === 0 && !isLoading && data && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    Nessuna conversazione trovata.
                  </TableCell>
                </TableRow>
              )}
              {isLoading && recentConversations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Caricamento in corso...
                  </TableCell>
                </TableRow>
              )}
              {recentConversations.map((convo) => (
                <TableRow key={convo.Id}>
                  <TableCell className="text-xs">
                    {formatChatDate(
                      (convo as any).CreatedAt ?? (convo as any).createdAt
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        convo.intent === 'prenotazione' ? 'default' : 'secondary'
                      }
                    >
                      {convo.intent || 'N/D'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={convo.status === 'chiusa' ? 'outline' : 'default'}
                    >
                      {convo.status || 'N/D'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm truncate max-w-sm">
                    {convo.summary || '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
