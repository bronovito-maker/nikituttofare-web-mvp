'use client';

import { Wrench, Zap, Key, Thermometer } from 'lucide-react';
import { ClientAnimationWrapper } from '@/components/ui/client-animation-wrapper';

// Quick action categories
export const QUICK_ACTIONS = [
    {
        id: 'plumbing',
        label: 'Idraulico',
        icon: Wrench,
        color: 'from-blue-600 to-blue-500',
        shadowColor: 'shadow-blue-500/25',
        message: 'Ciao, ho bisogno di un idraulico.'
    },
    {
        id: 'electric',
        label: 'Elettricista',
        icon: Zap,
        color: 'from-yellow-500 to-orange-500',
        shadowColor: 'shadow-orange-500/25',
        message: 'Ciao, ho bisogno di un elettricista.'
    },
    {
        id: 'locksmith',
        label: 'Fabbro',
        icon: Key,
        color: 'from-slate-700 to-slate-600',
        shadowColor: 'shadow-slate-500/25',
        message: 'Ciao, ho bisogno di un fabbro urgente.'
    },
    {
        id: 'climate',
        label: 'Clima',
        icon: Thermometer,
        color: 'from-cyan-500 to-blue-500',
        shadowColor: 'shadow-cyan-500/25',
        message: 'Ciao, ho un problema con il climatizzatore.'
    }
];

interface ChatWelcomeProps {
    readonly onOptionSelect: (message: string) => void;
}

export function ChatWelcome({ onOptionSelect }: ChatWelcomeProps) {
    return (
        <div className="flex flex-col gap-8 py-8 items-center justify-center min-h-[50vh]">
            <ClientAnimationWrapper delay={0.1} duration={0.5}>
                <div className="text-center space-y-6">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-xl shadow-blue-500/25">
                        <Wrench className="w-10 h-10 text-white" />
                    </div>
                    <div className="space-y-4 px-4">
                        <h2 className="text-2xl sm:text-3xl font-black text-foreground leading-tight">
                            L&apos;assistente digitale di Niki
                        </h2>
                        <p className="text-muted-foreground text-sm sm:text-lg max-w-lg mx-auto leading-relaxed">
                            Lui è sui cantieri o a casa di un cliente in questo momento, ma io sono qui per farti un <strong>preventivo immediato</strong>, prenotare un appuntamento o rispondere ai tuoi dubbi tecnici.
                        </p>
                        <p className="text-muted-foreground text-xs sm:text-sm font-medium">
                            Risparmia tempo e prova la mia velocità, oppure se preferisci scrivigli direttamente su WhatsApp!
                        </p>
                    </div>
                </div>
            </ClientAnimationWrapper>

            <ClientAnimationWrapper delay={0.3} duration={0.5}>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-2xl px-4">
                    {QUICK_ACTIONS.map((action) => {
                        const Icon = action.icon;
                        return (
                            <button
                                key={action.id}
                                onClick={() => onOptionSelect(action.message)}
                                className="group flex flex-col items-center gap-3 p-4 sm:p-5 bg-card rounded-2xl border border-border hover:border-accent shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                            >
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} ${action.shadowColor} shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                                    <Icon className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-sm font-semibold text-card-foreground group-hover:text-primary transition-colors">
                                    {action.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </ClientAnimationWrapper>
        </div>
    );
}
