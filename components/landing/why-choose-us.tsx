'use client';

import { Zap, ShieldCheck, Clock, Smartphone, Bot, FileCheck } from 'lucide-react';

const BENEFITS = [
    {
        icon: Zap,
        title: 'Interventi Rapidi',
        description: 'Intervento garantito entro 2 ore. Non aspetti, risolvi.',
        color: 'text-amber-500',
        bgColor: 'bg-amber-500/10',
    },
    {
        icon: ShieldCheck,
        title: 'Tecnici Verificati',
        description: 'Ogni professionista è certificato e assicurato fino a 1M€.',
        color: 'text-emerald-500',
        bgColor: 'bg-emerald-500/10',
    },
    {
        icon: Clock,
        title: 'Tracciamento Live',
        description: 'Segui lo stato del tuo ticket in tempo reale, dal primo messaggio alla fattura.',
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
    },
    {
        icon: FileCheck,
        title: 'Passaporto Digitale',
        description: 'Storico completo di ogni riparazione sui tuoi asset. Mai più "quando l\'ho cambiato?".',
        color: 'text-purple-500',
        bgColor: 'bg-purple-500/10',
    },
    {
        icon: Bot,
        title: 'AI Sempre Attiva',
        description: 'Niki risponde 24/7. Descrivi il problema, al resto pensiamo noi.',
        color: 'text-cyan-500',
        bgColor: 'bg-cyan-500/10',
    },
    {
        icon: Smartphone,
        title: 'Tutto da Mobile',
        description: 'Niente app da scaricare. Chat, pagamenti, fatture: tutto dal browser.',
        color: 'text-orange-500',
        bgColor: 'bg-orange-500/10',
    },
];

export function WhyChooseUs() {
    return (
        <section className="py-16 sm:py-24 bg-background">
            <div className="max-w-6xl mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground mb-4">
                        Perché Scegliere <span className="text-gradient">NikiTuttoFare</span>
                    </h2>
                    <p className="text-lg text-muted-foreground">
                        Non siamo il solito servizio di manutenzione. Siamo tecnologia al servizio della tua tranquillità.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {BENEFITS.map((benefit) => {
                        const Icon = benefit.icon;
                        return (
                            <div
                                key={benefit.title}
                                className="group p-6 bg-card rounded-2xl border border-border hover:border-accent transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                            >
                                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${benefit.bgColor} mb-4 group-hover:scale-110 transition-transform`}>
                                    <Icon className={`w-6 h-6 ${benefit.color}`} />
                                </div>
                                <h3 className="text-lg font-bold text-foreground mb-2">{benefit.title}</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">{benefit.description}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
