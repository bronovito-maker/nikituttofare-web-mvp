import { createServerClient } from '@/lib/supabase-server';
import { CustomerDashboard } from '@/components/dashboard/customer-dashboard';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  // Fetch tickets server-side
  const { data: tickets, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching tickets:', error);
  }

  return <CustomerDashboard initialTickets={tickets || []} />;
}
