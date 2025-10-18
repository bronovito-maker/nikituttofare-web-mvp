// app/dashboard/page.tsx
import { auth } from '@/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { listViewRowsById } from '@/lib/noco-helpers';
import type { lib as nocoLib } from 'nocodb-sdk';
import { redirect } from 'next/navigation';
import type { Conversation } from '@/lib/types';

const TBL_BOOKINGS_ID = process.env.NOCO_TABLE_BOOKINGS_ID!;
const VW_BOOKINGS_ID = process.env.NOCO_VIEW_BOOKINGS_ID!;
const TBL_CONV_ID = process.env.NOCO_TABLE_CONVERSATIONS_ID!;
const VW_CONV_ID = process.env.NOCO_VIEW_CONVERSATIONS_ID!;

async function getDashboardStats(tenantId: string | number) {
  if (!TBL_BOOKINGS_ID || !VW_BOOKINGS_ID || !TBL_CONV_ID || !VW_CONV_ID) {
    throw new Error("Variabili d'ambiente ID NocoDB mancanti. Controlla .env.local");
  }

  const tenantIdNum = Number(tenantId);
  const whereTenant = `(tenant_id,eq,${tenantIdNum})`;

  // @ts-ignore: il pacchetto nocodb-sdk non esporta esplicitamente Filterv1
  const bookingsParams: nocoLib.Filterv1 = {
    where: whereTenant,
    limit: 1,
  };

  const allBookingsResult = await listViewRowsById(
    TBL_BOOKINGS_ID,
    VW_BOOKINGS_ID,
    bookingsParams
  );
  const totalBookings = allBookingsResult.pageInfo.totalRows;

  // @ts-ignore: il pacchetto nocodb-sdk non esporta esplicitamente Filterv1
  const pendingBookingsParams: nocoLib.Filterv1 = {
    where: `${whereTenant}~and(status,eq,richiesta)`,
    limit: 1,
  };

  const pendingBookingsResult = await listViewRowsById(
    TBL_BOOKINGS_ID,
    VW_BOOKINGS_ID,
    pendingBookingsParams
  );
  const pendingBookings = pendingBookingsResult.pageInfo.totalRows;

  // @ts-ignore: il pacchetto nocodb-sdk non esporta esplicitamente Filterv1
  const convParams: nocoLib.Filterv1 = {
    where: whereTenant,
    limit: 5,
    sort: '-CreatedAt',
  };

  const recentConversationsResult = await listViewRowsById(
    TBL_CONV_ID,
    VW_CONV_ID,
    convParams
  );

  return {
    totalBookings,
    pendingBookings,
    recentConversations: recentConversationsResult.list as Conversation[],
  };
}

function formatChatDate(dateString?: string): string {
  if (!dateString) return 'N/D';
  try {
    return new Date(dateString).toLocaleString('it-IT', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    redirect('/login');
  }

  const tenantId = session.user.tenantId;
  let stats;
  try {
    stats = await getDashboardStats(tenantId);
  } catch (error) {
    console.error('Errore caricamento statistiche dashboard:', error);
    return (
      <div className="p-4 text-red-500">
        Errore nel caricamento della dashboard. Controlla gli ID NocoDB e i permessi del token API.
        <pre className="mt-2 text-xs">{(error as Error).message}</pre>
      </div>
    );
  }

  const { totalBookings, pendingBookings, recentConversations } = stats;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Prenotazioni Totali</CardTitle>
            <CardDescription>
              Numero totale di prenotazioni registrate dal sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{totalBookings}</div>
          </CardContent>
        </Card>

        <Card className={pendingBookings > 0 ? 'border-yellow-500' : ''}>
          <CardHeader>
            <CardTitle>Prenotazioni da Approvare</CardTitle>
            <CardDescription>
              Prenotazioni con stato "richiesta" che attendono conferma.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-yellow-600">{pendingBookings}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ultime Conversazioni</CardTitle>
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
              {recentConversations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    Nessuna conversazione trovata.
                  </TableCell>
                </TableRow>
              )}
              {recentConversations.map((convo) => (
                <TableRow key={convo.Id}>
                  <TableCell className="text-xs">
                    {formatChatDate((convo as any).CreatedAt ?? (convo as any).createdAt)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={convo.intent === 'prenotazione' ? 'default' : 'secondary'}>
                      {convo.intent || 'N/D'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={convo.status === 'chiusa' ? 'outline' : 'default'}>
                      {convo.status || 'N/D'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm truncate max-w-sm">
                    {convo.summary}
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
