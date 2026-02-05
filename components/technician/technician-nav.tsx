'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Menu, Home, MapPin, Briefcase, User, LogOut } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useState } from 'react';

export function TechnicianNav() {
    const pathname = usePathname();
    const router = useRouter();
    const [open, setOpen] = useState(false);

    const links = [
        { href: '/technician/dashboard', label: 'Bacheca', icon: Home },
        { href: '/technician/claim', label: 'Nuovi Lavori', icon: MapPin },
        { href: '/technician/jobs', label: 'I Miei Interventi', icon: Briefcase },
        { href: '/technician/profile', label: 'Profilo', icon: User },
    ];

    const handleSignOut = () => {
        router.push('/auth/signout');
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center justify-between">

                {/* Mobile Menu & Logo */}
                <div className="flex items-center gap-2 md:gap-4">
                    <Sheet open={open} onOpenChange={setOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="md:hidden">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Menu Tecnico</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="pr-0 [&>button]:hidden">
                            <SheetTitle className="sr-only">Menu Navigazione Tecnico</SheetTitle>
                            <div className="px-7">
                                <Link href="/technician/dashboard" className="flex items-center" onClick={() => setOpen(false)}>
                                    <span className="font-bold text-xl">Niki<span className="text-primary">Tech</span></span>
                                </Link>
                            </div>
                            <div className="grid gap-2 py-6 px-4">
                                {links.map((link) => {
                                    const Icon = link.icon;
                                    return (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            onClick={() => setOpen(false)}
                                            className={cn(
                                                "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
                                                pathname === link.href ? "bg-accent/50 text-accent-foreground" : "text-muted-foreground"
                                            )}
                                        >
                                            <Icon className="h-4 w-4" />
                                            {link.label}
                                        </Link>
                                    );
                                })}
                            </div>
                            <div className="absolute bottom-4 left-4 right-4">
                                <Button variant="outline" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20" onClick={handleSignOut}>
                                    <LogOut className="mr-2 h-4 w-4" /> Logout
                                </Button>
                            </div>
                        </SheetContent>
                    </Sheet>

                    {/* Logo (Desktop) / Brand (Mobile) */}
                    <Link href="/technician/dashboard" className="flex items-center gap-2">
                        <span className="font-black text-lg tracking-tight">
                            Niki<span className="text-primary">Tuttofare</span>
                            <span className="ml-2 text-xs font-normal text-muted-foreground bg-secondary px-2 py-0.5 rounded-full hidden sm:inline-block">Tech</span>
                        </span>
                    </Link>
                </div>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                    {links.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "transition-colors hover:text-foreground/80",
                                pathname === link.href ? "text-foreground" : "text-foreground/60"
                            )}
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>

                {/* Right Actions */}
                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <Button variant="ghost" size="icon" className="hidden md:flex text-muted-foreground hover:text-destructive" onClick={handleSignOut}>
                        <LogOut className="h-5 w-5" />
                    </Button>
                </div>
            </div>
        </header>
    );
}
