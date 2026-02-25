'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { CheckCircle2, Home, MapPin, Settings, Zap } from 'lucide-react';

const RECENT_WORKS = [
    {
        client: "Giulia",
        location: "Rimini",
        title: "Sostituzione Sanitario Critico",
        description: "Intervento d'urgenza per un vaso WC bloccato da incrostazioni calcaree stratificate. Sostituzione completa del sanitario e ripristino scarico. Risultato: bagno come nuovo e massima igiene garantita.",
        badge: "Idraulica Verificata 💧",
        icon: <Home className="w-5 h-5" />,
    },
    {
        client: "Francesco",
        location: "Riccione",
        title: "Manutenzione Elettrica e Infissi",
        description: "Intervento combinato: installazione presa in sicurezza in bagno, ripristino punto luce sul balcone e livellatura micrometrica delle porte interne che avevano ceduto nel tempo. Francesco ora chiude le porte con un dito!",
        badge: "Multitasking Pro ⚡🚪",
        icon: <Zap className="w-5 h-5" />,
    },
    {
        client: "Federico",
        location: "Misano Adriatico",
        title: "Riparazioni Meccaniche e Cucina",
        description: "Sistemazione anta cucina fuori asse, riparazione cerniere lavastoviglie e livellamento del cancelletto esterno che non agganciava più la serratura. Piccoli problemi risolti definitivamente in un unico pomeriggio.",
        badge: "Riparazione & Falegnameria 🛠️",
        icon: <Settings className="w-5 h-5" />,
    },
];

export function RecentWorks() {
    return (
        <section className="py-16 px-4 sm:px-6 bg-slate-50/50 dark:bg-slate-900/20">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
                    <div className="space-y-2 text-center md:text-left">
                        <h2 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">
                            Ultimi lavori eseguiti a Rimini e dintorni
                        </h2>
                        <p className="text-muted-foreground text-lg">
                            Trasparenza e precisione in ogni intervento. Ecco cosa ho risolto recentemente.
                        </p>
                    </div>
                    <div className="flex justify-center md:justify-end">
                        <Badge variant="outline" className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800 py-1.5 px-4 rounded-full font-bold text-sm">
                            Aggiornato ORA
                        </Badge>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {RECENT_WORKS.map((work, idx) => (
                        <Card key={idx} className="group relative bg-card/60 backdrop-blur-sm border-border hover:border-orange-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/5 rounded-3xl overflow-hidden p-6 flex flex-col">
                            <div className="flex items-start justify-between mb-6">
                                <div className="p-3 bg-orange-100 dark:bg-orange-950/30 rounded-2xl text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform duration-500">
                                    {work.icon}
                                </div>
                                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none shadow-none font-bold tracking-tight uppercase text-[10px] flex items-center">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    {work.badge}
                                </Badge>
                            </div>

                            <div>
                                <h3 className="font-bold text-xl text-foreground mb-1">{work.title}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {work.description}
                                </p>
                            </div>

                            <div className="mt-8 pt-6 border-t border-border/50 flex items-center justify-between">
                                <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                                    NIKI TUTTOFARE • RIMINI • 2026
                                </span>
                                <div className="flex -space-x-2">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="w-6 h-6 rounded-full border-2 border-background bg-slate-200 dark:bg-slate-800" />
                                    ))}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
                <div className="mt-16 text-center">
                    <Link
                        href="/chat"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-full font-bold text-lg shadow-xl shadow-orange-500/20 transition-all hover:scale-105 active:scale-95 group"
                    >
                        Vuoi un risultato così a casa tua? Contattami!
                        <Zap className="w-5 h-5 fill-current group-hover:animate-pulse" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
