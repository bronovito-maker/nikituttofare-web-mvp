'use client';

import { Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function LoyaltyTile() {
    return (
        <div className="h-full min-h-[180px] w-full rounded-[2rem] bg-[#121212] border border-white/5 p-6 relative overflow-hidden flex flex-col justify-between">
            {/* Background Decoration */}
            <div className="absolute -right-4 -top-4 w-20 h-20 bg-amber-500/10 rounded-full blur-2xl" />

            <div className="relative z-10 flex justify-between items-start">
                <Badge variant="outline" className="border-amber-500/30 text-amber-500 bg-amber-500/5 text-[10px] tracking-widest uppercase">
                    Gold Member
                </Badge>
                <Star className="w-5 h-5 text-amber-500 fill-amber-500/20" />
            </div>

            <div className="relative z-10 mt-2">
                <div className="flex items-end gap-2 mb-1">
                    <span className="text-3xl font-bold text-white tracking-tighter">850</span>
                    <span className="text-xs text-slate-500 font-medium mb-1.5">/ 1000 Punti</span>
                </div>

                {/* Progress Bar */}
                <div className="h-1.5 w-full bg-[#1f1f1f] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-amber-600 to-yellow-400 w-[85%] rounded-full shadow-[0_0_10px_rgba(245,158,11,0.4)]" />
                </div>
                <p className="text-[10px] text-slate-400 mt-2 text-right">
                    +150 per Manutenzione Gratis
                </p>
            </div>
        </div>
    );
}
