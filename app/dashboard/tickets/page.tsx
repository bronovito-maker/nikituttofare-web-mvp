import { createServerClient } from '@/lib/supabase-server';
import { TicketsList } from '@/components/dashboard/tickets-list';
import { redirect } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { MobileNav } from '@/components/dashboard/mobile-nav';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default async function TicketsPage() {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        redirect('/login');
    }

    // Fetch tickets server-side
    const { data: tickets, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching tickets:', error);
    }

    return (
        <div className="min-h-screen bg-background text-foreground pb-24 md:pb-8">
            <DashboardHeader />

            <main className="container mx-auto max-w-5xl px-4 md:px-6 pt-24 space-y-8">
                <div className="flex flex-col gap-4">
                    <Button variant="ghost" className="w-fit pl-0 hover:bg-transparent hover:text-primary transition-colors" asChild>
                        <Link href="/dashboard">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Torna alla Dashboard
                        </Link>
                    </Button>
                    <div className="flex flex-col gap-2">
                        <h1 className="text-3xl font-bold tracking-tight">I Miei Interventi</h1>
                        <p className="text-muted-foreground">
                            Gestisci le tue richieste d&apos;intervento e controlla lo stato dei lavori.
                        </p>
                    </div>
                </div>

                <TicketsList tickets={tickets as any || []} />
            </main>

            <MobileNav />
        </div>
    );
}
