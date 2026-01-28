'use client';

import { useState, Suspense } from 'react';
import { createBrowserClient } from '@/lib/supabase-browser';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { verifyAndLinkTechnician } from '@/app/actions/admin-actions';
import { HardHat, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

function TechnicianLoginForm() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const supabase = createBrowserClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/dashboard';

  // 1. INVIA OTP
  const handleSendOtp = async () => {
    setLoading(true);
    setError('');

    const cleanPhone = phone.trim();
    if (!cleanPhone.startsWith('+39')) {
      setError('Inserisci il prefisso +39');
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      phone: cleanPhone,
    });

    if (error) {
      setError(error.message);
    } else {
      setStep('OTP');
      toast.success('Codice inviato via SMS');
    }
    setLoading(false);
  };

  // 2. VERIFICA OTP
  const handleVerifyOtp = async () => {
    setLoading(true);
    setError('');

    const { data, error } = await supabase.auth.verifyOtp({
      phone: phone.trim(),
      token: otp,
      type: 'sms',
    });

    if (error || !data.user) {
      setError('Codice non valido o scaduto');
      setLoading(false);
      return;
    }

    // 3. CHECK WHITELIST
    const linkResult = await verifyAndLinkTechnician(phone.trim(), data.user.id);

    if (!linkResult.success) {
      setError(linkResult.message || 'Accesso negato');
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    // 4. SUCCESSO
    toast.success('Accesso effettuato!');
    router.push(redirectUrl);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f172a] p-4 text-slate-200 selection:bg-blue-500/30">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-xl shadow-blue-900/20 mb-4 animate-in zoom-in duration-500">
            <HardHat className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
            Area Tecnici
          </h1>
          <p className="text-slate-400">Accedi al portale operativo</p>
        </div>

        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-xl shadow-2xl">
          <CardHeader>
            <CardTitle className="text-center text-slate-200">
              {step === 'PHONE' ? 'Login' : 'Verifica Sicurezza'}
            </CardTitle>
            <CardDescription className="text-center text-slate-500">
              {step === 'PHONE'
                ? "Inserisci il tuo numero aziendale"
                : `Inserisci il codice inviato a ${phone}`}
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
                    className="bg-slate-950/50 border-slate-700 text-slate-200 focus:border-blue-500 transition-colors h-12 text-lg text-center tracking-wide"
                  />
                </div>
                <Button
                  onClick={handleSendOtp}
                  disabled={loading || phone.length < 5}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02]"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <>Avanti <ArrowRight className="ml-2 w-4 h-4" /></>}
                </Button>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-2">
                  <Input
                    type="text"
                    placeholder="000000"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="bg-slate-950/50 border-slate-700 text-slate-200 focus:border-blue-500 transition-colors h-14 text-center text-3xl tracking-[1em] font-mono"
                  />
                </div>
                <Button
                  onClick={handleVerifyOtp}
                  disabled={loading || otp.length < 6}
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-900/20 transition-all hover:scale-[1.02]"
                >
                  {loading ? <Loader2 className="animate-spin" /> : 'Verifica Accesso'}
                </Button>
                <div className="text-center">
                  <button
                    onClick={() => setStep('PHONE')}
                    className="text-sm text-slate-500 hover:text-slate-300 transition-colors text-center hover:underline"
                  >
                    Hai sbagliato numero?
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-950/30 border border-red-900/50 text-red-400 text-sm rounded-lg text-center font-medium animate-in zoom-in-95">
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#0f172a]"><Loader2 className="animate-spin text-blue-500 w-8 h-8" /></div>}>
      <TechnicianLoginForm />
    </Suspense>
  );
}