import { AdminDesktop } from '@/components/admin/admin-desktop';
import { createServerClient, createAdminClient } from '@/lib/supabase-server';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function AdminTicketsPage() {
    // Reusing the same layout for now, just filtering or showing all
    // Ideally this would filter by status but we'll reuse the main dashboard view for now
    const supabase = await createServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    const isAdmin = user?.user_metadata?.role === 'admin' || user?.email === 'bronovito@gmail.com';

    if (error || !user || !isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center space-y-4">
                <h1 className="text-4xl font-bold text-red-600">403 Forbidden</h1>
                <Button asChild variant="outline">
                    <Link href="/">Torna alla Home</Link>
                </Button>
            </div>
        );
    }

    const adminClient = createAdminClient();
    const { data: tickets } = await adminClient
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });

    return <AdminDesktop initialTickets={tickets || []} />;
}
