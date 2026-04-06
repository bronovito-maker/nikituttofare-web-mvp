'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Menu, Home, MapPin, Briefcase, User, LogOut, ArrowLeft, X, Package } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export function TechnicianNav() {
    const pathname = usePathname();
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const links = [
        { href: '/technician/dashboard', label: 'Bacheca', icon: Home },
        { href: '/technician/claim', label: 'Nuovi Lavori', icon: MapPin },
        { href: '/technician/jobs', label: 'I Miei Interventi', icon: Briefcase },
        { href: '/technician/inventory', label: 'Furgone', icon: Package },
        { href: '/technician/profile', label: 'Profilo', icon: User },
        { href: '/', label: 'Torna al Sito', icon: ArrowLeft },
    ];

    const handleSignOut = () => {
        router.push('/auth/signout');
    };

    if (!isMounted) return null;

    return (
        <header className="sticky top-0 z-[9999] w-full border-b border-white/5 bg-background/80 backdrop-blur-xl shadow-sm pt-[env(safe-area-inset-top,20px)]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

                {/* Mobile & Desktop Shared Logo */}
                <div className="flex items-center gap-3">
                    <Link href="/technician/dashboard" className="flex items-center gap-2 group">
                        <div className="relative h-9 w-9 overflow-hidden rounded-xl shadow-md group-hover:shadow-blue-500/20 transition-all border border-white/10 flex-shrink-0">
                            <Image src="/logo_ntf.svg" alt="NikiTuttoFare Logo" fill className="object-cover" priority />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-lg lg:text-xl font-black tracking-tighter text-foreground leading-none">
                                Niki<span className="text-blue-600">Tech</span>
                            </span>
                            <span className="hidden sm:block text-[8px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">Professionisti</span>
                        </div>
                    </Link>
                </div>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-6">
                    {links.slice(0, 5).map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "text-sm font-semibold transition-all hover:text-blue-600 relative py-1",
                                pathname === link.href ? "text-blue-600" : "text-muted-foreground"
                            )}
                        >
                            {link.label}
                            {pathname === link.href && (
                                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                            )}
                        </Link>
                    ))}
                </nav>

                {/* Right Actions */}
                <div className="flex items-center gap-2 sm:gap-4">
                    <div className="hidden lg:flex items-center gap-2 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        ONLINE
                    </div>
                    <ThemeToggle />
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden h-10 w-10 text-muted-foreground"
                        onClick={handleSignOut}
                    >
                        <LogOut className="w-5 h-5" />
                    </Button>
                </div>
            </div>
        </header>
    );
}
