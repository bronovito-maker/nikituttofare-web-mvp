'use client';

import { Zap, ShieldCheck, Clock, Smartphone, Bot, FileCheck } from 'lucide-react';
import { BenefitsGrid, type BenefitItem } from '@/components/ui/benefits-grid';

const BENEFITS: readonly BenefitItem[] = [
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
        <BenefitsGrid
            items={BENEFITS}
            title={<>Perché Scegliere <span className="text-gradient">NikiTuttoFare</span></>}
            subtitle="Non siamo il solito servizio di manutenzione. Siamo tecnologia al servizio della tua tranquillità."
        />
    );
}
