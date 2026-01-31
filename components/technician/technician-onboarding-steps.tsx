'use client';

import { FileText, ShieldCheck, GraduationCap, Rocket } from 'lucide-react';

const STEPS = [
    {
        icon: FileText,
        number: '01',
        title: 'Iscrizione Veloce',
        description: 'Compila il modulo online con i tuoi dati professionali, specializzazioni e area operativa.',
        color: 'from-blue-500 to-blue-600',
    },
    {
        icon: ShieldCheck,
        number: '02',
        title: 'Verifica e Qualifica',
        description: 'Valutiamo la candidatura e verifichiamo certificazioni, P.IVA e referenze.',
        color: 'from-purple-500 to-purple-600',
    },
    {
        icon: GraduationCap,
        number: '03',
        title: 'Formazione Piattaforma',
        description: "Ti guidiamo all'uso del cruscotto tecnico e del sistema Magic Link. Operativo in un lampo!",
        color: 'from-orange-500 to-orange-600',
    },
    {
        icon: Rocket,
        number: '04',
        title: 'Inizia a Lavorare',
        description: 'Ricevi richieste compatibili con le tue specializzazioni. Più clienti, meno stress!',
        color: 'from-emerald-500 to-emerald-600',
    },
];

export function TechnicianOnboardingSteps() {
    return (
        <section className="py-16 sm:py-24 bg-slate-50 dark:bg-black/50">
            <div className="max-w-6xl mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground mb-4">
                        Unisciti in Pochi Passi
                    </h2>
                    <p className="text-lg text-muted-foreground">
                        Il processo di onboarding è semplice e veloce
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                    {STEPS.map((step, index) => {
                        const Icon = step.icon;
                        return (
                            <div key={step.number} className="relative group">
                                {/* Connection Line */}
                                {index < STEPS.length - 1 && (
                                    <div className="hidden lg:block absolute top-12 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-0.5 bg-gradient-to-r from-border to-transparent" />
                                )}

                                <div className="bg-card rounded-2xl border border-border p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="text-xs font-bold text-muted-foreground mb-2">STEP {step.number}</div>
                                    <h3 className="text-lg font-bold text-foreground mb-2">{step.title}</h3>
                                    <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
