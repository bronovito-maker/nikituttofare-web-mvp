'use client';

import { Users, Zap, CreditCard, Clock, Smartphone, FileCheck } from 'lucide-react';

const BENEFITS = [
    {
        icon: Users,
        title: 'Clienti Verificati H24',
        description: "L'AI di NikiTuttoFare ti porta richieste qualificate nella tua zona, 24/7. Più interventi, zero stress commerciale.",
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
    },
    {
        icon: Zap,
        title: 'Magic Link Smart',
        description: "Accetta o rifiuta incarichi con un click dal telefono. Dettagli completi e stima economica immediata.",
        color: 'text-purple-500',
        bgColor: 'bg-purple-500/10',
    },
    {
        icon: CreditCard,
        title: 'Pagamenti Garantiti',
        description: "Basta ritardi. Pagamenti trasparenti e puntuali per ogni lavoro completato. La tua professionalità merita serietà.",
        color: 'text-emerald-500',
        bgColor: 'bg-emerald-500/10',
    },
    {
        icon: Clock,
        title: 'Flessibilità Totale',
        description: "Decidi tu quando e quanto lavorare. La piattaforma si adatta alla tua agenda, non il contrario.",
        color: 'text-orange-500',
        bgColor: 'bg-orange-500/10',
    },
    {
        icon: Smartphone,
        title: 'Dashboard Tecnico',
        description: "Traccia lavori, gestisci comunicazioni e monitora guadagni. Tutto a portata di smartphone.",
        color: 'text-cyan-500',
        bgColor: 'bg-cyan-500/10',
    },
    {
        icon: FileCheck,
        title: 'Digital Passport',
        description: "Registra lo storico interventi sugli asset dei clienti. Trasparenza totale, reputazione migliore.",
        color: 'text-pink-500',
        bgColor: 'bg-pink-500/10',
    },
];

export function TechnicianBenefits() {
    return (
        <section className="py-16 sm:py-24 bg-background">
            <div className="max-w-6xl mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground mb-4">
                        Perché Scegliere <span className="text-gradient">NikiTuttoFare</span>?
                    </h2>
                    <p className="text-lg text-muted-foreground">
                        I vantaggi concreti per i professionisti della Riviera Romagnola
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
