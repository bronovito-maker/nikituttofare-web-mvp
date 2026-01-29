'use client';

import Link from 'next/link';
import { Home, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DashboardHeader() {
    return (
        <header className="fixed top-0 w-full z-50 bg-[#0f0f0f]/80 backdrop-blur-xl border-b border-white/5 h-16 flex items-center justify-between px-6">
            <div className="flex items-center gap-3">
                <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center font-bold text-white">N</div>
                    <span className="font-semibold text-white tracking-tight">NikiTuttofare</span>
                </Link>
            </div>
            <div className="flex items-center gap-2">
                <Button asChild variant="ghost" size="sm" className="hidden md:flex text-slate-400 hover:text-white gap-2">
                    <Link href="/">
                        <Home className="w-4 h-4" />
                        Torna al Sito
                    </Link>
                </Button>
                <form action="/auth/signout" method="post">
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                        <LogOut className="w-5 h-5" />
                    </Button>
                </form>
            </div>
        </header>
    );
}
