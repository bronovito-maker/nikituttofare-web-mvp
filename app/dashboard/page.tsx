import { auth } from '@/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { MessageSquare, Settings, Users } from 'lucide-react';
import { redirect } from 'next/navigation';

const statsDiEsempio = [
  {
    label: 'Lead raccolti (oggi)',
    description: 'Nuovi contatti generati nelle ultime 24 ore.',
    value: 5,
  },
  {
    label: 'Lead raccolti (mese)',
    description: 'Contatti generati dall’inizio del mese.',
    value: 48,
  },
  {
    label: 'Conversazioni totali',
    description: 'Dialoghi gestiti dal receptionist AI.',
    value: 212,
  },
];

const leadRecentiDiEsempio = [
  {
    id: 'lead-1',
    nome: 'Mario Rossi',
    richiesta: 'Vorrei informazioni su un tagliando completo per la mia bici da corsa.',
    data: 'Oggi',
  },
  {
    id: 'lead-2',
    nome: 'Laura Bianchi',
    richiesta: 'È possibile prenotare un tavolo per 2 persone alle 20?',
    data: 'Oggi',
  },
  {
    id: 'lead-3',
    nome: 'Paolo Verdi',
    richiesta: 'Quali sono gli orari di apertura nel weekend?',
    data: 'Ieri',
  },
];

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto space-y-10 p-4 md:p-8">
      <header className="space-y-2">
        <p className="text-sm text-blue-600">Dashboard</p>
        <h1 className="text-3xl font-bold tracking-tight">Bentornato, {session?.user?.email ?? 'utente'}!</h1>
        <p className="text-gray-500">
          Tieni d&apos;occhio le performance del tuo receptionist AI: contatti generati, conversazioni e azioni rapide.
        </p>
      </header>

      <section>
        <h2 className="text-xl font-semibold">Panoramica</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {statsDiEsempio.map((stat) => (
            <Card key={stat.label} className="shadow-sm">
              <CardHeader className="space-y-1">
                <CardTitle className="text-base font-semibold text-gray-700">{stat.label}</CardTitle>
                <CardDescription>{stat.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-semibold text-gray-900">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
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
                <p className="text-sm text-gray-500">Aggiorna tono di voce, prompt e informazioni operative.</p>
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
                <p className="text-sm text-gray-500">Interagisci con il tuo receptionist come farebbe un cliente.</p>
              </div>
            </Link>
          </Card>
          <Card className="shadow-sm transition hover:shadow-md">
            <Link href="/dashboard/lead" className="flex items-center gap-4 p-5">
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
              <div className="divide-y divide-gray-100">
                {leadRecentiDiEsempio.map((lead) => (
                  <div key={lead.id} className="flex flex-col gap-2 p-5 text-left">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-gray-800">{lead.nome}</p>
                      <span className="text-sm text-gray-500">{lead.data}</span>
                    </div>
                    <p className="text-sm text-gray-600">{lead.richiesta}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 bg-gray-50 p-4 text-center">
                <Link href="/dashboard/lead" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
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
