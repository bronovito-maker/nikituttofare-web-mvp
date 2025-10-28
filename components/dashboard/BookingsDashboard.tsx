'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
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
import type { Booking, Customer } from '@/lib/types';

export type DashboardBookingsResponse = {
  list: Array<Booking & { customer: Customer | null }>;
  pageInfo: {
    totalRows?: number;
    page?: number;
    pageSize?: number;
  };
  error?: string;
};

type RangeFilter = 'all' | 'today' | 'upcoming';
type StatusFilter = 'all' | Booking['status'];

type BookingsDashboardProps = {
  bookings: DashboardBookingsResponse['list'];
  totalRows?: number;
  isLoading: boolean;
  isRefreshing: boolean;
  error?: Error;
  range: RangeFilter;
  status: StatusFilter;
  onRangeChange: (range: RangeFilter) => void;
  onStatusChange: (status: StatusFilter) => void;
};

const formatBookingDate = (value: string): string => {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('it-IT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getStatusBadgeVariant = (
  status: Booking['status']
): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'confermata':
      return 'default';
    case 'richiesta':
      return 'secondary';
    case 'cancellata':
      return 'destructive';
    case 'completata':
      return 'outline';
    default:
      return 'secondary';
  }
};

export default function BookingsDashboard({
  bookings,
  totalRows,
  isLoading,
  isRefreshing,
  error,
  range,
  status,
  onRangeChange,
  onStatusChange,
}: BookingsDashboardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Gestione Prenotazioni</CardTitle>
            <p className="text-sm text-muted-foreground">
              Visualizza e aggiorna le prenotazioni in tempo reale.
              {typeof totalRows === 'number' && <> Totale archivio: {totalRows}</>}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={range === 'all' ? 'default' : 'outline'}
              onClick={() => onRangeChange('all')}
              disabled={range === 'all'}
            >
              Tutte
            </Button>
            <Button
              variant={range === 'today' ? 'default' : 'outline'}
              onClick={() => onRangeChange('today')}
              disabled={range === 'today'}
            >
              Oggi
            </Button>
            <Button
              variant={range === 'upcoming' ? 'default' : 'outline'}
              onClick={() => onRangeChange('upcoming')}
              disabled={range === 'upcoming'}
            >
              Prossime
            </Button>
            <Button
              variant={status === 'all' ? 'default' : 'outline'}
              onClick={() => onStatusChange('all')}
              disabled={status === 'all'}
            >
              Stato: Tutti
            </Button>
            <Button
              variant={status === 'richiesta' ? 'default' : 'outline'}
              onClick={() => onStatusChange('richiesta')}
              disabled={status === 'richiesta'}
            >
              Stato: Richieste
            </Button>
            <Button
              variant={status === 'confermata' ? 'default' : 'outline'}
              onClick={() => onStatusChange('confermata')}
              disabled={status === 'confermata'}
            >
              Stato: Confermate
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="rounded border border-red-200 bg-red-50 p-4 text-red-500">
            {error.message}
          </div>
        )}

        {!error && bookings.length === 0 && !isLoading && (
          <div className="p-8 text-center text-muted-foreground">
            Nessuna prenotazione trovata per i filtri selezionati.
          </div>
        )}

        {isLoading && bookings.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            Caricamento prenotazioni...
          </div>
        )}

        {bookings.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data e Ora</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Contatti</TableHead>
                <TableHead className="text-center">Persone</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead className="hidden md:table-cell">Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => (
                <TableRow key={booking.Id}>
                  <TableCell className="font-medium">
                    {formatBookingDate(booking.booking_datetime)}
                  </TableCell>
                  <TableCell>{booking.customer?.full_name || 'N/D'}</TableCell>
                  <TableCell className="text-sm">
                    {booking.customer?.phone_number ??
                      booking.customer?.email ??
                      'N/D'}
                  </TableCell>
                  <TableCell className="text-center">
                    {booking.party_size ?? '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(booking.status)}>
                      {booking.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden max-w-xs truncate text-xs md:table-cell">
                    {booking.notes || '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {isRefreshing && bookings.length > 0 && (
          <p className="mt-4 text-xs text-muted-foreground">
            Aggiornamento dati in corso...
          </p>
        )}
      </CardContent>
    </Card>
  );
}
