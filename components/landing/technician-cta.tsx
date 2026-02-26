'use client';

import Link from 'next/link';
import { Users, Zap, CreditCard, Calendar, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TECH_BENEFITS = [
    { icon: Users, text: 'Job Board con richieste continue' },
    { icon: Zap, text: 'Accetta lavori con Magic Link' },
    { icon: CreditCard, text: 'Pagamenti garantiti senza pensieri' },
    { icon: Calendar, text: 'Gestisci la tua agenda, zero burocrazia' },
];

export function TechnicianCTA() {
    return (
        <section className="py-16 sm:py-24 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden relative">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }} />
            </div>

            <div className="max-w-6xl mx-auto px-4 relative z-10">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Left Content */}
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-300 text-sm font-medium">
                            <Users className="w-4 h-4" />
                            Per Professionisti
                        </div>

                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
                            Cresci con NikiTuttoFare:
                            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                                Più Lavori, Meno Stress
                            </span>
                        </h2>

                        <p className="text-lg text-slate-300 leading-relaxed">
                            Entra a far parte di NikiTuttoFare e servi la Riviera Romagnola insieme a me.
                            Tu fai il tuo lavoro, io mi occupo di portarti i clienti e gestire tutto il resto.
                        </p>

                        <ul className="space-y-3">
                            {TECH_BENEFITS.map((benefit) => {
                                const Icon = benefit.icon;
                                return (
                                    <li key={benefit.text} className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                            <Icon className="w-4 h-4 text-blue-400" />
                                        </div>
                                        <span className="text-slate-200">{benefit.text}</span>
                                    </li>
                                );
                            })}
                        </ul>

                        <div className="pt-4">
                            <Button asChild size="lg" className="bg-white text-slate-900 hover:bg-slate-100 font-bold rounded-full px-8 h-14 text-lg shadow-xl">
                                <Link href="/technician/register" className="flex items-center gap-2">
                                    Inizia a Collaborare con Me
                                    <ArrowRight className="w-5 h-5" />
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {/* Right Visual */}
                    <div className="hidden lg:block relative">
                        <div className="relative bg-slate-800/50 backdrop-blur border border-slate-700 rounded-3xl p-8 rotate-2 hover:rotate-0 transition-transform duration-500">
                            {/* Mock Dashboard */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-300">Dashboard Tecnico</span>
                                    <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded">ONLINE</span>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-700/50 rounded-xl p-4">
                                        <p className="text-2xl font-black text-white">12</p>
                                        <p className="text-xs text-slate-300">Lavori questo mese</p>
                                    </div>
                                    <div className="bg-slate-700/50 rounded-xl p-4">
                                        <p className="text-2xl font-black text-emerald-400">€2.4k</p>
                                        <p className="text-xs text-slate-300">Guadagno</p>
                                    </div>
                                </div>

                                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                        </span>
                                        <span className="text-sm font-medium text-blue-300">Nuovo Lavoro Disponibile</span>
                                    </div>
                                    <p className="text-white font-semibold">Perdita Tubo — Rimini Centro</p>
                                    <p className="text-xs text-slate-300">2 km da te • €85 stimato</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
