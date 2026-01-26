'use client';

import Link from 'next/link';
import { HeroTile } from '@/components/dashboard/hero-tile';
import { ActionTile } from '@/components/dashboard/action-tile';
import { LoyaltyTile } from '@/components/dashboard/loyalty-tile';
import { LogOut, Home, FileText, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CustomerDashboardProps {
    readonly initialTickets: any[]; // Using loose type for speed without blocking on complex DB types
}

export function CustomerDashboard({ initialTickets }: CustomerDashboardProps) {
    const activeTicket = initialTickets.find(t => ['new', 'assigned', 'in_progress'].includes(t.status));

    // Bottom Navigation Items (Mobile First Concept)
    const navItems = [
        { icon: Home, label: 'Home', active: true, href: '/dashboard' },
        { icon: FileText, label: 'Asset', active: false, href: '/dashboard/assets' },
        { icon: User, label: 'Profilo', active: false, href: '/dashboard/profile' },
    ];

    return (
        <div className="min-h-screen bg-[#0f0f0f] text-slate-200 pb-24 md:pb-8 selection:bg-emerald-500/30">

            {/* Top Bar */}
            <header className="fixed top-0 w-full z-50 bg-[#0f0f0f]/80 backdrop-blur-xl border-b border-white/5 h-16 flex items-center justify-between px-6">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center font-bold text-white">N</div>
                    <span className="font-semibold text-white tracking-tight">NikiTuttofare</span>
                </div>
                <form action="/auth/signout" method="post">
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                        <LogOut className="w-5 h-5" />
                    </Button>
                </form>
            </header>

            {/* Main Content: Bento Grid */}
            <main className="container mx-auto max-w-5xl px-4 pt-24 space-y-6">

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 auto-rows-[minmax(180px,auto)]">

                    {/* Tile A: Hero (Spans full width on mobile, 8 cols on desktop) */}
                    <div className="md:col-span-8 md:row-span-2">
                        <HeroTile activeTicket={activeTicket} />
                    </div>

                    {/* Tile B: Action (Spans half on mobile, 4 cols on desktop) */}
                    <div className="md:col-span-4">
                        <ActionTile />
                    </div>

                    {/* Tile C: Loyalty (Spans half on mobile, 4 cols on desktop) */}
                    <div className="md:col-span-4">
                        <LoyaltyTile />
                    </div>

                </div>

                {/* Digital Passport Section (Mock) */}
                <section className="pt-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-white">Digital Passport</h2>
                        <Button variant="link" className="text-blue-400 text-sm">Vedi tutti gli asset</Button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {['Caldaia Vaillant', 'Climatizzatore Daikin', 'Impianto Elettrico', 'Porta Blindata'].map((item) => (
                            <div key={item} className="aspect-square rounded-2xl bg-[#151515] border border-white/5 p-4 flex flex-col justify-end hover:bg-[#1a1a1a] transition-colors cursor-pointer group">
                                <div className="w-10 h-10 rounded-full bg-[#1f1f1f] flex items-center justify-center mb-auto group-hover:scale-110 transition-transform">
                                    <FileText className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                                </div>
                                <p className="text-sm font-medium text-slate-300">{item}</p>
                                <p className="text-[10px] text-slate-500 mt-1">Ultimo check: 12/2024</p>
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            {/* Mobile Bottom Navigation (Thumb Zone) */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-[#1a1a1a]/90 backdrop-blur-2xl border border-white/10 rounded-full p-2 flex justify-around items-center z-50 shadow-2xl md:hidden">
                {navItems.map((item) => (
                    <Link key={item.label} href={item.href} className={`flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all ${item.active ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/40' : 'text-slate-500 hover:text-white'}`}>
                        <item.icon className="w-5 h-5" />
                    </Link>
                ))}
            </div>
        </div>
    );
}
