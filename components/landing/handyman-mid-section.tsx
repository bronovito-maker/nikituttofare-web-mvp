'use client';

import Link from 'next/link';
import { ArrowRight, User, Star, Camera } from 'lucide-react';

export function HandymanMidSection() {
    return (
        <section className="py-16 px-6 bg-[#0a0a0a] border-y border-white/5">
            <div className="max-w-xl mx-auto space-y-8">
                <div className="text-center space-y-2">
                    <p className="text-white/60 font-medium text-lg leading-relaxed">
                        Vuoi sapere di più su di me e sui miei lavori?
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                    <Link
                        href="/#about"
                        className="group flex items-center justify-between p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.05] transition-all"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                                <User className="w-5 h-5" />
                            </div>
                            <span className="font-bold text-white/90">Chi sono</span>
                        </div>
                        <ArrowRight className="w-5 h-5 text-white/20 group-hover:text-white/50 group-hover:translate-x-1 transition-all" />
                    </Link>

                    <Link
                        href="/#reviews"
                        className="group flex items-center justify-between p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.05] transition-all"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                                <Star className="w-5 h-5 fill-current" />
                            </div>
                            <span className="font-bold text-white/90">Recensioni</span>
                        </div>
                        <ArrowRight className="w-5 h-5 text-white/20 group-hover:text-white/50 group-hover:translate-x-1 transition-all" />
                    </Link>

                    <Link
                        href="/#works"
                        className="group flex items-center justify-between p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.05] transition-all"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                                <Camera className="w-5 h-5" />
                            </div>
                            <span className="font-bold text-white/90">Lavori reali</span>
                        </div>
                        <ArrowRight className="w-5 h-5 text-white/20 group-hover:text-white/50 group-hover:translate-x-1 transition-all" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
