'use client';

import { Star, ShieldCheck } from 'lucide-react';

export function TechnicianPreview() {
    return (
        <div className="relative group w-full max-w-sm mx-auto">
            {/* Card Content */}
            <div className="relative z-10 bg-card rounded-2xl border border-border shadow-xl p-5 backdrop-blur-sm">

                {/* Header: Map & Status */}
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-full border border-emerald-100 dark:border-emerald-800">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span> In zona <strong>Marina Centro</strong> (5 min)</span>
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                        ETA: 84 min
                    </div>
                </div>

                {/* Technician Profile */}
                <div className="flex items-center gap-4">
                    <div className="relative w-14 h-14">
                        <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-background shadow-md">
                            {/* Nikita's avatar placeholder - consistent with hero */}
                            <div className="w-full h-full bg-slate-200 dark:bg-slate-700 flex items-center overflow-hidden">
                                <img src="/team-photo.png" alt="Nikita" className="w-full h-full object-cover" />
                            </div>
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                            <ShieldCheck className="w-5 h-5 text-blue-500 fill-blue-100 dark:fill-blue-900" />
                        </div>
                    </div>

                    <div>
                        <h4 className="font-bold text-base text-foreground leading-tight">
                            Nikita B.
                        </h4>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                            <span className="font-semibold text-foreground">5.0</span>
                            <span>(480+ interventi)</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">Specialista Manutenzioni • Rimini</p>
                    </div>
                </div>

                {/* Map Mock Background line */}
                <div className="mt-4 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 w-[70%] rounded-full animate-pulse" />
                </div>
            </div>

            {/* Decor elements - Hidden on mobile to prevent paint flash/reload feeling */}
            <div className="hidden md:block absolute -inset-0.5 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl blur-lg opacity-50 -z-10" />
        </div >
    );
}
