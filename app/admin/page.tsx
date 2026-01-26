import { createServerClient, createAdminClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  addTechnician,
  deleteTechnician,
  toggleTechnicianStatus,
  closeTicket
} from '@/app/actions/admin-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle2,
  Users,
  Ticket,
  Calendar,
  MapPin,
  User,
  Phone,
  LogOut,
  PlusCircle
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  // 🔒 SECURITY CHECK
  if (!session || session.user?.email !== 'bronovito@gmail.com') {
    return (
      <div className="flex flex-col items-center justify-center min-vh-100 p-6 text-center space-y-4">
        <h1 className="text-4xl font-bold text-red-600">403 Forbidden</h1>
        <p className="text-slate-600 dark:text-slate-400">Accesso riservato all&apos;amministrazione.</p>
        <Button asChild variant="outline">
          <Link href="/">Torna alla Home</Link>
        </Button>
      </div>
    );
  }

  const userEmail = session.user.email;

  // Use Admin Client to bypass RLS and see ALL tickets (superadmin mode)
  const adminClient = createAdminClient();

  // Data Fetching with Admin Client
  const { data: technicians } = await adminClient
    .from('technicians')
    .select('*')
    .order('created_at', { ascending: false });

  const { data: tickets, error: ticketsError } = await adminClient
    .from('tickets')
    .select('*')
    .order('created_at', { ascending: false });

  if (ticketsError) {
    console.error('Error fetching tickets:', ticketsError);
  }

  const pendingTickets = tickets?.filter(t => t.status !== 'completed') || [];
  const completedTickets = tickets?.filter(t => t.status === 'completed') || [];

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 pb-20">
      {/* Header Premium */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 max-w-7xl flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span className="text-gradient">Dashboard Amministratore</span> 🛡️
            </h1>
            <p className="text-sm text-slate-500">Bentornato, <span className="font-medium text-slate-700 dark:text-slate-300">{userEmail}</span></p>
          </div>
          <form action={async () => { 'use server'; const sb = await createServerClient(); await sb.auth.signOut(); redirect('/'); }}>
            <Button variant="ghost" className="text-slate-500 hover:text-red-500 transition-colors">
              <LogOut className="h-4 w-4 mr-2" />
              Esci
            </Button>
          </form>
        </div>
      </div>

      <main className="container mx-auto px-6 py-8 max-w-7xl">
        <Tabs defaultValue="tickets" className="space-y-8">
          <TabsList className="bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-1 rounded-xl glass">
            <TabsTrigger value="tickets" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm">
              <Ticket className="h-4 w-4 mr-2" />
              Gestione Ticket
            </TabsTrigger>
            <TabsTrigger value="technicians" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm">
              <Users className="h-4 w-4 mr-2" />
              Squadra Tecnici
            </TabsTrigger>
          </TabsList>

          {/* --- TAB TICKETS --- */}
          <TabsContent value="tickets" className="space-y-12">
            {/* Sezione Lavori in Corso */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <div className="h-8 w-1 bg-brand rounded-full"></div>
                  Lavori in Corso
                  <Badge variant="outline" className="ml-2 font-mono">{pendingTickets.length}</Badge>
                </h2>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingTickets.map((t) => (
                  <TicketCard key={t.id} ticket={t} type="pending" />
                ))}
                {pendingTickets.length === 0 && (
                  <div className="col-span-full py-12 text-center card-premium p-8 border-dashed">
                    <CheckCircle2 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">Ottimo lavoro! Non ci sono interventi in sospeso.</p>
                  </div>
                )}
              </div>
            </section>

            {/* Sezione Storico */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <div className="h-8 w-1 bg-emerald-500 rounded-full"></div>
                  Storico Lavori
                  <Badge variant="outline" className="ml-2 font-mono">{completedTickets.length}</Badge>
                </h2>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-80">
                {completedTickets.map((t) => (
                  <TicketCard key={t.id} ticket={t} type="completed" />
                ))}
                {completedTickets.length === 0 && (
                  <div className="col-span-full py-8 text-center text-slate-400">
                    Nessun lavoro completato finora.
                  </div>
                )}
              </div>
            </section>
          </TabsContent>

          {/* --- TAB TECNICI --- */}
          <TabsContent value="technicians">
            <div className="grid lg:grid-cols-12 gap-8">
              {/* Form Aggiunta */}
              <div className="lg:col-span-4 space-y-6">
                <Card className="card-premium h-fit shadow-md border-slate-200/60 overflow-hidden">
                  <div className="h-2 bg-gradient-to-r from-blue-600 to-cyan-500"></div>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PlusCircle className="h-5 w-5 text-blue-600" />
                      Aggiungi Tecnico
                    </CardTitle>
                    <CardDescription>Inserisci i dettagli per abilitare un nuovo collaboratore.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form action={async (formData) => {
                      'use server';
                      await addTechnician({
                        name: formData.get('name') as string,
                        phone: formData.get('phone') as string,
                        skills: formData.get('skills') as string,
                      });
                    }} className="space-y-5">
                      <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nome Completo</label>
                        <Input id="name" name="name" placeholder="Mario Rossi" required className="rounded-xl border-slate-200" />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="phone" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Cellulare (WhatsApp/SMS)</label>
                        <Input id="phone" name="phone" placeholder="+393331234567" required className="rounded-xl border-slate-200" />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="skills" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Competenze (separate da virgola)</label>
                        <Input id="skills" name="skills" placeholder="idraulico, caldaie, spurghi" className="rounded-xl border-slate-200" />
                      </div>
                      <Button type="submit" className="w-full btn-primary shadow-lg shadow-blue-500/20">
                        Registra Tecnico
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Lista Tecnici */}
              <div className="lg:col-span-8 space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  {technicians?.map((tech) => (
                    <Card key={tech.id} className="card-premium border-slate-200/60 shadow-sm hover:translate-y-[-2px] transition-all">
                      <CardContent className="p-5 flex justify-between items-start">
                        <div className="space-y-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-slate-900 dark:text-white">{tech.name}</h3>
                              <Badge className={tech.is_active ? "bg-emerald-500/10 text-emerald-600 border-emerald-200/50" : "bg-red-500/10 text-red-600 border-red-200/50"}>
                                {tech.is_active ? 'Attivo' : 'Sospeso'}
                              </Badge>
                            </div>
                            <p className="text-sm font-mono text-slate-500 flex items-center gap-1.5">
                              <Phone className="h-3 w-3" />
                              {tech.phone}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {tech.skills?.map((s: string) => (
                              <Badge key={s} variant="secondary" className="px-2 py-0 text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-none">
                                {s}
                              </Badge>
                            ))}
                          </div>

                          <div className="flex gap-2 pt-1">
                            <form action={toggleTechnicianStatus.bind(null, tech.id, tech.is_active)}>
                              <Button size="sm" variant="outline" className="text-xs h-8 px-3 rounded-lg border-slate-200 hover:bg-slate-50">
                                {tech.is_active ? 'Sospendi' : 'Riattiva'}
                              </Button>
                            </form>
                            <form action={deleteTechnician.bind(null, tech.id)}>
                              <Button size="sm" variant="ghost" className="text-xs h-8 px-3 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50">
                                Elimina
                              </Button>
                            </form>
                          </div>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                          <User className="h-5 w-5" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {technicians?.length === 0 && (
                    <div className="col-span-full py-12 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200 text-slate-400">
                      Nessun tecnico registrato.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function TicketCard({ ticket, type }: { readonly ticket: any, readonly type: 'pending' | 'completed' }) {
  const isUrgent = ticket.priority === 'high' || ticket.priority === 'critical';

  let statusBadgeClass = 'badge-success';
  if (type === 'pending') {
    statusBadgeClass = isUrgent ? 'badge-urgent' : 'badge-info';
  }

  let locationDisplay = 'Località non specificata';
  if (ticket.city) {
    locationDisplay = ticket.address ? `${ticket.city}, ${ticket.address}` : ticket.city;
  }

  return (
    <Card className={`card-premium overflow-hidden border-slate-200/60 flex flex-col h-full ${type === 'completed' ? 'grayscale-[0.3]' : ''}`}>
      {/* Visual Priority Indicator */}
      {type === 'pending' && isUrgent && <div className="h-1 bg-orange-500"></div>}

      <CardHeader className="p-5 pb-3">
        <div className="flex justify-between items-start gap-3 mb-2">
          <Badge className={statusBadgeClass}>
            {ticket.status.toUpperCase()}
          </Badge>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
            #{ticket.id.slice(0, 6)}
          </span>
        </div>
        <CardTitle className="text-lg font-bold leading-tight group-hover:text-blue-600 transition-colors">
          {ticket.category || 'Intervento Tecnico'}
        </CardTitle>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
          <Calendar className="h-3 w-3" />
          {new Date(ticket.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-0 flex-grow space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 italic">
          &quot;{ticket.description}&quot;
        </p>

        <div className="space-y-2 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
            <User className="h-3.5 w-3.5 text-slate-400" />
            <span className="truncate">{ticket.customer_name || 'Utente'}</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <MapPin className="h-3.5 w-3.5 text-slate-400" />
            <span className="truncate">
              {locationDisplay}
            </span>
          </div>
          {ticket.contact_phone && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Phone className="h-3.5 w-3.5 text-slate-400" />
              <span>{ticket.contact_phone}</span>
            </div>
          )}
        </div>

        {type === 'pending' && (
          <form action={closeTicket.bind(null, ticket.id)} className="mt-auto pt-2">
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 rounded-xl py-6 font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]">
              <CheckCircle2 className="h-5 w-5" />
              Concludi Lavoro
            </Button>
          </form>
        )}
      </CardContent>
    </Card >
  );
}
