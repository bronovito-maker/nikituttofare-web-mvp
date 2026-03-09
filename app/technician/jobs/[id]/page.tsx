'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AssistantChat from '@/components/technician/AssistantChat';
import InventoryManager from '@/components/technician/InventoryManager';
import { ExtendedTicket } from '@/lib/types/internal-app';
import { createBrowserClient } from '@/lib/supabase-browser';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Phone, Navigation, Clock, CheckCircle2, AlertCircle, Euro, CreditCard, ChevronLeft } from 'lucide-react';

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [job, setJob] = useState<ExtendedTicket | null>(null);
    const [loading, setLoading] = useState(true);
    const [isClosing, setIsClosing] = useState(false);
    const supabase = createBrowserClient();

    useEffect(() => {
        const fetchJob = async () => {
            const { data, error } = await supabase
                .from('tickets')
                .select('*')
                .eq('id', id)
                .single();

            if (data) setJob(data as ExtendedTicket);
            setLoading(false);
        };
        fetchJob();
    }, [id, supabase]);

    const handleCloseJob = async () => {
        const amount = (document.getElementById('paymentAmount') as HTMLInputElement)?.value;
        const method = (document.getElementById('paymentMethod') as HTMLSelectElement)?.value;

        if (!confirm(`Confermi la chiusura dell'intervento con incasso di €${amount || '0'}?`)) return;

        try {
            setIsClosing(true);
            const res = await fetch('/api/technician/close-job', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ticketId: job?.id,
                    summary: 'Intervento completato dal tecnico.',
                    actualPaymentAmount: amount ? parseFloat(amount) : 0,
                    paymentMethod: method
                })
            });

            if (res.ok) {
                router.push('/technician/jobs');
            } else {
                alert('Errore durante la chiusura del lavoro.');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsClosing(false);
        }
    };

    if (loading) return (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
        </div>
    );

    if (!job) return (
        <div className="flex-1 p-8 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto opacity-50" />
            <h2 className="text-xl font-bold">Intervento non trovato</h2>
            <Button variant="outline" onClick={() => router.back()}>Torna indietro</Button>
        </div>
    );

    return (
        <div className="flex-1 p-4 md:p-8 pt-6 max-w-5xl mx-auto w-full space-y-8 animate-in fade-in duration-500">

            {/* Header / Back */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.back()}
                    className="h-11 w-11 rounded-2xl hover:bg-accent/10 border border-white/5"
                >
                    <ChevronLeft className="w-6 h-6" />
                </Button>
                <div>
                    <div className="flex items-center gap-2 mb-0.5">
                        <Badge variant="outline" className="bg-blue-600/10 text-blue-600 border-0 uppercase text-[9px] font-black tracking-widest px-2 py-0.5 rounded-md">
                            {job.category}
                        </Badge>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">#{job.id.slice(0, 8)}</span>
                    </div>
                    <h1 className="text-2xl font-black tracking-tight">{job.customer_name}</h1>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Maps & Phone Quick Actions */}
                    <div className="grid grid-cols-2 gap-4">
                        <Button
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-16 rounded-3xl shadow-lg shadow-emerald-500/20 gap-3 group"
                            onClick={() => window.open(`tel:${job.contact_phone}`)}
                        >
                            <Phone className="w-5 h-5 group-hover:animate-bounce" />
                            <span className="text-lg">Chiama</span>
                        </Button>
                        <Button
                            variant="secondary"
                            className="bg-card border border-white/5 text-foreground font-bold h-16 rounded-3xl gap-3 shadow-lg group"
                            onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.address + ' ' + job.city)}`)}
                        >
                            <Navigation className="w-5 h-5 text-blue-500 group-hover:translate-x-1 transition-transform" />
                            <span className="text-lg">Mappa</span>
                        </Button>
                    </div>

                    {/* Descrizione Card */}
                    <Card className="bg-card/40 backdrop-blur-sm border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
                        <CardHeader className="p-8 pb-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-blue-600/10 flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-blue-600" />
                                </div>
                                <CardTitle className="text-xl font-bold">Dettagli Intervento</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 pt-6 space-y-6">
                            <div className="p-5 rounded-3xl bg-accent/5 border border-white/5 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                                {job.description}
                            </div>
                            <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground/60 px-2">
                                <div className="flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5" />
                                    {job.address}, {job.city}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* AI Chat */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-black tracking-tight flex items-center gap-2 px-2">
                            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                            Niki AI Assistant
                        </h3>
                        <AssistantChat ticketId={job.id} />
                    </div>

                    {/* Inventory */}
                    <InventoryManager
                        tenantId={job.tenant_id}
                        jobId={job.id}
                        technicianId={job.assigned_technician_id || job.created_by_technician_id || ''}
                    />
                </div>

                {/* Sidebar Actions */}
                <div className="space-y-6">
                    <Card className="bg-gradient-to-b from-blue-600/10 to-transparent border-white/5 rounded-[2.5rem] shadow-2xl sticky top-24">
                        <CardHeader className="p-8 pb-4">
                            <CardTitle className="text-lg font-bold">Chiusura Intervento</CardTitle>
                            <CardDescription>Inserisci i dettagli del pagamento per completare il lavoro.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 pt-0 space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Importo Incassato (€)</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-blue-500 transition-colors">
                                            <Euro className="w-5 h-5" />
                                        </div>
                                        <input
                                            type="number"
                                            id="paymentAmount"
                                            placeholder="0.00"
                                            className="w-full bg-accent/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Metodo di Pagamento</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-blue-500 transition-colors">
                                            <CreditCard className="w-5 h-5" />
                                        </div>
                                        <select
                                            id="paymentMethod"
                                            className="w-full bg-accent/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all appearance-none"
                                        >
                                            <option value="cash">Contanti</option>
                                            <option value="card">Carta / POS</option>
                                            <option value="bank_transfer">Bonifico</option>
                                            <option value="other">Altro</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <Button
                                className={cn(
                                    "w-full h-16 rounded-3xl font-black text-lg gap-3 transition-all",
                                    job.status === 'resolved'
                                        ? "bg-muted text-muted-foreground cursor-not-allowed"
                                        : "bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-600/20 active:scale-95"
                                )}
                                disabled={isClosing || job.status === 'resolved'}
                                onClick={handleCloseJob}
                            >
                                {isClosing ? (
                                    <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                ) : job.status === 'resolved' ? (
                                    <>
                                        <CheckCircle2 className="w-6 h-6" />
                                        Completato
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-6 h-6" />
                                        Chiudi Lavoro
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Quick Notes Card */}
                    <Card className="bg-card/40 border-white/5 rounded-[2rem] p-6 shadow-xl">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 block px-1">Note Tecniche Rapide</label>
                        <textarea
                            className="w-full bg-accent/5 border border-white/5 rounded-2xl p-4 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500/50 min-h-[100px] resize-none"
                            placeholder="Aggiungi appunti personali per questo lavoro..."
                        ></textarea>
                    </Card>
                </div>
            </div>
        </div>
    );
}
