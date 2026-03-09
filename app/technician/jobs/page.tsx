'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getMyJobs } from '@/app/actions/technician-actions';
import { ExtendedTicket } from '@/lib/types/internal-app';

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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'in_progress': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'resolved': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
            default: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
        }
    };

    return (
        <div className="min-h-screen bg-[#0F172A] text-white p-4 pb-24">
            <header className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
                        I Miei Lavori
                    </h1>
                    <p className="text-slate-400 mt-1">Gestione interventi assegnati</p>
                </div>
                <Link
                    href="/technician/new-job"
                    className="bg-blue-600 hover:bg-blue-500 p-4 rounded-2xl shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center font-bold"
                >
                    <span className="text-xl">➕ Nuovo</span>
                </Link>
            </header>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-medium">Caricamento agenda...</p>
                </div>
            ) : jobs.length === 0 ? (
                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-12 text-center backdrop-blur-xl">
                    <div className="text-5xl mb-4">📭</div>
                    <h3 className="text-xl font-bold mb-2">Nessun lavoro in agenda</h3>
                    <p className="text-slate-400 mb-6">Non hai lavori assegnati al momento o per la data selezionata.</p>
                    <Link
                        href="/technician/new-job"
                        className="inline-flex items-center gap-2 text-blue-400 font-semibold hover:text-blue-300 transition-colors"
                    >
                        Crea il tuo primo lavoro manuale →
                    </Link>
                </div>
            ) : (
                <div className="grid gap-4">
                    {jobs.map((job) => (
                        <Link
                            key={job.id}
                            href={`/technician/jobs/${job.id}`}
                            className="group bg-slate-900/50 border border-slate-800 p-5 rounded-3xl hover:border-slate-700 transition-all backdrop-blur-xl block relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4">
                                <span className={`text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full border ${getStatusColor(job.status)}`}>
                                    {job.status.replace('_', ' ')}
                                </span>
                            </div>

                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl p-3 bg-slate-800 rounded-2xl group-hover:bg-slate-700 transition-colors">
                                        {job.category === 'plumbing' ? '🚰' :
                                            job.category === 'electric' ? '⚡' :
                                                job.category === 'climate' ? '❄️' : '🛠️'}
                                    </span>
                                    <div>
                                        <h3 className="font-bold text-lg group-hover:text-blue-400 transition-colors">{job.customer_name || 'Cliente'}</h3>
                                        <p className="text-sm text-slate-400 flex items-center gap-1">
                                            📍 {job.city}, {job.address}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 mt-2 text-xs font-medium text-slate-500 border-t border-slate-800/50 pt-4">
                                    <span className="flex items-center gap-1">
                                        📅 {job.scheduled_at ? new Date(job.scheduled_at).toLocaleDateString() : 'Da definire'}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        🕒 {job.scheduled_at ? new Date(job.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                    </span>
                                    <span className={`flex items-center gap-1 ${job.priority === 'urgent' ? 'text-red-400' : ''}`}>
                                        🚩 {job.priority?.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
