'use client';

import { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';

const TESTIMONIALS = [
    {
        id: 1,
        name: 'Stefania M.',
        location: 'Rimini',
        avatar: '👩',
        rating: 5,
        quote: 'Niki ha eseguito diversi lavoretti in casa ed è stato veramente bravo, pulito, veloce e soprattutto onesto. Lo straconsiglio vivamente.',
    },
    {
        id: 2,
        name: 'Lorenzo B.',
        location: 'Rimini/Riccione',
        avatar: '👨',
        rating: 5,
        quote: 'Il migliore zona Rimini/Riccione. Una garanzia: chiami e risolve subito!! Provato e confermo, richiamerò sicuramente.',
    },
    {
        id: 3,
        name: 'Raffaele B.',
        location: 'Local Guide',
        avatar: '👨‍🔧',
        rating: 5,
        quote: 'Bravo ragazzo serio, preciso, pulito, affidabile e con tanta professionalità. Lo consiglio per vari lavori in casa. Bravo Niki.',
    },
    {
        id: 4,
        name: 'Barbara C.',
        location: 'Rimini',
        avatar: '👩‍💼',
        rating: 5,
        quote: 'Persona precisa e competente, super consigliato.',
    },
    {
        id: 5,
        name: 'Cristian P.',
        location: 'Riccione',
        avatar: '👨‍💻',
        rating: 5,
        quote: 'Risolve qualsiasi problema tra Rimini e Riccione! VELOCISSIMO!!',
    },
    {
        id: 6,
        name: 'Alessandro T.',
        location: 'Rimini',
        avatar: '👨‍🎨',
        rating: 5,
        quote: 'Quando ho un problema, lui me lo risolve. Lo trovate tra Riccione e Rimini. Consigliato.',
    },
    {
        id: 7,
        name: 'Mirko L.',
        location: 'Rimini',
        avatar: '👨‍🔬',
        rating: 5,
        quote: 'Ho contattato Niki per un problema idraulico a Rimini. Intervento rapido e risolutivo. Una sicurezza.',
    },
];

export function TestimonialCarousel() {
    const [current, setCurrent] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);

    useEffect(() => {
        if (!isAutoPlaying) return;

        const timer = setInterval(() => {
            setCurrent((prev) => (prev + 1) % TESTIMONIALS.length);
        }, 5000);

        return () => clearInterval(timer);
    }, [isAutoPlaying]);

    const goTo = (index: number) => {
        setCurrent(index);
        setIsAutoPlaying(false);
        setTimeout(() => setIsAutoPlaying(true), 10000);
    };

    const prev = () => goTo((current - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
    const next = () => goTo((current + 1) % TESTIMONIALS.length);

    const testimonial = TESTIMONIALS[current];

    return (
        <section className="py-16 sm:py-24 bg-gradient-to-b from-background to-card/50">
            <div className="max-w-4xl mx-auto px-4 text-center">
                <div className="mb-12">
                    <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground mb-4">
                        Cosa Dicono i Clienti
                    </h2>
                    <p className="text-muted-foreground text-lg">
                        Testimonianze reali da Google
                    </p>
                </div>

                <div className="relative text-left">
                    {/* Main Card */}
                    <div className="relative bg-card rounded-3xl border border-border shadow-xl p-8 sm:p-12 overflow-hidden">
                        {/* Quote Icon */}
                        <div className="absolute top-6 right-6 opacity-10">
                            <Quote className="w-24 h-24 text-foreground" />
                        </div>

                        {/* Content */}
                        <div className="relative z-10">
                            {/* Verification Badge */}
                            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full shadow-sm">
                                    <svg viewBox="0 0 24 24" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.26 1.07-3.71 1.07-2.87 0-5.3-1.94-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.11c-.22-.66-.35-1.36-.35-2.11s.13-1.45.35-2.11V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.83z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.83c.86-2.59 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Recensione Verificata</span>
                                </div>
                                <div className="text-[10px] sm:text-xs font-medium text-muted-foreground flex items-center gap-1.5 opacity-60">
                                    <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm.5 16h-1v-4h1v4zm0-6h-1V7h1v5z" />
                                    </svg>
                                    Fonte: Google Reviews
                                </div>
                            </div>

                            {/* Avatar & Info */}
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-3xl shadow-lg border-2 border-white dark:border-slate-800">
                                    {testimonial.avatar}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-foreground leading-none mb-1">{testimonial.name}</h3>
                                    <p className="text-sm text-muted-foreground font-medium mb-1.5">
                                        {testimonial.location}
                                    </p>
                                    <div className="flex gap-0.5">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Quote */}
                            <blockquote className="text-xl sm:text-2xl font-bold tracking-tight text-foreground leading-snug">
                                &ldquo;{testimonial.quote}&rdquo;
                            </blockquote>
                        </div>
                    </div>

                    {/* Navigation Arrows */}
                    <button
                        onClick={prev}
                        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 sm:-translate-x-6 w-12 h-12 rounded-full bg-card border border-border shadow-lg flex items-center justify-center hover:bg-muted transition-colors z-20"
                        aria-label="Precedente"
                    >
                        <ChevronLeft className="w-6 h-6 text-foreground" />
                    </button>
                    <button
                        onClick={next}
                        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 sm:translate-x-6 w-12 h-12 rounded-full bg-card border border-border shadow-lg flex items-center justify-center hover:bg-muted transition-colors z-20"
                        aria-label="Successivo"
                    >
                        <ChevronRight className="w-6 h-6 text-foreground" />
                    </button>
                </div>

                {/* Dots & Link */}
                <div className="mt-8 space-y-8">
                    <div className="flex justify-center gap-4">
                        {TESTIMONIALS.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => goTo(index)}
                                className={`touch-target-expansion relative rounded-full transition-all duration-300 ${index === current
                                    ? 'bg-blue-500 w-8 h-2'
                                    : 'bg-border hover:bg-muted-foreground w-2 h-2'
                                    }`}
                                aria-label={`Vai a testimonial ${index + 1}`}
                            />
                        ))}
                    </div>

                    <div className="pt-4">
                        <a
                            href="https://share.google/6Zdtj5QZguonXRQmj"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors group"
                        >
                            Vedi tutte le recensioni integrali su Google
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}
