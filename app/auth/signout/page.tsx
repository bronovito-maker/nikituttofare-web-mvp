'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { LogOut, CheckCircle2, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BlurText } from '@/components/react-bits/BlurText';
import { ClientAnimationWrapper } from '@/components/ui/client-animation-wrapper';
import { LoadingSpinner } from '@/components/ui/loading-dots';
import { createBrowserClient } from '@/lib/supabase-browser';

export default function SignOutPage() {
    const router = useRouter();
    const supabase = useMemo(() => createBrowserClient(), []);

    const [isLoading, setIsLoading] = useState(false);
    const [isSignedOut, setIsSignedOut] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSignOut = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const { error: signOutError } = await supabase.auth.signOut();

            if (signOutError) {
                setError(signOutError.message);
            } else {
                setIsSignedOut(true);
                // Redirect to home after 1 second
                setTimeout(() => {
                    router.push('/');
                }, 1000);
            }
        } catch (err) {
            console.error('Sign out error:', err);
            setError('Errore durante il logout. Riprova.');
        } finally {
            setIsLoading(false);
        }
    }, [supabase, router]);

    // Auto sign out on mount
    useEffect(() => {
        const performSignOut = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await handleSignOut();
            } else {
                setIsSignedOut(true);
            }
        };
        performSignOut();
    }, [supabase, handleSignOut]);

    return (
        <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">

            {/* Subtle animated gradient orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
            </div>

            {/* Header Minimal */}
            <header className="sticky top-0 z-50 w-full border-b border-border/30 bg-background/75 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 sm:gap-3">
                        <div className="relative h-9 sm:h-11 w-9 sm:w-11 overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-shadow">
                            <Image src="/logo_ntf.png" alt="NTF Logo" fill className="object-cover" />
                        </div>
                        <div className="hidden sm:flex flex-col">
                            <span className="text-base sm:text-lg font-black tracking-tight text-foreground leading-none">
                                Niki<span className="text-blue-600 dark:text-blue-400">Tuttofare</span>
                            </span>
                            <span className="text-xs text-muted-foreground font-medium">Pronto Intervento H24</span>
                        </div>
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center p-4 sm:p-8 relative z-10">
                <div className="w-full max-w-md">

                    {/* Sign Out Card */}
                    <ClientAnimationWrapper delay={0.1}>
                        <div className="relative text-center">

                            {isSignedOut ? (
                                /* Success State */
                                <div className="py-4">
                                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-6">
                                        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                                    </div>

                                    <BlurText
                                        text="Logout effettuato!"
                                        className="text-2xl sm:text-3xl font-bold text-foreground mb-3"
                                        delay={50}
                                    />

                                    <p className="text-muted-foreground mb-8">
                                        Sei stato disconnesso con successo.<br />
                                        A presto! 👋
                                    </p>

                                    <Link href="/">
                                        <Button
                                            size="lg"
                                            className="w-full h-12 sm:h-14 text-base sm:text-lg font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25"
                                        >
                                            <Home className="w-5 h-5 mr-2" />
                                            Torna alla Home
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                /* Sign Out Form */
                                <div>
                                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 mb-6">
                                        <LogOut className="w-10 h-10 text-red-500" />
                                    </div>

                                    <BlurText
                                        text="Vuoi uscire?"
                                        className="text-2xl sm:text-3xl font-bold text-foreground mb-3"
                                        delay={50}
                                    />

                                    <p className="text-muted-foreground mb-8">
                                        Conferma per effettuare il logout dal tuo account.
                                    </p>

                                    {error && (
                                        <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-sm">
                                            {error}
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        <Button
                                            onClick={handleSignOut}
                                            disabled={isLoading}
                                            size="lg"
                                            className="w-full h-12 sm:h-14 text-base sm:text-lg font-semibold rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/25"
                                        >
                                            {isLoading ? (
                                                <LoadingSpinner />
                                            ) : (
                                                <>
                                                    <LogOut className="w-5 h-5 mr-2" />
                                                    Esci dall&apos;account
                                                </>
                                            )}
                                        </Button>

                                        <Link href="/dashboard">
                                            <Button
                                                variant="ghost"
                                                size="lg"
                                                className="w-full h-12 text-base font-medium text-muted-foreground hover:text-foreground"
                                            >
                                                Annulla
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    </ClientAnimationWrapper>
                </div>
            </main>

            {/* Footer */}
            <footer className="py-6 border-t border-border/30 bg-background/50">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-xs text-muted-foreground">
                        © {new Date().getFullYear()} NikiTuttofare. Tutti i diritti riservati.
                    </p>
                </div>
            </footer>
        </div>
    );
}
