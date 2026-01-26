'use client';

import {
    User,
    Phone,
    ArrowRight,
    ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface HeroTileProps {
    readonly activeTicket?: any; // Using loose type correctly for now to avoid valid strict checks blocking progress
}

export function HeroTile({ activeTicket }: HeroTileProps) {
    if (!activeTicket) {
        // IDLE STATE: "Health Check"
        return (
            <div className="h-full min-h-[300px] w-full relative overflow-hidden rounded-[2rem] p-8 flex flex-col justify-between group">
                {/* Background & Glass */}
                <div className="absolute inset-0 bg-[#151515]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent opacity-50" />

                {/* Content */}
                <div className="relative z-10 space-y-2">
                    <Badge variant="outline" className="text-emerald-400 border-emerald-500/20 bg-emerald-500/10 backdrop-blur-md px-3 py-1 text-xs font-semibold tracking-wide uppercase">
                        <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
                        Home Health: Excellent
                    </Badge>
                    <h2 className="text-3xl lg:text-4xl font-bold text-white tracking-tight leading-tight max-w-sm ml-1">
                        Tutto in ordine,<br />
                        <span className="text-slate-400">casa sicura.</span>
                    </h2>
                </div>

                {/* Dynamic Visual: Pulsing House/Shield */}
                <div className="absolute right-[-20%] bottom-[-20%] w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-3xl animate-pulse" />

                {/* Footer Actions */}
                <div className="relative z-10 mt-auto pt-8">
                    <p className="text-sm text-slate-400 mb-4 max-w-xs">
                        Nessun intervento programmato. L&apos;ultimo controllo caldaia è stato effettuato 3 mesi fa.
                    </p>
                    <Button variant="ghost" className="text-white p-0 hover:bg-transparent hover:text-emerald-400 transition-colors group/btn">
                        Vedi Storico Interventi
                        <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                </div>
            </div>
        );
    }

    // ACTIVE STATE: "Domino Effect" Tracker
    return (
        <div className="h-full min-h-[300px] w-full relative overflow-hidden rounded-[2rem] bg-[#1a1a1a] shadow-xl ring-1 ring-white/10 p-8 flex flex-col">
            {/* Background for Active Status */}
            <div className="absolute top-0 right-0 w-full h-[6px] bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-400 animate-[shimmer_2s_infinite]" />

            <div className="relative z-10 flex justify-between items-start mb-8">
                <div>
                    <Badge className="bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-lg shadow-blue-500/20 mb-3 px-3 py-1.5 text-xs">
                        {activeTicket.status === 'in_progress' ? 'INTERVENTO IN CORSO' : 'TECNICO IN ARRIVO'}
                    </Badge>
                    <h2 className="text-2xl font-bold text-white leading-tight">
                        {activeTicket.category === 'plumbing' ? 'Riparazione Idraulica' : 'Intervento Tecnico'}
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">Ticket #{activeTicket.id.slice(0, 6)}</p>
                </div>

                {/* Technician Facepile (Mock) */}
                <div className="flex -space-x-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-[#1a1a1a] flex items-center justify-center text-xs font-bold text-white">
                        <User className="w-5 h-5" />
                    </div>
                    <div className="w-10 h-10 rounded-full bg-blue-600 border-2 border-[#1a1a1a] flex items-center justify-center shadow-lg animate-pulse z-10">
                        <Phone className="w-4 h-4 text-white" />
                    </div>
                </div>
            </div>

            {/* Domino Timeline */}
            <div className="relative z-10 grid grid-cols-3 gap-2 mt-auto">
                {/* Step 1: Assigned */}
                <div className="bg-slate-800/50 rounded-xl p-3 border border-white/5 backdrop-blur-sm">
                    <div className={`w-2 h-2 rounded-full mb-2 ${['assigned', 'in_progress', 'resolved'].includes(activeTicket.status) ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-slate-600'}`} />
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">09:30</p>
                    <p className="text-xs font-medium text-slate-200">Assegnato</p>
                </div>

                {/* Step 2: Transit/Arrived */}
                <div className={`bg-slate-800/50 rounded-xl p-3 border border-white/5 backdrop-blur-sm ${activeTicket.status === 'in_progress' ? 'ring-1 ring-blue-500/30 bg-blue-500/10' : ''}`}>
                    <div className={`w-2 h-2 rounded-full mb-2 ${['in_progress', 'resolved'].includes(activeTicket.status) ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]' : 'bg-slate-600'}`} />
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">IN CORSO</p>
                    <p className="text-xs font-medium text-slate-200">Riparazione</p>
                </div>

                {/* Step 3: Complete */}
                <div className="bg-slate-800/50 rounded-xl p-3 border border-white/5 backdrop-blur-sm opacity-50">
                    <div className="w-2 h-2 rounded-full mb-2 bg-slate-600" />
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">STIMA 11:00</p>
                    <p className="text-xs font-medium text-slate-200">Collaudo</p>
                </div>
            </div>
        </div>
    );
}
