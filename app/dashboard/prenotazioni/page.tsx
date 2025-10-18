// app/dashboard/prenotazioni/page.tsx
import { auth } from '@/auth';
import { listViewRowsById } from '@/lib/noco-helpers';
import { Booking, Customer } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { lib as nocoLib } from 'nocodb-sdk';
import {
  NC_TABLE_BOOKINGS_ID,
  NC_VIEW_BOOKINGS_ID,
  NC_TABLE_CUSTOMERS_ID,
  NC_VIEW_CUSTOMERS_ID,
} from '@/lib/noco-ids';

type BookingWithCustomer = Booking & {
  customer?: Partial<Customer>;
};

async function getBookings(tenantId: number): Promise<BookingWithCustomer[]> {
  const bookingParams = {
    where: `(tenant_id,eq,${tenantId})`,
    sort: '-booking_datetime',
    limit: 50,
  };

  const bookingsResult = await listViewRowsById(
    NC_TABLE_BOOKINGS_ID,
    NC_VIEW_BOOKINGS_ID,
    bookingParams as unknown as nocoLib.Filterv1
  );

  const bookings: Booking[] = (bookingsResult as { list?: Booking[] })?.list ?? [];
  if (!bookings.length) return [];

  const customerIds = [...new Set(bookings.map((b) => b.customer_id).filter(Boolean))];
  if (customerIds.length === 0) {
    return bookings.map((booking) => ({ ...booking }));
  }

  const customerParams = {
    where: `(Id,in,${customerIds.join(',')})`,
  };

  const customersResult = await listViewRowsById(
    NC_TABLE_CUSTOMERS_ID,
    NC_VIEW_CUSTOMERS_ID,
    customerParams as unknown as nocoLib.Filterv1
  );
  const customers: Customer[] = (customersResult as { list?: Customer[] })?.list ?? [];
  const customerMap = new Map(customers.map((customer) => [customer.Id, customer]));

  return bookings.map((booking) => ({
    ...booking,
    customer: customerMap.get(booking.customer_id),
  }));
}

function formatBookingDate(dateString: string): string {
  if (!dateString) return '—';
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return dateString;
  return parsed.toLocaleString('it-IT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStatusBadgeVariant(status: Booking['status']): 'default' | 'secondary' | 'destructive' | 'outline' {
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
}

export default async function PrenotazioniPage() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return <div className="p-4">Accesso negato.</div>;
  }

  let bookings: BookingWithCustomer[] = [];
  let error: string | null = null;

  try {
    bookings = await getBookings(Number(session.user.tenantId));
  } catch (err) {
    console.error('Errore caricamento prenotazioni:', err);
    error = 'Impossibile caricare le prenotazioni.';
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestione Prenotazioni</CardTitle>
        <p className="text-sm text-gray-500">Visualizza le ultime 50 prenotazioni richieste e confermate.</p>
      </CardHeader>
      <CardContent>
        {error && <div className="text-red-500 p-4">{error}</div>}
        {!error && bookings.length === 0 && (
          <div className="text-center text-gray-500 p-8">Nessuna prenotazione trovata.</div>
        )}
        {!error && bookings.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data e Ora</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Contatti</TableHead>
                <TableHead>Persone</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead className="hidden md:table-cell">Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => (
                <TableRow key={booking.Id}>
                  <TableCell className="font-medium">{formatBookingDate(booking.booking_datetime)}</TableCell>
                  <TableCell>{booking.customer?.full_name || 'N/D'}</TableCell>
                  <TableCell className="text-sm">
                    {booking.customer?.phone_number || booking.customer?.email || 'N/D'}
                  </TableCell>
                  <TableCell className="text-center">{booking.party_size ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(booking.status)}>{booking.status}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs truncate max-w-xs">
                    {booking.notes || '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
