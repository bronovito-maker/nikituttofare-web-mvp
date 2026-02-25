'use client';

import Link from 'next/link';
import { Zap, ArrowRight, Wrench, Lightbulb, Key, Settings, Wind, Flame, Droplets, Antenna } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { SEO_SERVICES } from '@/lib/seo-data';

const SERVICE_ICONS: Record<string, any> = {
    idraulico: Droplets,
    elettricista: Lightbulb,
    fabbro: Key,
    tapparellista: Settings,
    condizionamento: Wind,
    caldaie: Flame,
    spurgo: Wrench,
    antennista: Antenna,
    montaggio: Settings,
};

export function ServicesGrid() {
    return (
        <section className="py-24 px-4 sm:px-6 bg-slate-50 dark:bg-[#080808]">
            <div className="max-w-7xl mx-auto">
                <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground">
                        Cosa risolvo per te <span className="text-blue-600 dark:text-blue-400">oggi</span>?
                    </h2>
                    <p className="text-lg text-muted-foreground font-light">
                        Non solo grandi impianti. Sono qui per risolvere i piccoli problemi che ti bloccano la giornata.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {SEO_SERVICES.map((service) => {
                        const Icon = SERVICE_ICONS[service.slug] || Zap;
                        return (
                            <div key={service.slug} className="group h-full">
                                <Card className="h-full p-8 border-border hover:border-blue-500/30 hover:bg-white dark:hover:bg-blue-950/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl flex flex-col">
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/10 flex items-center justify-center group-hover:bg-blue-600 transition-colors duration-300">
                                            <Icon className="w-7 h-7 text-blue-600 dark:text-blue-400 group-hover:text-white transition-colors duration-300" />
                                        </div>
                                    </div>

                                    <h3 className="text-2xl font-bold text-foreground mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        {service.name}
                                    </h3>

                                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6 italic text-sm flex-1">
                                        &quot;{service.examples}&quot;
                                    </p>

                                    <div className="pt-6 border-t border-border mt-auto">
                                        <Link
                                            href="/chat"
                                            className="flex items-center text-sm font-bold text-blue-600 dark:text-blue-400 group-hover:gap-2 transition-all"
                                        >
                                            Chiedi Intervento
                                            <ArrowRight className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                                        </Link>
                                    </div>
                                </Card>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
