import { createServerClient, createAdminClient } from '@/lib/supabase-server';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Ticket, Users, MapPin } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const supabase = await createServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  // 🔒 SECURITY CHECK
  if (error || !user || user?.email !== 'bronovito@gmail.com') {
    return (
      <div className="flex flex-col items-center justify-center min-vh-100 p-6 text-center space-y-4">
        <h1 className="text-4xl font-bold text-red-600">403 Forbidden</h1>
        <p className="text-muted-foreground">Accesso riservato all&apos;amministrazione.</p>
        <Button asChild variant="outline">
          <Link href="/">Torna alla Home</Link>
        </Button>
      </div>
    );
  }

  // Use Admin Client to bypass RLS and see ALL tickets (superadmin mode)
  const adminClient = createAdminClient();

  // Data Fetching with Admin Client
  const { data: tickets, error: ticketsError } = await adminClient
    .from('tickets')
    .select('*')
    .order('created_at', { ascending: false });

  if (ticketsError) {
    console.error('Error fetching tickets:', ticketsError);
  }

  // Calculate stats
  const ticketCount = tickets?.length || 0;
  // We can fetch technicians count too if needed, for now just show ticket stats
  const activeTickets = tickets?.filter(t => ['open', 'in_progress', 'assigned', 'pending'].includes(t.status || '')).length || 0;
  const completedTickets = tickets?.filter(t => ['resolved', 'closed', 'completed'].includes(t.status || '')).length || 0;

  return (
    <div className="p-6 md:p-8 pt-16 md:pt-8 bg-background min-h-full">
      <h1 className="text-3xl font-bold text-foreground mb-6">Dashboard Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
          <h3 className="text-muted-foreground font-medium mb-2">Ticket Totali</h3>
          <p className="text-4xl font-black text-foreground">{ticketCount}</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
          <h3 className="text-emerald-600 dark:text-emerald-400 font-medium mb-2">Ticket Attivi</h3>
          <p className="text-4xl font-black text-foreground">{activeTickets}</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
          <h3 className="text-blue-600 dark:text-blue-400 font-medium mb-2">Ticket Completati</h3>
          <p className="text-4xl font-black text-foreground">{completedTickets}</p>
        </div>
      </div>



      <div className="mt-8">
        <h2 className="text-xl font-bold text-foreground mb-4">Azioni Rapide</h2>
        <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
          <Button asChild className="gap-2">
            <Link href="/admin/tickets">
              <Ticket className="w-4 h-4" />
              Gestisci Ticket
            </Link>
          </Button>

          <Button asChild variant="secondary" className="gap-2">
            <Link href="/admin/leads">
              <MapPin className="w-4 h-4" />
              CRM Leads
            </Link>
          </Button>

          <Button asChild variant="outline" className="gap-2 hover:bg-secondary">
            <Link href="/admin/technicians">
              <Users className="w-4 h-4" />
              Visualizza Tecnici
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
