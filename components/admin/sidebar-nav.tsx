'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase-browser';

import {
    Users,
    Ticket,
    Settings,
    LogOut,
    LayoutGrid
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function SidebarNav({ expanded = false }: { readonly expanded?: boolean }) {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createBrowserClient();

    const navItems = [
        { icon: LayoutGrid, label: 'Dashboard', href: '/admin' },
        { icon: Ticket, label: 'Ticket', href: '/admin/tickets' },
        { icon: Users, label: 'Tecnici', href: '/admin/technicians' },
        { icon: Settings, label: 'Settings', href: '/admin/settings' },
    ];

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.refresh(); // Pulisce la cache
        window.location.href = '/login'; // Redirect forzato
    };

    return (
        <div className={`flex flex-col ${expanded ? 'items-start px-4' : 'items-center'} py-6 w-full h-full gap-6`}>
            {/* Brand Icon - Link to Home */}
            <Link href="/" title="Torna al Sito" className={expanded ? "flex items-center gap-3 mb-4 w-full" : ""}>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20 hover:opacity-80 transition-opacity cursor-pointer flex-shrink-0">
                    <span className="font-black text-white text-lg">N</span>
                </div>
                {expanded && <span className="text-xl font-bold text-white tracking-tight">NikiTuttoFare</span>}
            </Link>

            <div className={`flex-1 flex flex-col gap-4 w-full ${!expanded && 'px-2'}`}>
                <TooltipProvider delayDuration={0}>
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        const content = (
                            <Link href={item.href} className={expanded ? "w-full" : ""}>
                                <Button
                                    variant="ghost"
                                    size={expanded ? "lg" : "icon"}
                                    className={`${expanded
                                        ? 'w-full justify-start h-14 px-4 gap-4 text-base font-medium'
                                        : 'w-12 h-12 justify-center'
                                        } rounded-xl transition-all duration-200 ${isActive
                                            ? 'bg-blue-600/10 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)] border border-blue-500/20'
                                            : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/50'
                                        }`}
                                >
                                    <item.icon className={expanded ? "w-6 h-6" : "w-5 h-5"} />
                                    <span className={expanded ? "" : "sr-only"}>{item.label}</span>
                                </Button>
                            </Link>
                        );

                        if (expanded) {
                            return <div key={item.label} className="w-full">{content}</div>;
                        }

                        return (
                            <Tooltip key={item.label}>
                                <TooltipTrigger asChild>
                                    {content}
                                </TooltipTrigger>
                                <TooltipContent side="right" className="bg-[#1a1a1a] border-slate-800 text-slate-200 font-medium">
                                    {item.label}
                                </TooltipContent>
                            </Tooltip>
                        );
                    })}
                </TooltipProvider>
            </div>

            <div className={`mt-auto ${expanded ? 'w-full' : 'px-2'}`}>
                <TooltipProvider>
                    {(() => {
                        const logoutBtn = (
                            <Button
                                variant="ghost"
                                size={expanded ? "lg" : "icon"}
                                onClick={handleLogout}
                                className={`${expanded
                                    ? 'w-full justify-start h-14 px-4 gap-4 text-base font-medium'
                                    : 'w-12 h-12 justify-center'
                                    } rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-900/10`}
                            >
                                <LogOut className={expanded ? "w-6 h-6" : "w-5 h-5"} />
                                <span className={expanded ? "" : "sr-only"}>Disconnetti</span>
                            </Button>
                        );

                        if (expanded) return <div className="w-full">{logoutBtn}</div>;

                        return (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    {logoutBtn}
                                </TooltipTrigger>
                                <TooltipContent side="right" className="bg-[#1a1a1a] border-slate-800 text-red-400">
                                    Disconnetti
                                </TooltipContent>
                            </Tooltip>
                        );
                    })()}
                </TooltipProvider>
            </div>
        </div>
    );
}
