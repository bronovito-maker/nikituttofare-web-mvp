'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Home, Info, MessageSquare, LogIn, HardHat } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetTitle,
} from "@/components/ui/sheet";

export function MobileNav() {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();

    const menuItems = [
        { href: '/', label: 'Home', icon: Home },
        { href: '/about', label: 'Chi Siamo', icon: Info },
        { href: '/chat', label: 'Parla con Niki', icon: MessageSquare },
        { href: '/login', label: 'Area Clienti', icon: LogIn },
        { href: '/technician/login', label: 'Area Tecnici', icon: HardHat },
    ];

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative z-50 h-11 w-11 hover:bg-transparent"
                    aria-label="Open Menu"
                >
                    <Menu className="w-8 h-8" />
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85%] max-w-[320px] p-0 flex flex-col h-[100dvh] border-l border-border bg-background">
                <div className="flex items-center justify-between p-6 border-b border-border/50">
                    <SheetTitle className="font-bold text-2xl text-foreground tracking-tight">Menu</SheetTitle>
                </div>

                <nav className="flex-1 px-6 py-4 space-y-4 overflow-y-auto">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setOpen(false)} // Auto-close on click
                                className={`flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-200 group ${isActive
                                    ? 'bg-primary/10 text-primary font-bold'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                    }`}
                            >
                                <Icon className={`w-6 h-6 ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'} transition-colors`} />
                                <span className="text-lg font-bold">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-6 mt-auto space-y-6">
                    {/* Theme Toggle Row */}
                    <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-muted/50 border border-border">
                        <span className="text-sm font-medium text-foreground">Tema</span>
                        <ThemeToggle />
                    </div>
                    <p className="text-xs text-center text-slate-500">
                        © 2026 NikiTuttoFare
                    </p>
                </div>
            </SheetContent>
        </Sheet>
    );
}
