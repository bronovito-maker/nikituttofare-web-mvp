'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export function ActionTile() {
    return (
        <Link href="/chat" className="block h-full w-full group">
            <div className="h-full min-h-[180px] w-full rounded-[2rem] bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-white/5 p-6 relative overflow-hidden transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(37,99,235,0.15)] group-hover:border-blue-500/30">

                {/* Glow Effect */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-blue-600/20 rounded-full blur-3xl group-hover:bg-blue-500/30 transition-all duration-500" />

                <div className="relative z-10 flex flex-col h-full justify-between items-center text-center">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300">
                        <Sparkles className="w-6 h-6 text-white animate-pulse" />
                    </div>

                    <div className="space-y-1">
                        <h3 className="text-lg font-bold text-white">Nuova Richiesta</h3>
                        <p className="text-xs text-slate-400 font-medium">Chatta con Niki AI</p>
                    </div>

                    <div className="w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            </div>
        </Link>
    );
}
