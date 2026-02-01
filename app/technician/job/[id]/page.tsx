import { createServerClient } from '@/lib/supabase-server'
import { TechnicianJobActions } from '@/components/technician/job-actions';
import { TicketDetailView } from '@/components/technician/ticket-detail-view';
import { AlertTriangle, UserCheck } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation'

export default async function JobDetailPage({ params }: { params: Promise<Readonly<{ id: string }>> }) {
    const supabase = await createServerClient()
    const { id } = await params

    // 1. Auth Check (con redirect corretto a /technician/login)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return redirect(`/technician/login?next=/technician/job/${id}`)

    // 2. Fetch Job Details
    const { data: ticket, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', id)
        .single()

    if (error || !ticket) {
        return (
            <div className="min-h-screen bg-[#121212] text-white flex items-center justify-center p-4">
                <div className="text-center">
                    <h1 className="text-xl font-bold mb-2">Lavoro non trovato</h1>
                    <p className="text-gray-400 mb-4">Questo incarico potrebbe essere stato cancellato o rimosso.</p>
                    <Link href="/technician/claim" className="text-emerald-400 hover:underline">Torna alla lista</Link>
                </div>
            </div>
        )
    }

    // 3. Context Messages
    const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .eq('ticket_id', id)
        .order('created_at', { ascending: true })
        .limit(5)

    const isAssignedToMe = ticket.assigned_technician_id === user.id
    const isAvailable = !ticket.assigned_technician_id
    const isAssignedToOther = ticket.assigned_technician_id && !isAssignedToMe

    // 4. Prepare Slots
    let banner = null;
    let action = null;

    if (isAssignedToMe) {
        banner = (
            <div className="bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 flex items-start gap-3">
                <UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                <div>
                    <h3 className="font-semibold text-emerald-900 dark:text-emerald-100">Incarico Attivo</h3>
                    <p className="text-sm text-emerald-700 dark:text-emerald-300">
                        Sei responsabile di questo intervento.
                    </p>
                </div>
            </div>
        );
        // Actions for assigned job (e.g. Complete, Note) could go here or remain in TechnicianJobActions if it supports it?
        // TechnicianJobActions seems to be for "claim"?
        // Let's assume for now we just show the banner.
    } else if (isAssignedToOther) {
        banner = (
            <div className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
                <p className="text-red-900 dark:text-red-100 font-medium">Assegnato ad altro tecnico</p>
            </div>
        );
    } else if (isAvailable) {
        action = <TechnicianJobActions ticketId={id} />;
    }

    return (
        <TicketDetailView
            ticket={ticket}
            messages={messages || []}
            bannerSlot={banner}
            actionSlot={action}
            backLink="/technician/jobs"
            showCustomerDetails={isAssignedToMe}
        />
    );
}
