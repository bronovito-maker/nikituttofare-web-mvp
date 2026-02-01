'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Home, Info, MessageSquare, LogIn, HardHat } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle'; // Keeping if needed elsewhere, but replacing usage here
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';

export function MobileNav() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();
    const { setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Close menu when route changes
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    // Prevent body scroll when menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const menuItems = [
        { href: '/', label: 'Home', icon: Home },
        { href: '/about', label: 'Chi Siamo', icon: Info },
        { href: '/chat', label: 'Parla con Niki', icon: MessageSquare },
        { href: '/login', label: 'Area Clienti', icon: LogIn },
        { href: '/technician/login', label: 'Area Tecnici', icon: HardHat },
    ];

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(true)}
                className="relative z-50 h-11 w-11 hover:bg-transparent"
                aria-label="Open Menu"
            >
                <Menu className="w-8 h-8" />
            </Button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop - z-[10000] to be above Header (z-9999) */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm"
                        />

                        {/* Drawer - z-[10001] to be above Backdrop */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed right-0 top-0 bottom-0 z-[10001] w-[85%] max-w-[320px] bg-background border-l border-border shadow-2xl flex flex-col h-[100dvh]"
                        >
                            <div className="flex items-center justify-between p-6 border-b border-border/50">
                                <span className="font-bold text-2xl text-foreground tracking-tight">Menu</span>
                            </div>

                            <nav className="flex-1 px-6 py-4 space-y-4 overflow-y-auto">
                                {menuItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = pathname === item.href;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setIsOpen(false)}
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
                                    <span className="text-sm font-medium text-foreground sr-only">Tema</span>
                                    <Button
                                        variant="ghost"
                                        className="w-full justify-start gap-2"
                                        onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                                    >
                                        {mounted ? (
                                            <>
                                                {resolvedTheme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                                                <span>{resolvedTheme === 'dark' ? 'Modalità Chiara' : 'Modalità Scura'}</span>
                                            </>
                                        ) : (
                                            <span className="w-5 h-5" /> // Placeholder to prevent layout shift
                                        )}
                                    </Button>
                                </div>
                                <p className="text-xs text-center text-slate-500">
                                    © 2026 NikiTuttoFare
                                </p>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
