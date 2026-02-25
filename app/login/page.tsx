'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RetroGrid } from '@/components/react-bits/RetroGrid';
import { BlurText } from '@/components/react-bits/BlurText';
import { ClientAnimationWrapper } from '@/components/ui/client-animation-wrapper';
import { LoadingSpinner } from '@/components/ui/loading-dots';
import { createBrowserClient } from '@/lib/supabase-browser';

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserClient(), []);

  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email?.includes('@')) {
      setError('Inserisci un indirizzo email valido');
      return;
    }
    setIsLoading(true);

    try {
      // Redirect to auth callback which will exchange code for session on server
      // Check for 'next' or 'redirect' param in the URL
      const params = new URLSearchParams(globalThis.location.search);
      const nextParam = params.get('next') ?? params.get('redirect') ?? '/dashboard';

      const redirectTo = `${globalThis.location.origin}/auth/callback?next=${encodeURIComponent(nextParam)}`;
      const { error: magicError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      if (magicError) {
        setError(magicError.message);
      } else {
        setEmailSent(true);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Errore nell\'invio del Magic Link. Riprova.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestAccess = () => {
    router.push('/chat');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">

      {/* Header Minimal */}
      <header className="sticky top-0 z-50 w-full border-b border-border/30 bg-background/75 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 sm:gap-3">
            <div className="relative h-9 sm:h-11 w-9 sm:w-11 overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <Image src="/logo_ntf.svg" alt="NikiTuttoFare Logo" fill className="object-cover" />
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-base sm:text-lg font-black tracking-tight text-foreground leading-none">
                Niki<span className="text-blue-600 dark:text-blue-400">Tuttofare</span>
              </span>
              <span className="text-xs text-muted-foreground font-medium">Pronto Intervento H24</span>
            </div>
          </Link>

          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-3 sm:px-4 py-1.5 rounded-full border border-emerald-200/50 dark:border-emerald-900/50">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600 dark:bg-emerald-500"></span>
            </span>
            <span className="hidden sm:inline">Operativi H24</span>
            <span className="sm:hidden">H24</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:py-16 relative">
        <RetroGrid className="absolute inset-0 z-0 opacity-15 dark:opacity-10" />

        <div className="relative z-10 w-full max-w-md">

          {/* Card Login */}
          <ClientAnimationWrapper delay={0.1} duration={0.6}>
            <div className="bg-card/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/5 dark:shadow-black/20 border border-border/50 overflow-hidden">

              {/* Header Card */}
              <div className="px-6 sm:px-8 pt-8 pb-6 text-center space-y-3 bg-gradient-to-b from-background/50 to-transparent">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-lg shadow-blue-500/25 mb-2">
                  <Mail className="w-8 h-8 text-white" />
                </div>
                <BlurText
                  text="Accedi con Magic Link"
                  className="text-2xl sm:text-3xl font-black text-foreground"
                  delay={0.15}
                />
                <p className="text-sm text-muted-foreground">
                  Inserisci la tua email: ti invieremo un link sicuro per accedere.
                </p>
              </div>

              {/* Form */}
              <div className="px-6 sm:px-8 pb-8 pt-2">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Error Message */}
                  {error && (
                    <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
                      <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {error}
                    </div>
                  )}

                  {/* Email Field */}
                  <Input
                    label="Email"
                    type="email"
                    placeholder="mario@esempio.it"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    icon={<Mail className="w-5 h-5" />}
                    required
                    className="bg-background"
                  />

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 sm:h-14 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    {isLoading ? (
                      <LoadingSpinner size="sm" className="text-primary-foreground" />
                    ) : (
                      <>
                        Invia Magic Link
                        <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </Button>

                  {emailSent && (
                    <div className="p-4 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 text-green-800 dark:text-green-300 text-sm flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">Email inviata!</p>
                        <p className="text-green-700 dark:text-green-400">Controlla la casella di posta e clicca sul link per accedere.</p>
                      </div>
                    </div>
                  )}
                </form>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-4 text-muted-foreground font-medium">oppure</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGuestAccess}
                  className="w-full inline-flex items-center justify-center px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg shadow-orange-200/50 hover:from-orange-700 hover:to-orange-600 hover:shadow-xl hover:scale-105 active:scale-100 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 h-12 sm:h-14 text-base group"
                >
                  Richiedi Intervento Ora
                  <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                </button>

                <p className="text-center text-xs text-muted-foreground mt-4">
                  Puoi richiedere un intervento anche senza registrarti
                </p>
              </div>
            </div>
          </ClientAnimationWrapper>

          {/* Trust Badges */}
          <ClientAnimationWrapper delay={0.3} duration={0.6}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-green-600 dark:text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Dati protetti</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-blue-600 dark:text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span>Risposta in 60 min</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-orange-600 dark:text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span>4.9/5 recensioni</span>
              </div>
            </div>
          </ClientAnimationWrapper>

        </div>
      </main>

      {/* Footer Minimal */}
      <footer className="py-6 text-center border-t border-border/30 bg-background/50 backdrop-blur-sm">
        <p className="text-xs text-muted-foreground">
          © 2024 NikiTuttoFare • <Link href="/" className="hover:text-foreground transition-colors">Home</Link> • Privacy • Termini
        </p>
      </footer>
    </div>
  );
}
