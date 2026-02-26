'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Quote } from 'lucide-react';

export function BioSection() {
    return (
        <section className="py-16 sm:py-24 px-4 sm:px-6 relative overflow-hidden">
            <div className="max-w-6xl mx-auto">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    {/* Visual Part */}
                    <div className="relative group">
                        <div className="relative aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl border border-border">
                            <Image
                                src="/team-photo.png"
                                alt="Nikita Bronovs - NikiTuttoFare"
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            {/* Overlay info */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                            <div className="absolute bottom-10 left-10 text-white">
                                <p className="text-2xl font-black">Nikita Bronovs</p>
                                <p className="text-white/70">Il tuo tuttofare di fiducia</p>
                            </div>
                        </div>
                        {/* Decorative elements */}
                        <div className="absolute -top-6 -right-6 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -z-10" />
                        <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -z-10" />
                    </div>

                    {/* Content Part */}
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 text-orange-600 dark:text-orange-400 font-bold tracking-widest uppercase text-xs">
                                <span className="w-8 h-[2px] bg-orange-500"></span>
                                <span>Chi Sono</span>
                            </div>
                            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground leading-tight">
                                Dietro la tecnologia, <br />
                                <span className="text-gradient">c&apos;è una promessa.</span>
                            </h2>
                        </div>

                        <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
                            <p>
                                NikiTuttoFare nasce da una frustrazione personale: era il Ferragosto del 2022, casa allagata a Livorno e nessun aiuto disponibile. Lì ho capito che il mondo delle riparazioni domestiche doveva cambiare.
                            </p>
                            <p className="border-l-4 border-orange-500 pl-6 italic text-foreground/80 bg-orange-500/5 py-4 rounded-r-xl">
                                &quot;Non voglio essere un semplice tecnico, ma la persona di cui ti fidi quando qualcosa non va in casa.&quot;
                            </p>
                            <p>
                                Oggi porto in **Romagna** un servizio che unisce l&apos;onestà del tuttofare &quot;di una volta&quot; alla velocità del digitale. Trasparenza totale, pulizia maniacale e garanzia su ogni singolo intervento.
                            </p>
                        </div>

                        <div className="pt-6">
                            <Button asChild size="lg" className="rounded-full px-8 h-14 font-bold text-lg hover:scale-105 transition-all">
                                <Link href="/about">
                                    Leggi la mia storia completa
                                    <ArrowRight className="ml-2 w-5 h-5" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
