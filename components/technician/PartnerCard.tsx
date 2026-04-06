import React from 'react';
import { Star, MapPin, Phone, MessageCircle, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PartnerData {
    nome: string;
    categoria: string;
    citta: string;
    telefono?: string;
    rating?: number;
    note?: string;
    link_whatsapp?: string;
}

interface PartnerCardProps {
    partner: PartnerData;
    className?: string;
}

export function PartnerCard({ partner, className }: PartnerCardProps) {
    const isWhatsappGenerated = Boolean(partner.link_whatsapp);

    return (
        <div className={cn("bg-slate-800/80 border border-slate-700/50 rounded-xl p-4 overflow-hidden shadow-lg", className)}>
            <div className="flex items-start justify-between">
                <div>
                    <h4 className="font-bold text-white text-base leading-tight">{partner.nome}</h4>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full">
                            <Wrench className="w-3 h-3" />
                            {partner.categoria}
                        </span>
                        <div className="flex items-center text-slate-400 text-xs">
                            <MapPin className="w-3 h-3 mr-0.5" />
                            {partner.citta}
                        </div>
                    </div>
                </div>
                {partner.rating && (
                    <div className="flex items-center bg-orange-500/10 text-orange-500 px-2 py-1 rounded-lg">
                        <Star className="w-3.5 h-3.5 fill-current mr-1" />
                        <span className="text-sm font-bold">{partner.rating}</span>
                    </div>
                )}
            </div>

            {partner.note && (
                <div className="mt-3 text-xs text-slate-300 italic bg-slate-900/50 p-2 rounded-lg border border-slate-800">
                    &quot;{partner.note}&quot;
                </div>
            )}

            {(partner.telefono || isWhatsappGenerated) && (
                <div className="mt-4 flex gap-2">
                    {partner.telefono && (
                        <a 
                            href={`tel:${partner.telefono}`}
                            className="flex items-center justify-center gap-1.5 flex-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg py-2 text-xs font-semibold transition-colors"
                        >
                            <Phone className="w-3.5 h-3.5" />
                            Chiama
                        </a>
                    )}
                    {isWhatsappGenerated && (
                        <a 
                            href={partner.link_whatsapp}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-1.5 flex-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg py-2 text-xs font-semibold shadow-md shadow-emerald-500/20 transition-all active:scale-95"
                        >
                            <MessageCircle className="w-3.5 h-3.5" />
                            Scrivi WA
                        </a>
                    )}
                </div>
            )}
        </div>
    );
}
