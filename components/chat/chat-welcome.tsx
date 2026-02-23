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
                        <div className="pt-2">
                            <a
                                href="https://wa.me/393461027447?text=Ciao%20Niki%2C%20ho%20bisogno%20del%20tuo%20aiuto"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#25D366] hover:bg-[#20bd5c] text-white text-sm font-bold rounded-xl shadow-lg shadow-green-500/20 transition-all active:scale-95 group"
                            >
                                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                </svg>
                                Scrivimi su WhatsApp
                            </a>
                        </div>
                    </div>
                </div>
            </ClientAnimationWrapper>

            <ClientAnimationWrapper delay={0.3} duration={0.5}>
                <div className="grid grid-cols-4 gap-2 sm:gap-4 w-full max-w-2xl px-2 sm:px-4">
                    {QUICK_ACTIONS.map((action) => {
                        const Icon = action.icon;
                        return (
                            <button
                                key={action.id}
                                onClick={() => onOptionSelect(action.message)}
                                className="group flex flex-col items-center gap-1.5 sm:gap-3 p-2 sm:p-5 bg-card rounded-2xl border border-border hover:border-accent shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                            >
                                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${action.color} ${action.shadowColor} shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                </div>
                                <span className="text-[10px] sm:text-sm font-semibold text-card-foreground group-hover:text-primary transition-colors text-center leading-tight">
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
