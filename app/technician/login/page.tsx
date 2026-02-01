'use client';

import { useState, Suspense } from 'react';
import { createBrowserClient } from '@/lib/supabase-browser';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { loginTechnician } from '@/app/actions/technician-actions';
import { HardHat, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

function TechnicianLoginForm() {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [step, setStep] = useState<'PHONE' | 'PIN'>('PHONE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const supabase = createBrowserClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('next') || searchParams.get('redirect') || '/technician/dashboard';

  // 1. VERIFICA FORMATO TELEFONO
  const handlePhoneSubmit = async () => {
    setLoading(true);
    setError('');

    const cleanPhone = phone.trim();
    if (!cleanPhone.startsWith('+39')) {
      setError('Inserisci il prefisso +39');
      setLoading(false);
      return;
    }

    // Passiamo allo step PIN
    setStep('PIN');
    setLoading(false);
  };

  // 2. LOGIN CON PASSWORD (PIN)
  const handleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      // Usa la Server Action che gestisce normalizzazione, lookup e auth (cookie di sessione)
      const result = await loginTechnician(phone, pin);

      if (!result.success) {
        setError(result.message || 'Login fallito. Controlla numero e PIN.');
        setLoading(false);
        return;
      }

      // 4. SUCCESSO
      toast.success('Accesso effettuato!');
      router.push(redirectUrl);
      router.refresh(); // Refresh per aggiornare lo stato di auth (cookie)

    } catch (err) {
      setError('Errore durante il login.');
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-foreground selection:bg-blue-500/30">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-xl shadow-blue-900/20 dark:shadow-blue-500/10 mb-4 animate-in zoom-in duration-500">
            <HardHat className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
            Area Tecnici
          </h1>
          <p className="text-muted-foreground">Accedi al portale operativo</p>
        </div>

        <Card className="bg-card/80 backdrop-blur-xl border-border shadow-2xl">
          <CardHeader>
            <CardTitle className="text-center text-foreground">
              {step === 'PHONE' ? 'Login' : 'Codice Accesso'}
            </CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              {step === 'PHONE'
                ? "Inserisci il tuo numero aziendale"
                : `Inserisci il PIN per ${phone}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {step === 'PHONE' ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                <div className="space-y-2">
                  <Input
                    type="tel"
                    placeholder="+39 333 1234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handlePhoneSubmit()}
                    className="bg-secondary/50 border-border text-foreground focus:border-blue-500 transition-colors h-12 text-lg text-center tracking-wide"
                  />
                </div>
                <Button
                  onClick={handlePhoneSubmit}
                  disabled={loading || phone.length < 5}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02]"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <>Avanti <ArrowRight className="ml-2 w-4 h-4" /></>}
                </Button>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-2">
                  <Input
                    type="password"
                    placeholder="PIN (6 cifre)"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    className="bg-secondary/50 border-border text-foreground focus:border-blue-500 transition-colors h-14 text-center text-3xl tracking-[1em] font-mono"
                  />
                </div>
                <Button
                  onClick={handleLogin}
                  disabled={loading || pin.length < 6}
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02]"
                >
                  {loading ? <Loader2 className="animate-spin" /> : 'Accedi'}
                </Button>
                <div className="text-center">
                  <button
                    onClick={() => setStep('PHONE')}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors text-center hover:underline"
                  >
                    Hai sbagliato numero?
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm rounded-lg text-center font-medium animate-in zoom-in-95">
                {error}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function TechnicianLogin() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-blue-500 w-8 h-8" /></div>}>
      <TechnicianLoginForm />
    </Suspense>
  );
}