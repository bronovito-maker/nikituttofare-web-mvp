'use client';

// components/providers/cookie-consent-provider.tsx
// GDPR-compliant cookie consent context provider

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';

const COOKIE_CONSENT_KEY = 'ntf_cookie_consent';

export interface CookiePreferences {
    essential: boolean;  // Always true, required
    analytics: boolean;  // Vercel Analytics, Google Analytics, etc.
    marketing: boolean;  // Meta Pixel, Google Ads, etc.
}

export type ConsentStatus = 'pending' | 'accepted' | 'rejected' | 'custom';

interface ConsentData {
    status: ConsentStatus;
    preferences: CookiePreferences;
    timestamp: string;
    version: string;
}

interface CookieConsentContextType {
    /** Current consent status - null means not yet determined */
    consentGiven: boolean | null;
    /** Whether analytics cookies are allowed */
    analyticsAllowed: boolean;
    /** Whether marketing cookies are allowed */
    marketingAllowed: boolean;
    /** Full preferences object */
    preferences: CookiePreferences;
    /** Consent status ('pending', 'accepted', 'rejected', 'custom') */
    status: ConsentStatus;
    /** Whether the consent banner should be shown */
    showBanner: boolean;
    /** Accept all cookies */
    acceptAll: () => void;
    /** Reject optional cookies (keep only essential) */
    rejectOptional: () => void;
    /** Save custom preferences */
    savePreferences: (prefs: CookiePreferences) => void;
    /** Reset consent (show banner again) */
    resetConsent: () => void;
}

const defaultPreferences: CookiePreferences = {
    essential: true,
    analytics: true,
    marketing: true,
};

const CookieConsentContext = createContext<CookieConsentContextType | null>(null);

export function CookieConsentProvider({ children }: Readonly<{ children: ReactNode }>) {
    const [status, setStatus] = useState<ConsentStatus>('accepted');
    const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences);
    const [showBanner, setShowBanner] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load consent from localStorage on mount
    useEffect(() => {
        const stored = globalThis.localStorage?.getItem(COOKIE_CONSENT_KEY);

        if (stored) {
            try {
                const data: ConsentData = JSON.parse(stored);
                setStatus(data.status);
                setPreferences(data.preferences);
            } catch {
                // Invalid data, keep default (accepted)
            }
        }

        // Always ensure banner is hidden for this specific request
        setShowBanner(false);
        setIsLoaded(true);
    }, []);

    const saveConsent = useCallback((newStatus: ConsentStatus, prefs: CookiePreferences) => {
        const data: ConsentData = {
            status: newStatus,
            preferences: prefs,
            timestamp: new Date().toISOString(),
            version: '1.0',
        };

        globalThis.localStorage?.setItem(COOKIE_CONSENT_KEY, JSON.stringify(data));
        setStatus(newStatus);
        setPreferences(prefs);
        setShowBanner(false);

        // Dispatch event for other components to react
        globalThis.dispatchEvent?.(new CustomEvent('cookie-consent-changed', { detail: data }));
    }, []);

    const acceptAll = useCallback(() => {
        saveConsent('accepted', { essential: true, analytics: true, marketing: true });
    }, [saveConsent]);

    const rejectOptional = useCallback(() => {
        saveConsent('rejected', { essential: true, analytics: false, marketing: false });
    }, [saveConsent]);

    const savePreferences = useCallback((prefs: CookiePreferences) => {
        saveConsent('custom', { ...prefs, essential: true }); // Essential always true
    }, [saveConsent]);

    const resetConsent = useCallback(() => {
        globalThis.localStorage?.removeItem(COOKIE_CONSENT_KEY);
        setStatus('pending');
        setPreferences(defaultPreferences);
        setShowBanner(true);
    }, []);

    const contextValue: CookieConsentContextType = useMemo(() => ({
        consentGiven: status === 'pending' ? null : status !== 'rejected',
        analyticsAllowed: preferences.analytics,
        marketingAllowed: preferences.marketing,
        preferences,
        status,
        showBanner,
        acceptAll,
        rejectOptional,
        savePreferences,
        resetConsent,
    }), [status, preferences, showBanner, acceptAll, rejectOptional, savePreferences, resetConsent]);

    // Don't render anything until we've loaded from localStorage
    // to prevent hydration mismatches
    if (!isLoaded) {
        return <>{children}</>;
    }

    return (
        <CookieConsentContext.Provider value={contextValue}>
            {children}
        </CookieConsentContext.Provider>
    );
}

/**
 * Hook to access cookie consent state
 * @throws Error if used outside CookieConsentProvider
 */
export function useCookieConsent(): CookieConsentContextType {
    const context = useContext(CookieConsentContext);

    if (!context) {
        throw new Error('useCookieConsent must be used within a CookieConsentProvider');
    }

    return context;
}

/**
 * Hook for conditional rendering based on consent
 * Safe to use outside provider (returns false if no provider)
 */
export function useConsentCheck(type: 'analytics' | 'marketing'): boolean {
    const context = useContext(CookieConsentContext);

    if (!context) {
        return false; // No consent = no tracking
    }

    return type === 'analytics' ? context.analyticsAllowed : context.marketingAllowed;
}
