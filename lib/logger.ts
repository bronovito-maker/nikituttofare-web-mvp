// lib/logger.ts
// Centralized logging utility with Sentry integration

import * as Sentry from '@sentry/nextjs';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogContext {
    userId?: string;
    ticketId?: string;
    action?: string;
    component?: string;
    [key: string]: unknown;
}

interface LogEntry {
    level: LogLevel;
    message: string;
    timestamp: string;
    context?: LogContext;
    error?: Error;
}

const isDev = process.env.NODE_ENV === 'development';

// Check if Sentry is available and initialized
function isSentryAvailable(): boolean {
    try {
        const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
        return !!dsn && !isDev;
    } catch {
        return false;
    }
}

// Initialize Sentry if not already done
let sentryInitialized = false;

export function initSentry(): void {
    if (sentryInitialized || isDev) return;

    const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
    if (!dsn) {
        console.warn('[Logger] NEXT_PUBLIC_SENTRY_DSN not found, Sentry disabled');
        return;
    }

    try {
        // Sentry.init is typically called in sentry.client.config.ts / sentry.server.config.ts
        // but we can add breadcrumbs here
        sentryInitialized = true;
        console.log('[Logger] Sentry integration enabled');
    } catch (error) {
        console.warn('[Logger] Failed to initialize Sentry:', error);
    }
}

// ANSI color codes for development console
const colors = {
    info: '\x1b[36m',    // Cyan
    warn: '\x1b[33m',    // Yellow
    error: '\x1b[31m',   // Red
    debug: '\x1b[35m',   // Magenta
    reset: '\x1b[0m',
};

const icons = {
    info: 'ℹ️',
    warn: '⚠️',
    error: '❌',
    debug: '🔍',
};

function formatForDev(entry: LogEntry): string {
    const color = colors[entry.level];
    const icon = icons[entry.level];
    const time = new Date(entry.timestamp).toLocaleTimeString('it-IT');

    let msg = `${color}${icon} [${time}] ${entry.message}${colors.reset}`;

    if (entry.context && Object.keys(entry.context).length > 0) {
        msg += `\n   ${JSON.stringify(entry.context, null, 2)}`;
    }

    return msg;
}

function log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    const entry: LogEntry = {
        level,
        message,
        timestamp: new Date().toISOString(),
        context,
        error,
    };

    if (isDev) {
        // Development: Pretty console output
        const formatted = formatForDev(entry);

        switch (level) {
            case 'error':
                console.error(formatted, error ?? '');
                break;
            case 'warn':
                console.warn(formatted);
                break;
            case 'debug':
                console.debug(formatted);
                break;
            default:
                console.log(formatted);
        }
    } else {
        // Production: Structured JSON logging + Sentry integration
        const prodEntry = {
            ...entry,
            error: error ? {
                name: error.name,
                message: error.message,
                stack: error.stack,
            } : undefined,
        };

        // Output structured JSON for log aggregators (Vercel, CloudWatch, etc.)
        console.log(JSON.stringify(prodEntry));

        // Send to Sentry if available
        if (isSentryAvailable()) {
            try {
                // Set user context if available
                if (context?.userId) {
                    Sentry.setUser({ id: context.userId });
                }

                // Add breadcrumb for all log levels
                Sentry.addBreadcrumb({
                    category: context?.component ?? 'app',
                    message,
                    level: level === 'error' ? 'error' : level === 'warn' ? 'warning' : 'info',
                    data: context,
                });

                // Capture based on level
                if (level === 'error') {
                    if (error) {
                        Sentry.captureException(error, {
                            extra: context,
                            tags: {
                                action: context?.action,
                                component: context?.component,
                            },
                        });
                    } else {
                        Sentry.captureMessage(message, {
                            level: 'error',
                            extra: context,
                        });
                    }
                } else if (level === 'warn') {
                    Sentry.captureMessage(message, {
                        level: 'warning',
                        extra: context,
                    });
                }
            } catch (sentryError) {
                // Fallback: don't crash if Sentry fails
                console.error('[Logger] Sentry capture failed:', sentryError);
            }
        }
    }
}

export const logger = {
    info: (message: string, context?: LogContext) => log('info', message, context),
    warn: (message: string, context?: LogContext) => log('warn', message, context),
    error: (message: string, context?: LogContext, error?: Error) => log('error', message, context, error),
    debug: (message: string, context?: LogContext) => log('debug', message, context),

    // Convenience method for catching errors
    captureError: (error: unknown, context?: LogContext) => {
        const err = error instanceof Error ? error : new Error(String(error));
        log('error', err.message, context, err);
    },

    // Set user context for Sentry
    setUser: (userId: string, email?: string) => {
        if (isSentryAvailable()) {
            Sentry.setUser({ id: userId, email });
        }
    },

    // Clear user context (e.g., on logout)
    clearUser: () => {
        if (isSentryAvailable()) {
            Sentry.setUser(null);
        }
    },
};

export type { LogEntry };
