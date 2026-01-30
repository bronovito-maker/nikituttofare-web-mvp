'use client';

import Link from 'next/link';
import { Home, FileText, User } from 'lucide-react';

export function MobileNav() {
    const navItems = [
        { icon: Home, label: 'Home', active: true, href: '/dashboard' },
        { icon: FileText, label: 'Asset', active: false, href: '/dashboard/assets' },
        { icon: User, label: 'Profilo', active: false, href: '/dashboard/profile' },
    ];

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-card/90 backdrop-blur-2xl border border-border rounded-full p-2 flex justify-around items-center z-50 shadow-2xl md:hidden">
            {navItems.map((item) => (
                <Link key={item.label} href={item.href} className={`flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all ${item.active ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/40' : 'text-muted-foreground hover:text-foreground'}`}>
                    <item.icon className="w-5 h-5" />
                </Link>
            ))}
        </div>
    );
}
