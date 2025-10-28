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
  const SkeletonCard = () => (
    <div className="min-h-[120px] rounded-lg border bg-card p-4 md:p-6 animate-pulse">
      <div className="mb-2 h-4 w-3/4 rounded bg-muted" />
      <div className="mb-4 h-3 w-full rounded bg-muted" />
      <div className="h-8 w-1/4 rounded bg-muted" />
    </div>
  );

  const SkeletonRow = () => (
    <TableRow>
      <TableCell className="px-3 py-2 md:px-4">
        <div className="h-4 w-20 rounded bg-muted" />
      </TableCell>
      <TableCell className="px-3 py-2 md:px-4">
        <div className="h-4 w-16 rounded bg-muted" />
      </TableCell>
      <TableCell className="px-3 py-2 md:px-4">
        <div className="h-4 w-12 rounded bg-muted" />
      </TableCell>
      <TableCell className="px-3 py-2 md:px-4">
        <div className="h-4 w-48 rounded bg-muted" />
      </TableCell>
    </TableRow>
  );

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
    <div className="container mx-auto flex flex-col gap-6 px-4 py-8 md:gap-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        {updatedAtLabel && data && (
          <p className="text-sm text-muted-foreground">
            Aggiornato alle {updatedAtLabel} · refresh automatico ogni 15 secondi
          </p>
        )}
      </div>

      {error && (
        <Card className="border-red-500">
          <CardHeader className="p-4 md:p-6">
            <CardTitle>Errore</CardTitle>
            <CardDescription>
              Impossibile caricare le statistiche della dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
            <pre className="whitespace-pre-wrap break-words text-sm text-red-600">
              {error.message}
            </pre>
          </CardContent>
        </Card>
      )}

      {!error && isLoading && !data && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-6">
            {Array.from({ length: 5 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ultime Conversazioni
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground/80">
                Gli ultimi 5 ticket automatici generati dal chatbot.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="px-3 py-2 md:px-4">Data</TableHead>
                    <TableHead className="px-3 py-2 md:px-4">Intento</TableHead>
                    <TableHead className="px-3 py-2 md:px-4">Stato</TableHead>
                    <TableHead className="px-3 py-2 md:px-4">Riepilogo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 3 }).map((_, index) => (
                    <SkeletonRow key={index} />
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {data && !error && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-6">
            {metrics.map((metric) => (
              <Card
                key={metric.key}
                className={`min-h-[120px] ${metric.highlight ? 'border-yellow-500' : ''}`}
              >
                <CardHeader className="p-4 pb-2 md:p-6">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {metric.label}
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground/80">
                    {metric.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
                  <div className="text-3xl font-bold md:text-4xl">
                    {metric.value ?? '—'}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-base font-semibold text-foreground">
                Ultime Conversazioni
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Gli ultimi 5 ticket automatici generati dal chatbot.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="px-3 py-2 text-xs uppercase tracking-wide text-muted-foreground md:px-4">
                      Data
                    </TableHead>
                    <TableHead className="px-3 py-2 text-xs uppercase tracking-wide text-muted-foreground md:px-4">
                      Intento
                    </TableHead>
                    <TableHead className="px-3 py-2 text-xs uppercase tracking-wide text-muted-foreground md:px-4">
                      Stato
                    </TableHead>
                    <TableHead className="px-3 py-2 text-xs uppercase tracking-wide text-muted-foreground md:px-4">
                      Riepilogo
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentConversations.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="px-3 py-6 text-center text-sm text-muted-foreground md:px-4"
                      >
                        Nessuna conversazione trovata.
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentConversations.map((convo) => (
                      <TableRow key={convo.Id} className="hover:bg-muted/40">
                        <TableCell className="whitespace-nowrap px-3 py-2 text-xs md:px-4">
                          {formatChatDate(
                            (convo as any).CreatedAt ?? (convo as any).createdAt
                          )}
                        </TableCell>
                        <TableCell className="px-3 py-2 md:px-4">
                          <Badge
                            variant={
                              convo.intent === 'prenotazione' ? 'default' : 'secondary'
                            }
                          >
                            {convo.intent || 'N/D'}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-3 py-2 md:px-4">
                          <Badge variant={convo.status === 'chiusa' ? 'outline' : 'default'}>
                            {convo.status || 'N/D'}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate px-3 py-2 text-sm md:max-w-sm md:px-4">
                          {convo.summary || '—'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
