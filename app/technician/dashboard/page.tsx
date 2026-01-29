import { createServerClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Briefcase, User, Calendar } from 'lucide-react';

export default async function TechnicianDashboard() {
    const supabase = await createServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('/technician/login');
    }

    // Fetch Technician Profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (!profile || profile.role !== 'technician') {
        redirect('/dashboard');
    }

    // Count pending tickets in technician's city? (Simplification for MVP: Just count all 'pending_verification' or 'new')
    // For a real app, we'd filter by city.
    const { count: pendingCount } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending_verification');

    // Count active jobs (assigned to this technician and not resolved)
    const { count: activeJobsCount } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_technician_id', user.id)
        .neq('status', 'resolved');

    return (
        <div className="flex-1 p-4 md:p-8 pt-6 max-w-4xl mx-auto w-full space-y-8 animate-in slide-in-from-bottom-2 duration-500">

            {/* Welcome Section */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight text-white">Ciao, {profile.full_name?.split(' ')[0]}</h2>
                    <p className="text-slate-400">Ecco il riepilogo della tua attività.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant={profile.is_active ? 'default' : 'secondary'} className={profile.is_active ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700'}>
                        {profile.is_active ? 'In Servizio' : 'Offline'}
                    </Badge>
                </div>
            </div>

            {/* Status Summary */}
            <section className="grid grid-cols-2 gap-4">
                <Card className="bg-[#1E1E1E] border-[#333] shadow-md">
                    <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                        <span className="text-4xl font-bold text-orange-500 mb-2">{activeJobsCount || 0}</span>
                        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Interventi Attivi</span>
                    </CardContent>
                </Card>
                <Card className="bg-[#1E1E1E] border-[#333] shadow-md">
                    <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                        <span className="text-4xl font-bold text-emerald-400 mb-2">{profile.loyalty_points || 0}</span>
                        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Punti / Rating</span>
                    </CardContent>
                </Card>
            </section>

            {/* Action Grid */}
            <section className="space-y-4">
                <h3 className="text-lg font-semibold text-white px-1">Azioni Rapide</h3>

                <div className="grid gap-4 md:grid-cols-2">
                    {/* 1. Nuovi Lavori (Claim) */}
                    <Link href="/technician/claim" className="block md:col-span-2">
                        <Card className="border-orange-500/20 bg-orange-500/5 hover:bg-orange-500/10 transition-colors group">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-lg font-semibold text-orange-500 group-hover:underline decoration-orange-500/50 underline-offset-4 transition-all">Nuovi Lavori</CardTitle>
                                <MapPin className="w-5 h-5 text-orange-500" />
                            </CardHeader>
                            <CardContent>
                                <CardDescription className="text-slate-300 font-medium">
                                    Ci sono <span className="text-orange-500 font-bold text-lg">{pendingCount}</span> richieste in attesa nella tua zona.
                                </CardDescription>
                                <div className="mt-4 flex justify-end">
                                    <Button size="sm" className="shadow-sm bg-orange-600 hover:bg-orange-500 text-white border-0">
                                        Cerca Lavori <ArrowRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    {/* 2. I Miei Interventi */}
                    <Link href="/technician/jobs" className="block">
                        <Card className="bg-[#1E1E1E] border-[#333] hover:border-orange-500/50 transition-colors h-full group">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-lg font-semibold text-white group-hover:text-orange-400 transition-colors">I Miei Interventi</CardTitle>
                                <Briefcase className="w-5 h-5 text-slate-400 group-hover:text-orange-400 transition-colors" />
                            </CardHeader>
                            <CardContent>
                                <CardDescription className="text-slate-400">
                                    Gestisci e chiudi i lavori che hai preso in carico.
                                </CardDescription>
                            </CardContent>
                        </Card>
                    </Link>

                    {/* 3. Profilo */}
                    <div className="grid grid-cols-2 gap-4">
                        <Link href="/technician/profile" className="block h-full">
                            <Card className="bg-[#1E1E1E] border-[#333] hover:border-orange-500/50 transition-colors h-full">
                                <CardContent className="p-4 flex flex-col items-center justify-center gap-2 h-full py-8">
                                    <User className="w-8 h-8 text-slate-400" />
                                    <span className="text-sm font-medium text-white">Profilo</span>
                                </CardContent>
                            </Card>
                        </Link>
                        <Link href="#" className="block h-full cursor-not-allowed opacity-60">
                            <Card className="h-full bg-[#1a1a1a] border border-[#333] border-dashed">
                                <CardContent className="p-4 flex flex-col items-center justify-center gap-2 h-full py-8">
                                    <Calendar className="w-8 h-8 text-slate-600" />
                                    <span className="text-sm font-medium text-slate-500">Turni</span>
                                </CardContent>
                            </Card>
                        </Link>
                    </div>

                </div>
            </section>
        </div>
    );
}

function ArrowRight({ className }: Readonly<{ className?: string }>) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
        </svg>
    )
}
