import React from 'react';
import { MapPin, Phone, Clock, Store } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FornitoreData {
    nome: string;
    indirizzo: string;
    orari?: string;
    telefono?: string;
}

interface FornitoreCardProps {
    fornitore: FornitoreData;
    className?: string;
}

export function FornitoreCard({ fornitore, className }: FornitoreCardProps) {
    return (
        <div className={cn("bg-slate-800/80 border border-slate-700/50 rounded-xl p-4 overflow-hidden shadow-lg", className)}>
            <div className="flex items-start justify-between">
                <div>
                    <h4 className="font-bold text-white text-base leading-tight flex items-center gap-2">
                        <Store className="w-4 h-4 text-emerald-400" />
                        {fornitore.nome}
                    </h4>
                    <div className="flex flex-col gap-1.5 mt-2">
                        <div className="flex items-start text-slate-300 text-sm">
                            <MapPin className="w-3.5 h-3.5 mr-1.5 mt-0.5 text-blue-400 shrink-0" />
                            <span>{fornitore.indirizzo}</span>
                        </div>
                        {fornitore.orari && (
                            <div className="flex items-start text-slate-300 text-sm">
                                <Clock className="w-3.5 h-3.5 mr-1.5 mt-0.5 text-orange-400 shrink-0" />
                                <span>{fornitore.orari}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {fornitore.telefono && (
                <div className="mt-4 flex gap-2">
                    <a 
                        href={`tel:${fornitore.telefono}`}
                        className="flex items-center justify-center gap-1.5 flex-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg py-2 text-xs font-semibold transition-colors"
                    >
                        <Phone className="w-3.5 h-3.5" />
                        Chiama {fornitore.telefono}
                    </a>
                </div>
            )}
        </div>
    );
}
