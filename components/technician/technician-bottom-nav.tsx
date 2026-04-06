'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, MapPin, Briefcase, Package, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

export function TechnicianBottomNav() {
    const pathname = usePathname();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const links = [
        { href: '/technician/dashboard', label: 'Bacheca', icon: Home },
        { href: '/technician/claim', label: 'Nuovi', icon: MapPin },
        { href: '/technician/jobs', label: 'Interventi', icon: Briefcase },
        { href: '/technician/inventory', label: 'Furgone', icon: Package },
        { href: '/technician/profile', label: 'Profilo', icon: User },
    ];

    if (!isMounted) return null;

    // Se siamo su una pagina particolare (es. chat full screen) potremmo volerla nascondere
    // ma la lasceremo visibile di default. La user experience generale in Android lo copre se c'è z-index < 10002

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-[9900] bg-background/95 backdrop-blur-2xl border-t border-white/10 pb-[env(safe-area-inset-bottom,16px)] shadow-[0_-15px_40px_-15px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-around h-16 px-1">
                {links.map((link) => {
                    const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== '/technician/dashboard' && link.href !== '/');
                    return (
                        <Link 
                            key={link.href} 
                            href={link.href}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full space-y-1 relative group transition-colors select-none touch-manipulation",
                                isActive ? "text-blue-500" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {isActive && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-blue-500 rounded-b-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                            )}
                            <div className={cn(
                                "p-1.5 rounded-xl transition-all duration-300", 
                                isActive ? "bg-blue-500/10 text-blue-400" : ""
                            )}>
                                <link.icon className={cn(
                                    "w-6 h-6 transition-transform duration-300",
                                    isActive ? "scale-110 stroke-[2.5]" : "stroke-[1.5] group-hover:scale-110"
                                )} />
                            </div>
                            <span className={cn(
                                "text-[10px] tracking-tight truncate w-full text-center px-1 font-medium leading-none pb-1",
                                isActive ? "font-bold text-blue-500" : ""
                            )}>
                                {link.label}
                            </span>
                        </Link>
                    )
                })}
            </div>
        </div>
    );
}
