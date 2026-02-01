'use client';

import { Users, Zap, CreditCard, Clock, Smartphone, FileCheck } from 'lucide-react';
import { BenefitsGrid, type BenefitItem } from '@/components/ui/benefits-grid';

const BENEFITS: readonly BenefitItem[] = [
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
        <BenefitsGrid
            items={BENEFITS}
            title={<>Perché Scegliere <span className="text-gradient">NikiTuttoFare</span>?</>}
            subtitle="I vantaggi concreti per i professionisti della Riviera Romagnola"
        />
    );
}
