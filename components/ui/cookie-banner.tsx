'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cookie, Shield } from 'lucide-react';

const COOKIE_CONSENT_KEY = 'ntf_cookie_consent';

type ConsentStatus = 'pending' | 'accepted' | 'rejected' | 'custom';

interface CookiePreferences {
  essential: boolean;  // Sempre true, necessari
  analytics: boolean;  // Vercel Analytics
  marketing: boolean;  // Future integrazioni
}

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: true,
    marketing: false,
  });

  useEffect(() => {
    // Controlla se l'utente ha già espresso una preferenza
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Mostra il banner dopo un breve delay per non essere invasivo
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const saveConsent = (status: ConsentStatus, prefs: CookiePreferences) => {
    const consent = {
      status,
      preferences: prefs,
      timestamp: new Date().toISOString(),
      version: '1.0',
    };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent));
    setIsVisible(false);

    // Se analytics è accettato, abilita Vercel Analytics
    if (prefs.analytics && globalThis.window !== undefined) {
      // Vercel Analytics si attiva automaticamente se presente
      console.log('Analytics consent granted');
    }
  };

  const handleAcceptAll = () => {
    const prefs = { essential: true, analytics: true, marketing: true };
    saveConsent('accepted', prefs);
  };

  const handleRejectOptional = () => {
    const prefs = { essential: true, analytics: false, marketing: false };
    saveConsent('rejected', prefs);
  };

  const handleSaveCustom = () => {
    saveConsent('custom', preferences);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[200] p-4 pointer-events-none">
      <div className="max-w-2xl mx-auto pointer-events-auto">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-5 duration-500">

          {/* Header */}
          <div className="px-5 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-200/50">
                <Cookie className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Utilizziamo i Cookie</h3>
                <p className="text-xs text-slate-500">Per offrirti un servizio migliore</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-5 py-4">
            {!showDetails ? (
              <p className="text-sm text-slate-600 leading-relaxed">
                Utilizziamo cookie tecnici necessari e, con il tuo consenso, cookie analitici
                per migliorare il servizio. Puoi accettare tutti i cookie o personalizzare le tue preferenze.
                <Link href="/privacy" className="text-blue-600 hover:underline ml-1">
                  Leggi la Privacy Policy →
                </Link>
              </p>
            ) : (
              <div className="space-y-3">
                {/* Cookie Essenziali */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Cookie Essenziali</p>
                      <p className="text-xs text-slate-500">Necessari per il funzionamento del sito</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                    Sempre attivi
                  </div>
                </div>

                {/* Cookie Analitici */}
                <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded bg-blue-100 flex items-center justify-center">
                      <span className="text-xs">📊</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Cookie Analitici</p>
                      <p className="text-xs text-slate-500">Ci aiutano a capire come migliorare il servizio</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) => setPreferences(p => ({ ...p, analytics: e.target.checked }))}
                    className="w-full h-full rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    aria-label="Accetta cookie analitici"
                  />
                </label>

                {/* Cookie Marketing */}
                <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded bg-purple-100 flex items-center justify-center">
                      <span className="text-xs">📢</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Cookie Marketing</p>
                      <p className="text-xs text-slate-500">Per offrirti promozioni personalizzate</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.marketing}
                    onChange={(e) => setPreferences(p => ({ ...p, marketing: e.target.checked }))}
                    className="w-full h-full rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                    aria-label="Accetta cookie marketing"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="px-5 py-4 bg-slate-50 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row gap-2">
              {!showDetails ? (
                <>
                  <button
                    onClick={() => setShowDetails(true)}
                    className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Personalizza
                  </button>
                  <button
                    onClick={handleRejectOptional}
                    className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-xl transition-colors"
                  >
                    Solo essenziali
                  </button>
                  <button
                    onClick={handleAcceptAll}
                    className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-lg"
                  >
                    Accetta tutti
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    ← Indietro
                  </button>
                  <button
                    onClick={handleSaveCustom}
                    className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-lg"
                  >
                    Salva preferenze
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook per controllare il consenso ai cookie
 */
export function useCookieConsent() {
  const [consent, setConsent] = useState<CookiePreferences | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setConsent(parsed.preferences);
      } catch {
        setConsent(null);
      }
    }
  }, []);

  return consent;
}
