import { createServerClient } from '@/lib/supabase-server';
import { redirect, notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, FileText, MapPin, Wrench, ShieldCheck, Clock } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface PageProps {
    params: {
        id: string;
    };
}

export default async function AssetPassportPage({ params }: PageProps) {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Fetch Asset Details
    const { data: asset, error: assetError } = await supabase
        .from('user_assets')
        .select('*')
        .eq('id', params.id)
        .eq('user_id', user.id)
        .single();

    if (assetError || !asset) {
        notFound();
    }

    // Fetch Maintenance History (Resolved Tickets linked to this asset)
    const { data: history } = await supabase
        .from('tickets')
        .select('*')
        .eq('asset_id', params.id)
        .eq('status', 'resolved')
        .order('completed_at', { ascending: false });

    return (
        <div className="container py-8 max-w-4xl min-h-screen">
            {/* Header / Nav */}
            <div className="mb-8">
                <Button variant="ghost" asChild className="pl-0 hover:bg-transparent text-muted-foreground hover:text-foreground mb-4">
                    <Link href="/dashboard/assets">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Torna agli Immobili
                    </Link>
                </Button>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <ShieldCheck className="w-6 h-6 text-white" />
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight text-white">Digital Passport</h1>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            <span>{asset.address}, {asset.city}</span>
                        </div>
                    </div>
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20">
                        <Wrench className="w-4 h-4 mr-2" />
                        Richiedi Intervento Qui
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Left Column: Asset Stats */}
                <div className="md:col-span-1 space-y-6">
                    <Card className="bg-[#121212] border-white/10 overflow-hidden">
                        <CardHeader className="bg-white/5 pb-4">
                            <CardTitle className="text-sm font-medium text-slate-400">Stato Salute</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-2xl font-bold text-white">Ottimo</span>
                                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">A+</Badge>
                            </div>
                            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 w-[95%]" />
                            </div>
                            <p className="text-xs text-slate-500 mt-4 flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" />
                                Nessun problema rilevato
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-[#121212] border-white/10">
                        <CardHeader>
                            <CardTitle className="text-sm font-medium text-slate-400">Dettagli Tecnici</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Tipologia</p>
                                <p className="text-sm text-slate-200">Residenziale / Appartamento</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Note</p>
                                <p className="text-sm text-slate-200 italic">
                                    {asset.notes ? `"${asset.notes}"` : "Nessuna nota"}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Aggiunto il</p>
                                <p className="text-sm text-slate-200">
                                    {format(new Date(asset.created_at), 'd MMMM yyyy', { locale: it })}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Timeline */}
                <div className="md:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-white">Storico Manutenzioni</h2>
                        <Badge variant="outline" className="border-white/10 text-slate-400">
                            {history?.length || 0} Interventi
                        </Badge>
                    </div>

                    <div className="space-y-4">
                        {!history || history.length === 0 ? (
                            <div className="text-center py-12 border border-dashed border-white/10 rounded-xl bg-white/5">
                                <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Clock className="w-6 h-6 text-slate-500" />
                                </div>
                                <h3 className="text-slate-200 font-medium">Nessuno storico disponibile</h3>
                                <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">
                                    Gli interventi completati per questo immobile appariranno qui.
                                </p>
                            </div>
                        ) : (
                            history.map((ticket) => (
                                <div key={ticket.id} className="relative pl-6 pb-6 last:pb-0 border-l border-white/10 group">
                                    <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-[#0f0f0f] group-hover:scale-110 transition-transform" />

                                    <div className="bg-[#121212] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 className="font-semibold text-slate-200 text-sm">
                                                    {(() => {
                                                        switch (ticket.category) {
                                                            case 'plumbing': return 'Intervento Idraulico';
                                                            case 'electrician': return 'Intervento Elettrico';
                                                            default: return 'Manutenzione Generica';
                                                        }
                                                    })()}
                                                </h4>
                                                <p className="text-xs text-slate-500">
                                                    {ticket.completed_at && format(new Date(ticket.completed_at), 'd MMMM yyyy, HH:mm', { locale: it })}
                                                </p>
                                            </div>
                                            <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px]">
                                                RISOLTO
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-slate-400 leading-relaxed">
                                            {ticket.description}
                                        </p>

                                        {ticket.price_range_min && (
                                            <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2 text-xs text-slate-500">
                                                <FileText className="w-3 h-3" />
                                                <span>Fattura non disponibile</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
