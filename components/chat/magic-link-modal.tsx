'use client';

import { useMemo, useState } from 'react';
import { X, Mail, Loader2, CheckCircle2, ArrowRight, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createBrowserClient } from '@/lib/supabase-browser';

interface MagicLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (email: string) => void;
  title?: string;
  description?: string;
}

export function MagicLinkModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  title = "Conferma la tua richiesta",
  description = "Inserisci la tua email per ricevere un link di accesso sicuro e confermare l'intervento."
}: MagicLinkModalProps) {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!email || !email.includes('@')) {
      setError('Inserisci un indirizzo email valido');
      return;
    }

    setIsLoading(true);

    try {
      // Redirect directly to /chat - the browser client with detectSessionInUrl: true
      // will automatically exchange the code for a session
      const redirectTo = `${window.location.origin}/chat`;
      const { error: magicError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      if (magicError) {
        setError(magicError.message);
      } else {
        setIsSent(true);
        onSuccess(email);
      }
    } catch (err) {
      setError('Errore nell\'invio del link. Riprova.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueAsGuest = () => {
    onSuccess('guest@ntf.local');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors z-10"
        >
          <X className="w-5 h-5 text-slate-500" />
        </button>

        {!isSent ? (
          <>
            {/* Header */}
            <div className="px-6 sm:px-8 pt-8 pb-6 text-center bg-gradient-to-b from-blue-50 to-white">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-lg shadow-blue-500/25 mb-4">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">
                {title}
              </h2>
              <p className="text-sm text-slate-500">
                {description}
              </p>
            </div>

            {/* Form */}
            <div className="px-6 sm:px-8 pb-8">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Error */}
                {error && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </div>
                )}

                {/* Email Input */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      placeholder="tuaemail@esempio.it"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-100 border-0 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading || !email}
                  className="w-full h-12 sm:h-14 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-base shadow-lg shadow-slate-200/50 transition-all hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Invio in corso...
                    </>
                  ) : (
                    <>
                      Invia Magic Link
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </>
                  )}
                </Button>

                {/* Divider */}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-4 text-slate-400 font-medium">oppure</span>
                  </div>
                </div>

                {/* Continue as Guest */}
                <button
                  type="button"
                  onClick={handleContinueAsGuest}
                  className="w-full py-3 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  Continua senza registrazione
                </button>

                {/* Trust Badge */}
                <div className="flex items-center justify-center gap-2 text-xs text-slate-500 pt-2">
                  <Shield className="w-4 h-4 text-green-600" />
                  <span>I tuoi dati sono al sicuro e non verranno condivisi</span>
                </div>
              </form>
            </div>
          </>
        ) : (
          /* Success State */
          <div className="px-6 sm:px-8 py-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg shadow-green-500/25 mb-4">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">
              Link Inviato!
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              Abbiamo inviato un link di conferma a <strong className="text-slate-700">{email}</strong>.
              Controlla la tua casella email.
            </p>
            
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200/50 text-left">
              <p className="text-sm font-medium text-blue-800 mb-2">Nel frattempo:</p>
              <p className="text-sm text-blue-700">
                Il tuo ticket è stato creato e un tecnico è già stato avvisato. 
                Riceverai una chiamata di conferma entro 60 minuti.
              </p>
            </div>

            <Button
              onClick={onClose}
              className="w-full mt-6 h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold"
            >
              Chiudi
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
