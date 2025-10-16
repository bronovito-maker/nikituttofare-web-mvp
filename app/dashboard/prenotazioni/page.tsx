import { auth } from '@/auth';
// import { formatRecordDate } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { listRecords } from '@/lib/noco';
import type { Request } from '@/lib/types';
import { redirect } from 'next/navigation';

const BOOKINGS_TABLE_KEY =
  process.env.NOCO_TABLE_BOOKINGS_ID ||
  process.env.NOCO_TABLE_BOOKINGS ||
  'Prenotazioni';
const BOOKINGS_VIEW_ID = process.env.NOCO_VIEW_BOOKINGS_ID;

const formatDateTime = (date?: string, time?: string) => {
  if (!date) return '—';
  const safeTime = time || '00:00';
  const composed = `${date}T${safeTime}`;
  const parsed = new Date(composed);
  if (Number.isNaN(parsed.getTime())) {
    return `${date} ${time ?? ''}`.trim();
  }
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed);
};

const formatStatus = (stato?: string) => {
  if (!stato) return 'Richiesta';
  switch (stato.toLowerCase()) {
    case 'confermata':
      return 'Confermata';
    case 'annullata':
      return 'Annullata';
    case 'richiesta':
    case 'richiesto':
      return 'Richiesta';
    default:
      return stato;
  }
};

export default async function PrenotazioniPage() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    redirect('/login');
  }

  const tenantId = session.user.tenantId;
  const bookingsRaw = await listRecords(BOOKINGS_TABLE_KEY, {
    where: `(tenant_id,eq,${tenantId})`,
    sort: '-CreatedAt',
    limit: 50,
    viewId: BOOKINGS_VIEW_ID,
  });

  const bookings = (bookingsRaw as Request[]) ?? [];

  return (
    <div className="container mx-auto space-y-8 p-4 md:p-8">
      <header className="space-y-2">
        <p className="text-sm text-blue-600">Dashboard / Prenotazioni</p>
        <h1 className="text-3xl font-bold tracking-tight">Gestione prenotazioni</h1>
        <p className="text-gray-500">
          Controlla e aggiorna le richieste raccolte dal receptionist AI per il tuo locale.
        </p>
      </header>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Prenotazioni recenti</CardTitle>
          <CardDescription>
            Le ultime 50 richieste registrate. Aggiorna lo stato direttamente da NocoDB o dal workflow interno.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {bookings.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500">
              Ancora nessuna prenotazione registrata. Il receptionist AI inizierà a crearle non appena gli utenti
              richiederanno un tavolo.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 text-sm">
                <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Contatti</th>
                    <th className="px-4 py-3">Servizio</th>
                    <th className="px-4 py-3">Data &amp; ora</th>
                    <th className="px-4 py-3">Persone</th>
                    <th className="px-4 py-3">Stato</th>
                    <th className="px-4 py-3">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white text-gray-700">
                  {bookings.map((booking) => (
                    <tr key={String(booking.Id ?? `${booking.tenant_id ?? ''}-${booking.cliente_nome ?? ''}-${booking.data_evento ?? ''}`)}>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900">
                          {String(booking.cliente_nome ?? 'Cliente chat')}
                        </div>
                        <div className="text-xs text-gray-500">
                          Inserita il{' '}
                          {formatDateTime(
                            String(booking.createdAt ?? booking.CreatedAt ?? booking.created_at ?? ''),
                            String(booking.orario ?? '')
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>{String(booking.telefono ?? '—')}</div>
                        <div className="text-xs text-gray-500">{String(booking.email ?? '')}</div>
                      </td>
                      <td className="px-4 py-3">
                        {booking.servizio
                          ? String(booking.servizio).toLowerCase() === 'pranzo'
                            ? 'Pranzo'
                            : 'Cena'
                          : '—'}
                      </td>
                      <td className="px-4 py-3">{formatDateTime(String(booking.data_evento ?? ''), String(booking.orario ?? ''))}</td>
                      <td className="px-4 py-3">{String(booking.people_count ?? '—')}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                          {formatStatus(String(booking.stato ?? ''))}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-gray-600">
                          {String(booking.note_cliente ?? '—')}
                        </div>
                        {booking.calendar_event_link && typeof booking.calendar_event_link === 'string' ? (
                          <a
                            href={String(booking.calendar_event_link)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-flex items-center text-xs font-medium text-blue-600 hover:underline"
                          >
                            Apri evento calendario
                          </a>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
