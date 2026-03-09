// app/technician/jobs/[id]/page.tsx
'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AssistantChat from '@/components/technician/AssistantChat';
import InventoryManager from '@/components/technician/InventoryManager';
import { ExtendedTicket } from '@/lib/types/internal-app';
import { createBrowserClient } from '@/lib/supabase-browser';

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [job, setJob] = useState<ExtendedTicket | null>(null);
    const [loading, setLoading] = useState(true);
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

    if (loading) return (
        <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    );

    if (!job) return (
        <div className="min-h-screen bg-[#0F172A] text-white p-8 text-center text-slate-400">
            Intervento non trovato.
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0F172A] text-white pb-24">
            {/* Hero Header */}
            <div className="bg-slate-900 border-b border-slate-800 p-6">
                <div className="max-w-4xl mx-auto flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <button onClick={() => router.back()} className="text-slate-400">←</button>
                            <span className="text-xs font-bold uppercase tracking-widest text-blue-400 bg-blue-500/10 px-2 py-1 rounded">
                                {job.category}
                            </span>
                        </div>
                        <h1 className="text-2xl font-bold">{job.customer_name}</h1>
                        <p className="text-slate-400 text-sm mt-1">📍 {job.address}, {job.city}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${job.priority === 'urgent' ? 'border-red-500/30 bg-red-500/10 text-red-500' : 'border-slate-700 bg-slate-800/50 text-slate-400'
                            }`}>
                            {job.priority}
                        </span>
                        <div className="text-xs text-slate-500 font-medium">#{job.id.slice(0, 8)}</div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Details & Actions */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 gap-3">
                        <a href={`tel:${job.contact_phone}`} className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 p-4 rounded-2xl font-bold transition-all active:scale-95 shadow-lg shadow-green-500/20">
                            📞 Chiama
                        </a>
                        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.address + ' ' + job.city)}`} target="_blank" className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 p-4 rounded-2xl font-bold transition-all active:scale-95 border border-slate-700">
                            🗺️ Mappa
                        </a>
                    </div>

                    {/* Description */}
                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl backdrop-blur-xl">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <span className="p-2 bg-blue-500/10 rounded-lg text-blue-400 text-sm">📋</span>
                            Descrizione Problema
                        </h2>
                        <p className="text-slate-300 leading-relaxed text-sm whitespace-pre-wrap">
                            {job.description}
                        </p>
                    </div>

                    {/* Assistant AI Integrated */}
                    <div>
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 ml-2">
                            <span className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 text-sm">🤖</span>
                            Niki AI Assistant
                        </h2>
                        <AssistantChat ticketId={job.id} />
                    </div>

                    {/* Inventory Manager */}
                    <div className="mt-8">
                        <InventoryManager
                            tenantId={job.tenant_id}
                            jobId={job.id}
                            technicianId={job.assigned_technician_id || job.created_by_technician_id || ''}
                        />
                    </div>
                </div>

                {/* Right Column: Status & Timeline */}
                <div className="space-y-6">
                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl backdrop-blur-xl">
                        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-tighter mb-4">Stato Intervento</h2>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                                <span className="text-sm font-medium">Stato</span>
                                <span className="text-sm font-bold text-green-400">{job.status.replace('_', ' ')}</span>
                            </div>
                            <div className="flex justify-between items-center bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                                <span className="text-sm font-medium">Programmato</span>
                                <span className="text-sm font-bold">{job.scheduled_at ? new Date(job.scheduled_at).toLocaleDateString() : 'N/D'}</span>
                            </div>
                        </div>
                        <button
                            disabled={loading || job.status === 'resolved'}
                            onClick={async () => {
                                if (confirm('Sei sicuro di voler chiudere questo intervento?')) {
                                    try {
                                        setLoading(true);
                                        const res = await fetch('/api/technician/close-job', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ ticketId: job.id, summary: 'Intervento completato dal tecnico.' })
                                        });
                                        if (res.ok) {
                                            router.push('/technician/jobs');
                                        } else {
                                            alert('Errore durante la chiusura del lavoro.');
                                        }
                                    } catch (e) {
                                        console.error(e);
                                    } finally {
                                        setLoading(false);
                                    }
                                }
                            }}
                            className={`w-full mt-6 py-4 rounded-2xl font-bold shadow-xl transition-all active:scale-95 ${job.status === 'resolved'
                                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-500/10 hover:from-blue-500 hover:to-indigo-500 shadow-xl'
                                }`}>
                            🏁 {job.status === 'resolved' ? 'Intervento Chiuso' : 'Chiudi Intervento'}
                        </button>
                    </div>

                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl backdrop-blur-xl">
                        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-tighter mb-4">Note Rapide</h2>
                        <textarea
                            className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/50 placeholder:text-slate-600 h-24"
                            placeholder="Aggiungi appunti..."
                        ></textarea>
                    </div>
                </div>
            </div>
        </div>
    );
}
