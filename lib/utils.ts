import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { logger, type LogContext } from "./logger"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ============================================
// API Error Handling Utilities
// ============================================

/** Standard API response type */
export type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

/** User-friendly error messages for common error codes */
const errorMessages: Record<string, string> = {
  // Database errors
  'PGRST301': 'Sessione scaduta. Effettua nuovamente il login.',
  '23505': 'Questo elemento esiste già.',
  '23503': 'Riferimento non valido.',
  '42501': 'Non hai i permessi per questa operazione.',

  // Network errors
  'FETCH_FAILED': 'Errore di rete. Controlla la connessione.',
  'TIMEOUT': 'La richiesta ha impiegato troppo tempo. Riprova.',

  // Auth errors
  'AUTH_REQUIRED': 'Devi effettuare il login.',
  'INVALID_TOKEN': 'Sessione non valida. Effettua nuovamente il login.',

  // Generic
  'UNKNOWN': 'Si è verificato un errore. Riprova più tardi.',
};

/** Get user-friendly error message */
function getUserFriendlyMessage(error: unknown): { message: string; code: string } {
  if (error instanceof Error) {
    // Check for known error patterns
    const errorStr = error.message.toLowerCase();

    if (errorStr.includes('jwt') || errorStr.includes('token')) {
      return { message: errorMessages['INVALID_TOKEN'], code: 'INVALID_TOKEN' };
    }
    if (errorStr.includes('permission') || errorStr.includes('denied')) {
      return { message: errorMessages['42501'], code: 'PERMISSION_DENIED' };
    }
    if (errorStr.includes('duplicate') || errorStr.includes('unique')) {
      return { message: errorMessages['23505'], code: 'DUPLICATE' };
    }
    if (errorStr.includes('timeout')) {
      return { message: errorMessages['TIMEOUT'], code: 'TIMEOUT' };
    }
    if (errorStr.includes('network') || errorStr.includes('fetch')) {
      return { message: errorMessages['FETCH_FAILED'], code: 'NETWORK_ERROR' };
    }
  }

  return { message: errorMessages['UNKNOWN'], code: 'UNKNOWN' };
}

/**
 * Wrapper for Server Actions with automatic error handling and logging.
 * 
 * @example
 * ```ts
 * export async function createTicket(data: FormData) {
 *   return safeAction(
 *     async () => {
 *       // Your action logic here
 *       const result = await db.insert(tickets).values(...);
 *       return result;
 *     },
 *     { action: 'createTicket', component: 'TicketForm' }
 *   );
 * }
 * ```
 */
export async function safeAction<T>(
  fn: () => Promise<T>,
  context?: LogContext
): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (error) {
    const { message, code } = getUserFriendlyMessage(error);

    // Log the full error for debugging
    logger.error('Action failed', {
      ...context,
      errorCode: code,
    }, error instanceof Error ? error : new Error(String(error)));

    // Return user-friendly message to client
    return { success: false, error: message, code };
  }
}

/**
 * Wrapper for API Route Handlers with automatic error handling.
 * Returns a standardized JSON response.
 * 
 * @example
 * ```ts
 * export async function POST(req: Request) {
 *   return handleApiError(async () => {
 *     const body = await req.json();
 *     const result = await processData(body);
 *     return NextResponse.json({ success: true, data: result });
 *   }, { action: 'processData' });
 * }
 * ```
 */
export async function handleApiError<T extends Response>(
  fn: () => Promise<T>,
  context?: LogContext
): Promise<T | Response> {
  try {
    return await fn();
  } catch (error) {
    const { message, code } = getUserFriendlyMessage(error);

    // Log the full error
    logger.error('API error', {
      ...context,
      errorCode: code,
    }, error instanceof Error ? error : new Error(String(error)));

    // Return standardized error response
    return new Response(
      JSON.stringify({ success: false, error: message, code }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
