'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { UserTypeToggle } from '@/components/landing/user-type-toggle';
import { MessageCircle, LayoutDashboard, LogOut } from 'lucide-react';
import { MobileNav } from '@/components/layout/mobile-nav';
import { createBrowserClient } from '@/lib/supabase-browser';
import { useEffect, useState } from 'react';
import { useUserType } from '@/components/landing/user-type-context';

interface SiteHeaderProps {
    showUserTypeToggle?: boolean;
}

export function SiteHeader({ showUserTypeToggle = false }: Readonly<SiteHeaderProps>) {
    // Use context for user type state
    const { userType, setUserType } = showUserTypeToggle ? useUserType() : { userType: 'residential' as const, setUserType: () => {} };
    const pathname = usePathname();
    const isAboutPage = pathname === '/about';
    const [user, setUser] = useState<any>(null); // Keeping any for now to match current types, but adding safety
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const checkUser = async () => {
            try {
                const supabase = createBrowserClient();
                const { data, error } = await supabase.auth.getUser();
                if (!error && data?.user) {
                    setUser(data.user);
                }
            } catch (err) {
                console.error("Error fetching user in SiteHeader:", err);
            } finally {
                setIsLoaded(true);
            }
        };
        checkUser();
    }, []);

    return (
        <header className="sticky top-0 z-[9999] w-full border-b border-border bg-background shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                {/* Logo & Brand */}
                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    <Link href="/" className="flex items-center gap-2 sm:gap-3">
                        <div className="relative h-9 sm:h-11 w-9 sm:w-11 overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-shadow flex-shrink-0">
                            <Image src="/logo_ntf.png" alt="NTF Logo" fill className="object-cover" priority />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm sm:text-base lg:text-lg font-black tracking-tight text-foreground leading-none">
                                <span className="sm:hidden">NTF</span>
                                <span className="hidden sm:inline">Niki<span className="text-blue-600 dark:text-blue-400">Tuttofare</span></span>
                            </span>
                            <span className="hidden sm:block text-xs text-muted-foreground font-medium">Pronto Intervento H24</span>
                        </div>
                    </Link>
                </div>

                {/* Center Toggle - Desktop (Only if enabled) */}
                {showUserTypeToggle && (
                    <div className="hidden md:flex flex-1 justify-center px-4">
                        <UserTypeToggle value={userType} onChange={setUserType} />
                    </div>
                )}

                {/* Right Actions */}
                <div className="flex items-center gap-2 sm:gap-4">
                    {/* Navigation Links or Contextual CTA */}
                    <nav className="hidden md:flex items-center gap-4 mr-2">
                        {isAboutPage ? (
                            <Button
                                asChild
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-500/20 animate-in fade-in"
                            >
                                <Link href="/chat">
                                    <MessageCircle className="w-4 h-4 mr-2" />
                                    Avvia Chat
                                </Link>
                            </Button>
                        ) : (
                            <Link
                                href="/about"
                                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Chi Siamo
                            </Link>
                        )}
                    </nav>

                    {/* Active Badge (Hidden on small screens) */}
                    <div className="hidden lg:flex items-center gap-2 text-xs sm:text-sm font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1.5 rounded-full border border-emerald-200/50 dark:border-emerald-800/50">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                        </span>
                        <span className="hidden xl:inline">Tecnici attivi su <strong>Rimini e Provincia</strong></span>
                    </div>

                    <div className="hidden md:flex items-center gap-2">
                        <ThemeToggle />
                        {isLoaded && (
                            user ? (
                                <div className="flex items-center gap-2">
                                    <Button asChild variant="ghost" size="sm" className="text-xs sm:text-sm rounded-full px-4">
                                        <Link href={user.user_metadata?.role === 'technician' ? "/technician/dashboard" : "/dashboard"}>
                                            <LayoutDashboard className="w-4 h-4 mr-2" />
                                            Dashboard
                                        </Link>
                                    </Button>
                                    <Button asChild variant="outline" size="sm" className="text-xs sm:text-sm rounded-full px-4 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
                                        <Link href="/auth/signout">
                                            <LogOut className="w-4 h-4 mr-2" />
                                            Esci
                                        </Link>
                                    </Button>
                                </div>
                            ) : (
                                <Button asChild size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm rounded-full px-5 shadow-lg transition-all hover:scale-105">
                                    <Link href="/login">Area Riservata</Link>
                                </Button>
                            )
                        )}
                    </div>

                    <div className="md:hidden">
                        <MobileNav />
                    </div>
                </div>
            </div>

            {/* Mobile Toggle Row (Only if enabled) */}
            {showUserTypeToggle && (
                <div className="md:hidden border-t border-border bg-card/50 p-2 flex justify-center">
                    <UserTypeToggle value={userType} onChange={setUserType} />
                </div>
            )}
        </header>
    );
}
