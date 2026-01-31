'use client';

import { Check } from 'lucide-react';

const REQUIREMENTS = [
    'Partita IVA attiva e regolare',
    'Esperienza comprovata nella specializzazione scelta',
    'Certificazioni professionali in corso di validità',
    'Attrezzatura propria e mezzi per spostamenti',
    'Disponibilità nella Riviera Romagnola',
    'Professionalità e orientamento al cliente',
    'Smartphone per gestione incarichi',
];

export function TechnicianRequirements() {
    return (
        <section className="py-16 sm:py-24 bg-background">
            <div className="max-w-4xl mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground mb-4">
                        Requisiti per Entrare nel Team
                    </h2>
                    <p className="text-muted-foreground text-lg">
                        Cerchiamo professionisti seri e affidabili
                    </p>
                </div>

                <div className="bg-card rounded-3xl border border-border p-8 shadow-lg">
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {REQUIREMENTS.map((req) => (
                            <li key={req} className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center mt-0.5">
                                    <Check className="w-4 h-4 text-emerald-500" />
                                </div>
                                <span className="text-foreground">{req}</span>
                            </li>
                        ))}
                    </ul>

                    <div className="mt-8 pt-6 border-t border-border">
                        <p className="text-sm text-muted-foreground text-center">
                            <strong className="text-foreground">Zone coperte:</strong> Rimini, Riccione, Cattolica, Misano Adriatico, Bellaria, Igea Marina, Santarcangelo, Verucchio, Coriano, Morciano, San Marino
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
