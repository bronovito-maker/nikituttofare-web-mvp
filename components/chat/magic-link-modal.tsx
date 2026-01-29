'use client';

import { useMemo, useState } from 'react';
import { X, Mail, Loader2, ArrowRight, Shield, AlertCircle } from 'lucide-react';
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
}: Readonly<MagicLinkModalProps>) {
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
      // Redirect to auth callback which will exchange code for session on server
      const redirectTo = `${globalThis.location.origin}/auth/callback?next=/chat`;
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
      console.error('MagicLink error:', err);
      setError('Errore nell\'invio del link. Riprova.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm w-full h-full border-0 cursor-default"
        onClick={onClose}
        aria-label="Close modal"
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
                  <label htmlFor="email-input" className="block text-sm font-semibold text-slate-700">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      id="email-input"
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

                {/* Trust Badge */}
                <div className="flex items-center justify-center gap-2 text-xs text-slate-500 pt-2">
                  <Shield className="w-4 h-4 text-green-600" />
                  <span>I tuoi dati sono al sicuro e non verranno condivisi</span>
                </div>
              </form>
            </div>
          </>
        ) : (
          /* Success State - CRITICAL: User must click email link! */
          <div className="px-6 sm:px-8 py-10 text-center">
            {/* Warning Icon instead of Success */}
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/25 mb-4">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">
              ⚠️ Richiesta in Attesa!
            </h2>
            <p className="text-sm text-slate-600 mb-4">
              Ti ho inviato una mail a <strong className="text-slate-800">{email}</strong>
            </p>

            {/* Critical Warning Box */}
            <div className="p-5 bg-gradient-to-br from-red-50 to-amber-50 rounded-xl border-2 border-amber-300 text-left mb-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-base font-bold text-amber-900 mb-2">
                    🚨 DEVI CLICCARE IL LINK NELLA MAIL!
                  </p>
                  <p className="text-sm text-amber-800 leading-relaxed">
                    La tua richiesta <strong>NON è ancora attiva</strong>.
                    Per inviarla ai tecnici e ricevere assistenza,{' '}
                    <strong>apri la mail e clicca sul link di conferma</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-2 text-left mb-6">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Prossimi passi:</p>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">1</span>
                <span className="text-sm text-slate-700">Controlla la tua casella email (anche SPAM)</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">2</span>
                <span className="text-sm text-slate-700">Clicca sul link &quot;Conferma Richiesta&quot;</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <span className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold">3</span>
                <span className="text-sm text-green-800 font-medium">Un tecnico ti chiamerà entro 30-60 min</span>
              </div>
            </div>

            <Button
              onClick={onClose}
              variant="outline"
              className="w-full h-12 rounded-xl border-2 border-slate-300 text-slate-700 font-semibold"
            >
              Ho capito, controllo la mail
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
