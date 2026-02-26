'use client';

import { Heart, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function SmallJobsCallout() {
    return (
        <section className="py-16 sm:py-24 px-4 bg-slate-50/30 dark:bg-transparent relative z-10">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="text-center space-y-2">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground tracking-tight">
                        Assistenza per ogni necessità
                    </h2>
                </div>
                <Card className="bg-slate-50 dark:bg-slate-900/50 border-orange-500/20 shadow-lg overflow-hidden relative group hover:border-orange-500/40 transition-all duration-500">
                    {/* Decorative background elements */}
                    <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none transition-transform group-hover:scale-110 duration-700">
                        <Sparkles className="w-24 h-24 text-orange-500" />
                    </div>

                    <CardContent className="p-8 md:p-10 relative z-10">
                        <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                            <div className="flex-shrink-0 w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center">
                                <Heart className="w-8 h-8 text-orange-500 fill-orange-500/20" />
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-xl md:text-2xl font-black text-foreground leading-tight italic">
                                    &quot;Ti hanno detto che il lavoro è troppo piccolo? Chiamami. Per me non esistono piccoli lavori, esistono solo clienti che hanno bisogno di una mano.&quot;
                                </h3>
                                <div className="flex items-center justify-center md:justify-start gap-3">
                                    <div className="w-10 h-10 rounded-full border-2 border-orange-500/20 overflow-hidden">
                                        <img src="/team-photo.png" alt="Niki" className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-foreground">Il Tuo Tuttofare Niki</p>
                                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-black">Ci metto la faccia e il cuore</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </section>
    );
}
