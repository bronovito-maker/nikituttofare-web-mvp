'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getMyJobs } from '@/app/actions/technician-actions';
import { ExtendedTicket } from '@/lib/types/internal-app';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Briefcase, Plus } from 'lucide-react';

export default function TechnicianJobsPage() {
    const [jobs, setJobs] = useState<ExtendedTicket[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const data = await getMyJobs();
                setJobs(data);
            } catch (error) {
                console.error('Error fetching jobs:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchJobs();
    }, []);

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                <p className="text-muted-foreground font-medium animate-pulse">Caricamento interventi...</p>
            </div>
        );
    }

    return (
        <div className="flex-1 p-4 md:p-8 pt-6 max-w-7xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tighter text-foreground sm:text-4xl">
                        I Miei <span className="text-blue-600">Interventi</span>
                    </h1>
                    <p className="text-muted-foreground text-sm font-medium">
                        Gestisci la tua agenda e i lavori in corso.
                    </p>
                </div>
                <Link href="/technician/new-job">
                    <Button className="bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 h-12 px-6 gap-2">
                        <Plus className="w-5 h-5" />
                        Nuovo Lavoro
                    </Button>
                </Link>
            </div>

            {jobs.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {jobs.map((job) => (
                        <Link key={job.id} href={`/technician/jobs/${job.id}`} className="group">
                            <Card className="h-full bg-card/40 backdrop-blur-sm border-white/20 hover:border-blue-600/30 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-600/10 rounded-[2rem] overflow-hidden flex flex-col group-hover:-translate-y-1">
                                <CardHeader className="pb-3 relative">
                                    <div className="absolute top-0 right-0 p-4">
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "capitalize font-bold px-3 py-1 rounded-full border-0 shadow-sm",
                                                job.status === 'resolved' ? "bg-emerald-500/10 text-emerald-500" :
                                                    job.status === 'in_progress' ? "bg-blue-500/10 text-blue-500" :
                                                        "bg-orange-500/10 text-orange-500"
                                            )}
                                        >
                                            {job.status.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                    <CardTitle className="text-xl font-bold line-clamp-1 group-hover:text-blue-600 transition-colors pt-4">
                                        {job.customer_name || 'Intervento senza nome'}
                                    </CardTitle>
                                    <CardDescription className="line-clamp-2 text-muted-foreground/80 leading-relaxed min-h-[40px]">
                                        {job.description}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 flex-1">
                                    <div className="flex flex-col gap-2.5">
                                        <div className="flex items-center gap-2.5 text-xs font-semibold text-muted-foreground bg-accent/5 p-2 rounded-xl border border-white/5">
                                            <div className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center">
                                                <MapPin className="w-4 h-4 text-blue-600" />
                                            </div>
                                            <span className="truncate">{job.address}</span>
                                        </div>
                                        <div className="flex items-center gap-2.5 text-xs font-semibold text-muted-foreground bg-accent/5 p-2 rounded-xl border border-white/5">
                                            <div className="w-8 h-8 rounded-lg bg-amber-600/10 flex items-center justify-center">
                                                <Calendar className="w-4 h-4 text-amber-600" />
                                            </div>
                                            <span>
                                                {job.scheduled_at
                                                    ? new Date(job.scheduled_at).toLocaleString('it-IT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                                    : new Date(job.created_at).toLocaleString('it-IT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                                <div className="p-6 pt-0 mt-auto">
                                    <Button variant="outline" className="w-full border-blue-600/20 hover:bg-blue-600 hover:text-white font-bold rounded-2xl transition-all">
                                        Vedi Dettagli
                                    </Button>
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            ) : (
                <Card className="border-dashed border-2 border-white/5 bg-accent/5 rounded-[3rem] p-12 lg:p-24 flex flex-col items-center justify-center text-center">
                    <div className="w-24 h-24 rounded-full bg-blue-600/10 flex items-center justify-center mb-6 animate-pulse">
                        <Briefcase className="w-10 h-10 text-blue-600 opacity-40" />
                    </div>
                    <CardTitle className="text-2xl font-black mb-2 text-foreground">Ancora nessun lavoro</CardTitle>
                    <CardDescription className="max-w-xs mx-auto text-muted-foreground">
                        Inizia prendendo in carico un nuovo intervento dalla sezione &quot;Nuovi Lavori&quot;.
                    </CardDescription>
                    <Link href="/technician/claim" className="mt-8">
                        <Button className="bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl px-8 h-12 shadow-xl shadow-blue-600/20">
                            Cerca Nuovi Lavori
                        </Button>
                    </Link>
                </Card>
            )}
        </div>
    );
}
