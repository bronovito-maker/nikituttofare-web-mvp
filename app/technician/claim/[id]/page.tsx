import { createServerClient } from '@/lib/supabase-server';
import { redirect, notFound } from 'next/navigation';
import { ClaimButton } from '@/components/technician/claim-button';
import { MapPin, Calendar, Clock, Banknote, AlertTriangle, UserCheck } from 'lucide-react';
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
        redirect(`/login?next=/technician/claim/${ticketId}`);
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

    // Format Date
    const dateStr = new Date(ticket.created_at).toLocaleString('it-IT', {
        day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
    });

    // Calculate generic title based on category if title is missing (schema doesn't have title)
    // Use a fallback for title since it doesn't strictly exist in the schema shown
    const displayTitle = ticket.description.split('\n')[0].substring(0, 50) + (ticket.description.length > 50 ? '...' : '');

    // Format Price
    const priceDisplay = ticket.price_range_min && ticket.price_range_max
        ? `€${ticket.price_range_min} - €${ticket.price_range_max}`
        : (ticket.price_range_max ? `Fino a €${ticket.price_range_max}` : 'Da concordare');

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
            <div className="max-w-2xl mx-auto space-y-8">

                {/* Header Section */}
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Nuova Richiesta Intervento</h1>
                    <p className="text-muted-foreground">Rivedi i dettagli e accetta il lavoro se disponibile.</p>
                </div>

                {/* Status Card */}
                {!isAvailable && !isClaimedByMe && (
                    <div className="bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                        <div>
                            <h3 className="font-semibold text-amber-900 dark:text-amber-100">Lavoro non più disponibile</h3>
                            <p className="text-sm text-amber-700 dark:text-amber-300">
                                Questo ticket è già stato assegnato a un altro tecnico o è stato cancellato.
                            </p>
                        </div>
                    </div>
                )}

                {isClaimedByMe && (
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
                )}

                {/* Main Ticket Card */}
                <div className="bg-card text-card-foreground rounded-xl border shadow-sm overflow-hidden">

                    {/* Map/Image Placeholder Area */}
                    <div className="w-full h-48 bg-slate-100 dark:bg-slate-800 relative flex items-center justify-center">
                        {ticket.photo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={ticket.photo_url}
                                alt="Problema"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="text-center text-slate-400">
                                <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <span className="text-sm font-medium">Nessuna foto allegata</span>
                            </div>
                        )}
                        <div className="absolute top-4 right-4">
                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80 uppercase">
                                {ticket.category || 'Generico'}
                            </span>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">

                        {/* Title & Description */}
                        <div>
                            <h2 className="text-2xl font-bold mb-2 capitalize">{ticket.category}: {ticket.city || 'Intervento'}</h2>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                {ticket.description || 'Nessuna descrizione fornita.'}
                            </p>
                        </div>

                        <div className="h-px bg-border" />

                        {/* Meta Details Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Località</p>
                                    <p className="font-semibold">{ticket.address || 'Indirizzo non specificato'}</p>
                                    {ticket.city && <p className="text-xs text-muted-foreground">{ticket.city}</p>}
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
                                    <Banknote className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Budget Stimato</p>
                                    <p className="font-semibold">
                                        {priceDisplay}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Data Richiesta</p>
                                    <p className="font-semibold">{dateStr}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Urgenza</p>
                                    <p className="font-semibold capitalize">{ticket.priority || 'standard'}</p>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Action Footer */}
                    {isAvailable && (
                        <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
                            <p className="text-sm text-muted-foreground text-center sm:text-left">
                                Cliccando accetti di prendere in carico questo lavoro e contattare il cliente.
                            </p>
                            <ClaimButton ticketId={ticket.id} />
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
