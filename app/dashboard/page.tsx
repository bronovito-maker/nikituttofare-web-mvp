import { auth } from '@/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { listRecords } from '@/lib/noco';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { MessageSquare, Settings, Users } from 'lucide-react';

type LeadRecord = {
  Id: string;
  CreatedAt?: string;
  nome?: string;
  telefono?: string;
  richiesta?: string;
  note_interne?: string;
  stato?: string;
  intent?: string;
  persone?: number;
  orario?: string;
};

const LEADS_TABLE_KEY =
  process.env.NOCO_TABLE_LEADS_ID ||
  process.env.NOCO_TABLE_LEADS ||
  'Leads';

const LEADS_VIEW_ID = process.env.NOCO_VIEW_LEADS_ID;

const formatDate = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const startOfToday = () => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.getTime();
};

const startOfMonth = () => {
  const now = new Date();
  now.setDate(1);
  now.setHours(0, 0, 0, 0);
  return now.getTime();
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  const tenantId = session.user.tenantId;
  const leadsRaw = tenantId
    ? await listRecords(LEADS_TABLE_KEY, {
        where: `(tenant_id,eq,${tenantId})`,
        sort: '-CreatedAt',
        limit: 20,
        viewId: LEADS_VIEW_ID,
      })
    : [];
  const leads = (leadsRaw as LeadRecord[]) ?? [];

  const now = Date.now();
  const todayStart = startOfToday();
  const monthStart = startOfMonth();

  const leadsToday = leads.filter((lead) => {
    if (!lead.CreatedAt) return false;
    const ts = new Date(lead.CreatedAt).getTime();
    return !Number.isNaN(ts) && ts >= todayStart && ts <= now;
  }).length;

  const leadsMonth = leads.filter((lead) => {
    if (!lead.CreatedAt) return false;
    const ts = new Date(lead.CreatedAt).getTime();
    return !Number.isNaN(ts) && ts >= monthStart && ts <= now;
  }).length;

  const bookingsPending = leads.filter((lead) => lead.intent === 'booking').length;

  return (
    <div className="container mx-auto space-y-10 p-4 md:p-8">
      <header className="space-y-2">
        <p className="text-sm text-blue-600">Dashboard</p>
        <h1 className="text-3xl font-bold tracking-tight">Bentornato, {session.user.email ?? 'utente'}!</h1>
        <p className="text-gray-500">
          Panoramica dei lead raccolti dal tuo receptionist AI e azioni rapide per gestirli.
        </p>
      </header>

      <section>
        <h2 className="text-xl font-semibold">Panoramica</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Card className="shadow-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-base font-semibold text-gray-700">Lead raccolti (oggi)</CardTitle>
              <CardDescription>Nuovi contatti generati nelle ultime 24 ore.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-semibold text-gray-900">{leadsToday}</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-base font-semibold text-gray-700">Lead raccolti (mese)</CardTitle>
              <CardDescription>Contatti generati dall’inizio del mese corrente.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-semibold text-gray-900">{leadsMonth}</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-base font-semibold text-gray-700">Prenotazioni in evidenza</CardTitle>
              <CardDescription>Lead riconosciuti come richieste di prenotazione.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-semibold text-gray-900">{bookingsPending}</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <h2 className="text-xl font-semibold">Azioni rapide</h2>
          <Card className="shadow-sm transition hover:shadow-md">
            <Link href="/dashboard/configurazione" className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
                <Settings className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-800">Configura l’assistente</p>
                <p className="text-sm text-gray-500">Aggiorna tono, settore, notifiche e prompt dinamici.</p>
              </div>
            </Link>
          </Card>
          <Card className="shadow-sm transition hover:shadow-md">
            <Link href="/chat" className="flex items-center gap-4 p-5" target="_blank">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-800">Prova la chat</p>
                <p className="text-sm text-gray-500">Interagisci con il receptionist come farebbe un cliente.</p>
              </div>
            </Link>
          </Card>
          <Card className="shadow-sm transition hover:shadow-md">
            <Link href="/dashboard/leads" className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-800">Gestisci i lead</p>
                <p className="text-sm text-gray-500">Consulta, etichetta e contatta i potenziali clienti.</p>
              </div>
            </Link>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold">Lead recenti</h2>
          <Card className="mt-4 overflow-hidden shadow-sm">
            <CardContent className="p-0">
              {leads.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-500">Ancora nessun lead registrato.</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {leads.map((lead) => (
                    <div key={lead.Id} className="flex flex-col gap-2 p-5 text-left">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-gray-800">{lead.nome || 'Contatto chat'}</p>
                        <span className="text-sm text-gray-500">{formatDate(lead.CreatedAt)}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                        <span className="rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-700">
                          Intento: {lead.intent || '—'}
                        </span>
                        <span className="rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-700">
                          Persone: {lead.persone ?? '—'}
                        </span>
                        <span className="rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-700">
                          Orario: {lead.orario ?? '—'}
                        </span>
                        <span className="rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-700">
                          Stato: {lead.stato || 'Nuovo'}
                        </span>
                      </div>
                      {lead.telefono && (
                        <p className="text-sm text-gray-700">
                          📞 <strong>Telefono:</strong> {lead.telefono}
                        </p>
                      )}
                      {lead.note_interne && (
                        <p className="text-sm text-gray-700">
                          📝 <strong>Note interne:</strong> {lead.note_interne}
                        </p>
                      )}
                      {lead.richiesta && (
                        <p className="text-sm text-gray-600 line-clamp-3">{lead.richiesta}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div className="border-t border-gray-100 bg-gray-50 p-4 text-center">
                <Link href="/dashboard/leads" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                  Vedi tutti i lead
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
