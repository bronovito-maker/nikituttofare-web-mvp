import { createServerClient } from '@/lib/supabase-server';
import { redirect, notFound } from 'next/navigation';
import { ClaimButton } from '@/components/technician/claim-button';
import { AlertTriangle, UserCheck } from 'lucide-react';
import { TicketDetailView } from '@/components/technician/ticket-detail-view';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

interface PageProps {
    params: {
        id: string;
    };
}

export default async function ClaimPage({ params }: PageProps) {
    const supabase = await createServerClient();
    const ticketId = params.id;

    // 1. Auth & Role Check
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        // Redirect to login with callback to this page
        redirect(`/technician/login?next=/technician/claim/${ticketId}`);
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!profile || profile.role !== 'technician') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
                <AlertTriangle className="w-16 h-16 text-yellow-500 mb-4" />
                <h1 className="text-2xl font-bold mb-2">Accesso Negato</h1>
                <p className="text-muted-foreground mb-6">
                    Solo i tecnici verificati possono accedere a questa pagina.
                </p>
                <Button asChild>
                    <Link href="/">Torna alla Home</Link>
                </Button>
            </div>
        );
    }

    // 2. Fetch Ticket Details
    const { data: ticket, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', ticketId)
        .single();

    if (error || !ticket) {
        return notFound();
    }

    // 3. Determine View State
    const isAvailable = !ticket.assigned_technician_id && !['completed', 'cancelled', 'in_progress', 'assigned'].includes(ticket.status);
    const isClaimedByMe = ticket.assigned_technician_id === user.id;

    // 4. Prepare Slots
    let banner = null;

    if (!isAvailable && !isClaimedByMe) {
        banner = (
            <div className="bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <div>
                    <h3 className="font-semibold text-amber-900 dark:text-amber-100">Lavoro non più disponibile</h3>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                        Questo ticket è già stato assegnato a un altro tecnico o è stato cancellato.
                    </p>
                </div>
            </div>
        );
    } else if (isClaimedByMe) {
        banner = (
            <div className="bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 flex items-start gap-3">
                <UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                <div>
                    <h3 className="font-semibold text-emerald-900 dark:text-emerald-100">Hai assegnato questo lavoro</h3>
                    <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-2">
                        Puoi gestirlo dalla tua dashboard.
                    </p>
                    <Button asChild size="sm" variant="outline" className="border-emerald-200 hover:bg-emerald-200 dark:border-emerald-700 dark:hover:bg-emerald-800">
                        <Link href="/technician/dashboard">Vai alla Dashboard</Link>
                    </Button>
                </div>
            </div>
        );
    }

    const action = isAvailable ? (
        <>
            <p className="text-sm text-muted-foreground text-center sm:text-left flex-1">
                Cliccando accetti di prendere in carico questo lavoro e contattare il cliente.
            </p>
            <ClaimButton ticketId={ticket.id} />
        </>
    ) : null;

    return (
        <TicketDetailView
            ticket={ticket as any}
            bannerSlot={banner}
            actionSlot={action}
            backLink="/technician/claim"
        />
    );
}
