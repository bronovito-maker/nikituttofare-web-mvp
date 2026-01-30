'use client';

// app/global-error.tsx
// Global error boundary for unhandled errors at the root level

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { logger } from '@/lib/logger';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Send directly to Sentry
        Sentry.captureException(error, {
            tags: {
                component: 'GlobalError',
                action: 'error_boundary_triggered',
            },
            extra: {
                digest: error.digest,
            },
        });

        // Also log via our logger (for structured logs)
        logger.error('Unhandled application error', {
            component: 'GlobalError',
            action: 'error_boundary_triggered',
        }, error);
    }, [error]);

    return (
        <html lang="it">
            <body className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white/10 backdrop-blur-xl rounded-2xl p-8 text-center border border-white/20 shadow-2xl">
                    {/* Error Icon */}
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/20 mb-6">
                        <svg
                            className="w-10 h-10 text-red-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl font-bold text-white mb-3">
                        Qualcosa è andato storto
                    </h1>

                    {/* Description */}
                    <p className="text-slate-300 mb-6">
                        Ci scusiamo per l'inconveniente. Il nostro team è stato notificato
                        e stiamo lavorando per risolvere il problema.
                    </p>

                    {/* Error Digest (for support) */}
                    {error.digest && (
                        <p className="text-xs text-slate-500 mb-6 font-mono">
                            Codice errore: {error.digest}
                        </p>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                            onClick={reset}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-blue-500/25"
                        >
                            🔄 Riprova
                        </button>
                        <a
                            href="/"
                            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-colors border border-white/20"
                        >
                            🏠 Torna alla Home
                        </a>
                    </div>

                    {/* Support Link */}
                    <p className="text-xs text-slate-500 mt-8">
                        Se il problema persiste,{' '}
                        <a href="mailto:support@nikituttofare.com" className="text-blue-400 hover:underline">
                            contatta il supporto
                        </a>
                    </p>
                </div>
            </body>
        </html>
    );
}
