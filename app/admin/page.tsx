import { createServerClient, createAdminClient } from '@/lib/supabase-server';
import { AdminDesktop } from '@/components/admin/admin-desktop';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

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

  return <AdminDesktop initialTickets={tickets || []} />;
}
