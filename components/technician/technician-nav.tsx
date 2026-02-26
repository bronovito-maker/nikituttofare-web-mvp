'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Menu, Home, MapPin, Briefcase, User, LogOut, ArrowLeft, X } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useEffect, useState } from 'react';

export function TechnicianNav() {
    const pathname = usePathname();
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const links = [
        { href: '/', label: 'Torna al Sito', icon: ArrowLeft },
        { href: '/technician/dashboard', label: 'Bacheca', icon: Home },
        { href: '/technician/claim', label: 'Nuovi Lavori', icon: MapPin },
        { href: '/technician/jobs', label: 'I Miei Interventi', icon: Briefcase },
        { href: '/technician/profile', label: 'Profilo', icon: User },
    ];

    const handleSignOut = () => {
        router.push('/auth/signout');
    };

    if (!isMounted) {
        return (
            <header className="sticky top-0 z-[9999] w-full border-b border-border bg-background/80 backdrop-blur-xl shadow-sm h-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="h-9 sm:h-11 w-9 sm:w-11 rounded-full bg-muted animate-pulse" />
                        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                    </div>
                </div>
            </header>
        );
    }

    return (
        <header className="sticky top-0 z-[9999] w-full border-b border-border bg-background/80 backdrop-blur-xl shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

                {/* Mobile Menu & Logo */}
                <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                    <Sheet open={open} onOpenChange={setOpen}>
                        <SheetTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="md:hidden relative z-50 h-11 w-11 hover:bg-transparent"
                                aria-label="Open Menu"
                            >
                                <Menu className="w-8 h-8" />
                                <span className="sr-only">Menu Tecnico</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[300px] sm:w-[350px] pr-0 [&>button]:hidden rounded-r-[2rem] border-r-border/50 bg-background/95 backdrop-blur-xl z-[10001] shadow-2xl">
                            <SheetTitle className="sr-only">Menu Navigazione Tecnico</SheetTitle>

                            {/* Static Toggle in Drawer */}
                            <div className="absolute top-2.5 left-4 md:hidden">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setOpen(false)}
                                    className="h-11 w-11 hover:bg-transparent text-foreground"
                                >
                                    <X className="w-8 h-8" />
                                </Button>
                            </div>

                            <div className="px-6 py-8 mt-12 border-b border-border/10">
                                <Link href="/technician/dashboard" className="flex items-center gap-3" onClick={() => setOpen(false)}>
                                    <div className="relative h-10 w-10 overflow-hidden rounded-full shadow-md border-2 border-white dark:border-slate-800">
                                        <Image src="/logo_ntf.svg" alt="NikiTech Logo" fill className="object-cover" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-black text-lg tracking-tight leading-none text-foreground">
                                            Niki<span className="text-blue-600">Tech</span>
                                        </span>
                                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Area Professionisti</span>
                                    </div>
                                </Link>
                            </div>
                            <nav className="flex flex-col gap-1 py-6 px-3">
                                {links.map((link) => {
                                    const Icon = link.icon;
                                    const isActive = pathname === link.href;
                                    const isExternal = link.href === '/';
                                    return (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            onClick={() => setOpen(false)}
                                            className={cn(
                                                "flex items-center gap-4 rounded-2xl px-4 py-4 text-lg font-bold transition-all duration-200",
                                                isActive
                                                    ? "bg-blue-600/10 text-blue-600 shadow-sm"
                                                    : isExternal
                                                        ? "text-blue-600/70 hover:bg-blue-50/50 hover:text-blue-600"
                                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                            )}
                                        >
                                            <Icon className={cn("h-6 w-6", isActive || isExternal ? "text-blue-600" : "text-muted-foreground")} />
                                            {link.label}
                                        </Link>
                                    );
                                })}
                            </nav>
                            <div className="absolute bottom-6 left-5 right-5 space-y-4">
                                <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 opacity-70">Status Operativo</p>
                                    <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-tight">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                                        </span>
                                        Sei Online
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    className="w-full h-12 rounded-2xl justify-start bg-red-50 border-red-200 text-red-600 hover:bg-red-600 hover:text-white dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-600 dark:hover:text-white transition-all font-bold text-sm uppercase px-5 shadow-sm"
                                    onClick={handleSignOut}
                                >
                                    <LogOut className="mr-3 h-5 w-5" /> Esci dal Portale
                                </Button>
                            </div>
                        </SheetContent>
                    </Sheet>

                    {/* Logo (Shared Style) */}
                    <Link href="/technician/dashboard" className="flex items-center gap-2 sm:gap-3">
                        <div className="relative h-9 sm:h-11 w-9 sm:w-11 overflow-hidden rounded-full shadow-md hover:shadow-lg transition-transform hover:scale-105 duration-200 border-2 border-white dark:border-slate-800 flex-shrink-0">
                            <Image src="/logo_ntf.svg" alt="NikiTuttoFare Logo" fill className="object-cover" priority />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm sm:text-base lg:text-lg font-black tracking-tight text-foreground leading-none">
                                Niki<span className="text-blue-600 dark:text-blue-400">Tech</span>
                            </span>
                            <span className="hidden sm:block text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Area Professionisti</span>
                        </div>
                    </Link>
                </div>
                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-8">
                    {links.map((link) => {
                        if (link.href === '/') return null; // Don't show "Torna al Sito" in desktop nav links, use a button or different style if needed
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    "text-sm font-bold transition-all hover:text-blue-600 relative py-1",
                                    isActive ? "text-blue-600" : "text-muted-foreground"
                                )}
                            >
                                {link.label}
                                {isActive && (
                                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Right Actions */}
                <div className="flex items-center gap-2 sm:gap-4">
                    {/* Status Indicator (Desktop) */}
                    <div className="hidden lg:flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1.5 rounded-full border border-emerald-200/50 dark:border-emerald-800/50">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                        </span>
                        <span>Sei Online</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <Button
                            variant="outline"
                            size="sm"
                            className="hidden md:flex h-9 rounded-full px-4 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 transition-all font-bold"
                            onClick={handleSignOut}
                        >
                            <LogOut className="h-4 w-4 mr-2" />
                            Esci
                        </Button>
                    </div>
                </div>
            </div>
        </header>
    );
}
