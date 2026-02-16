'use client';

import { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';

const TESTIMONIALS = [
    {
        id: 1,
        name: 'Giulia M.',
        location: 'Rimini Centro',
        service: 'Idraulico',
        avatar: '👩',
        rating: 5,
        quote: 'Tubo rotto alle 22:00, tecnico arrivato in 15 minuti. Prezzo esatto come preventivato. Mai più senza Niki!',
    },
    {
        id: 2,
        name: 'Marco R.',
        location: 'Riccione',
        service: 'Elettricista',
        avatar: '👨',
        rating: 5,
        quote: 'Cortocircuito il giorno prima delle vacanze. Risolto tutto in un\'ora. Servizio impeccabile.',
    },
    {
        id: 3,
        name: 'Anna L.',
        location: 'Santarcangelo',
        service: 'Fabbro',
        avatar: '👩‍🦰',
        rating: 5,
        quote: 'Chiusa fuori casa con bimbo piccolo. Il fabbro è arrivato subito. Grazie, mi avete salvato!',
    },
    {
        id: 4,
        name: 'Hotel Azzurro',
        location: 'Marina Centro',
        service: 'Clima',
        avatar: '🏨',
        rating: 5,
        quote: 'Condizionatore guasto in alta stagione. Intervento urgente gestito perfettamente. Ora siamo clienti fissi.',
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
            <div className="max-w-4xl mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground mb-4">
                        Cosa Dicono i Clienti
                    </h2>
                    <p className="text-muted-foreground text-lg">
                        Oltre 100+ interventi completati con successo
                    </p>
                </div>

                <div className="relative">
                    {/* Main Card */}
                    <div className="relative bg-card rounded-3xl border border-border shadow-xl p-8 sm:p-12 overflow-hidden">
                        {/* Quote Icon */}
                        <div className="absolute top-6 right-6 opacity-10">
                            <Quote className="w-24 h-24 text-foreground" />
                        </div>

                        {/* Content */}
                        <div className="relative z-10">
                            {/* Avatar & Info */}
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-3xl shadow-lg">
                                    {testimonial.avatar}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-foreground">{testimonial.name}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {testimonial.location} • {testimonial.service}
                                    </p>
                                    <div className="flex gap-0.5 mt-1">
                                        {Array.from({ length: testimonial.rating }).map((_, i) => (
                                            <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Quote */}
                            <blockquote className="text-xl sm:text-2xl font-medium text-foreground leading-relaxed">
                                &ldquo;{testimonial.quote}&rdquo;
                            </blockquote>
                        </div>
                    </div>

                    {/* Navigation Arrows */}
                    <button
                        onClick={prev}
                        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 sm:-translate-x-6 w-12 h-12 rounded-full bg-card border border-border shadow-lg flex items-center justify-center hover:bg-muted transition-colors"
                        aria-label="Precedente"
                    >
                        <ChevronLeft className="w-6 h-6 text-foreground" />
                    </button>
                    <button
                        onClick={next}
                        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 sm:translate-x-6 w-12 h-12 rounded-full bg-card border border-border shadow-lg flex items-center justify-center hover:bg-muted transition-colors"
                        aria-label="Successivo"
                    >
                        <ChevronRight className="w-6 h-6 text-foreground" />
                    </button>
                </div>

                {/* Dots with improved touch targets */}
                <div className="flex justify-center gap-4 mt-8">
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
            </div>
        </section>
    );
}
