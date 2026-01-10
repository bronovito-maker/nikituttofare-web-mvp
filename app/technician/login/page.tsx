'use client';

import { useState } from 'react';
import { createBrowserClient } from '@/lib/supabase-browser';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { verifyAndLinkTechnician } from '@/app/actions/admin-actions'; // Importiamo la server action

export default function TechnicianLogin() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const supabase = createBrowserClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/dashboard'; // Default dashboard o claim

  // 1. INVIA OTP
  const handleSendOtp = async () => {
    setLoading(true);
    setError('');
    
    // Normalizza
    const cleanPhone = phone.trim();
    if (!cleanPhone.startsWith('+39')) {
      setError('Inserisci il prefisso +39');
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      phone: cleanPhone,
    });

    if (error) {
      setError(error.message);
    } else {
      setStep('OTP');
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

    // 3. CHECK WHITELIST (Lato Server per sicurezza)
    const linkResult = await verifyAndLinkTechnician(phone.trim(), data.user.id);

    if (!linkResult.success) {
      setError(linkResult.message || 'Accesso negato');
      await supabase.auth.signOut(); // Logout immediato se non autorizzato
      setLoading(false);
      return;
    }

    // 4. SUCCESSO
    router.push(redirectUrl);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
            🔧
          </div>
          <CardTitle>Portale Tecnici</CardTitle>
          <CardDescription>
            {step === 'PHONE' 
              ? "Inserisci il numero di telefono per accedere agli incarichi." 
              : `Inserisci il codice inviato a ${phone}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'PHONE' ? (
            <div className="space-y-4">
              <Input 
                type="tel" 
                placeholder="+39 333 1234567" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <Button 
                onClick={handleSendOtp} 
                disabled={loading || phone.length < 5} 
                className="w-full"
              >
                {loading ? 'Invio in corso...' : 'Invia Codice'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Input 
                type="text" 
                placeholder="123456" 
                className="text-center text-2xl tracking-widest"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
              <Button 
                onClick={handleVerifyOtp} 
                disabled={loading || otp.length < 6} 
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {loading ? 'Verifica...' : 'Accedi'}
              </Button>
              <button 
                onClick={() => setStep('PHONE')} 
                className="text-sm text-slate-500 w-full text-center hover:underline"
              >
                Cambia numero
              </button>
            </div>
          )}
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center font-medium">
              {error}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}