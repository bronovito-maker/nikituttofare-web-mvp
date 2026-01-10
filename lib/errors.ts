/**
 * Gestione Errori User-Friendly
 */

export type ErrorCode =
  | 'NETWORK_ERROR' | 'AUTH_REQUIRED' | 'AUTH_EXPIRED' | 'RATE_LIMITED'
  | 'VALIDATION_ERROR' | 'NOT_FOUND' | 'SERVER_ERROR' | 'AI_UNAVAILABLE'
  | 'STORAGE_ERROR' | 'DATABASE_ERROR' | 'UNKNOWN_ERROR';

interface UserFriendlyError {
  code: ErrorCode;
  title: string;
  message: string;
  suggestion?: string;
  retryable: boolean;
}

export const ERROR_MESSAGES: Record<ErrorCode, UserFriendlyError> = {
  NETWORK_ERROR: { code: 'NETWORK_ERROR', title: 'Problema di connessione', message: 'Controlla la tua connessione internet.', suggestion: 'Riprova tra qualche secondo.', retryable: true },
  AUTH_REQUIRED: { code: 'AUTH_REQUIRED', title: 'Accesso richiesto', message: 'Devi effettuare l\'accesso per continuare.', suggestion: 'Inserisci la tua email per ricevere un link di accesso.', retryable: false },
  AUTH_EXPIRED: { code: 'AUTH_EXPIRED', title: 'Sessione scaduta', message: 'La tua sessione è scaduta per motivi di sicurezza.', suggestion: 'Effettua di nuovo l\'accesso.', retryable: false },
  RATE_LIMITED: { code: 'RATE_LIMITED', title: 'Troppe richieste', message: 'Hai inviato troppe richieste in poco tempo.', suggestion: 'Attendi qualche minuto prima di riprovare.', retryable: true },
  VALIDATION_ERROR: { code: 'VALIDATION_ERROR', title: 'Dati non validi', message: 'Alcuni dati inseriti non sono corretti.', suggestion: 'Controlla i campi e riprova.', retryable: true },
  NOT_FOUND: { code: 'NOT_FOUND', title: 'Non trovato', message: 'La risorsa richiesta non esiste o è stata rimossa.', retryable: false },
  SERVER_ERROR: { code: 'SERVER_ERROR', title: 'Errore del server', message: 'Si è verificato un problema tecnico. Il nostro team è già stato avvisato.', suggestion: 'Nel frattempo, puoi chiamarci direttamente.', retryable: true },
  AI_UNAVAILABLE: { code: 'AI_UNAVAILABLE', title: 'Assistente non disponibile', message: 'Il nostro assistente virtuale sta avendo qualche difficoltà.', suggestion: 'La tua richiesta è registrata. Un operatore ti contatterà presto.', retryable: true },
  STORAGE_ERROR: { code: 'STORAGE_ERROR', title: 'Errore di caricamento', message: 'Non sono riuscito a caricare il file. Potrebbe essere troppo grande o non supportato.', suggestion: 'Prova con un\'immagine più piccola (max 10MB).', retryable: true },
  DATABASE_ERROR: { code: 'DATABASE_ERROR', title: 'Errore di sistema', message: 'C\'è stato un problema nel salvare i tuoi dati.', suggestion: 'Riprova tra poco. Se il problema persiste, chiamaci.', retryable: true },
  UNKNOWN_ERROR: { code: 'UNKNOWN_ERROR', title: 'Qualcosa è andato storto', message: 'Si è verificato un errore imprevisto.', suggestion: 'Riprova. Se il problema persiste, chiamaci.', retryable: true },
};

// --- Error Parsers ---

const httpStatusMap: Record<number, ErrorCode> = {
    401: 'AUTH_REQUIRED',
    403: 'AUTH_EXPIRED',
    404: 'NOT_FOUND',
    429: 'RATE_LIMITED',
    400: 'VALIDATION_ERROR',
    500: 'SERVER_ERROR',
    502: 'SERVER_ERROR',
    503: 'SERVER_ERROR',
};

const keywordMap: Record<string, ErrorCode> = {
    'network': 'NETWORK_ERROR',
    'timeout': 'NETWORK_ERROR',
    'connection': 'NETWORK_ERROR',
    'auth': 'AUTH_REQUIRED',
    'token': 'AUTH_REQUIRED',
    'unauthorized': 'AUTH_REQUIRED',
    'rate': 'RATE_LIMITED',
    'limit': 'RATE_LIMITED',
    'too many': 'RATE_LIMITED',
    'storage': 'STORAGE_ERROR',
    'upload': 'STORAGE_ERROR',
    'file': 'STORAGE_ERROR',
    'database': 'DATABASE_ERROR',
    'supabase': 'DATABASE_ERROR',
    'gemini': 'AI_UNAVAILABLE',
    'ai': 'AI_UNAVAILABLE',
    'model': 'AI_UNAVAILABLE',
};

function fromPreformattedError(error: unknown): UserFriendlyError | null {
  if (error && typeof error === 'object' && 'code' in error && typeof (error as any).code === 'string') {
    const code = (error as { code: string }).code as ErrorCode;
    return ERROR_MESSAGES[code] || null;
  }
  return null;
}

function fromHttpError(error: unknown): UserFriendlyError | null {
  if (error && typeof error === 'object' && 'status' in error && typeof (error as any).status === 'number') {
    const status = (error as { status: number }).status;
    const errorCode = httpStatusMap[status];
    if (errorCode) {
        return ERROR_MESSAGES[errorCode];
    }
  }
  return null;
}

function fromGenericError(error: unknown): UserFriendlyError | null {
  if (!(error instanceof Error)) return null;

  if (error instanceof TypeError && error.message.includes('fetch')) {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }

  const msg = error.message.toLowerCase();
  const keyword = Object.keys(keywordMap).find(kw => msg.includes(kw));
  if (keyword) {
      return ERROR_MESSAGES[keywordMap[keyword]];
  }
  
  return null;
}


/**
 * Converte un errore tecnico in un messaggio user-friendly
 */
export function toUserFriendlyError(error: unknown): UserFriendlyError {
  return fromPreformattedError(error) 
      ?? fromHttpError(error) 
      ?? fromGenericError(error) 
      ?? ERROR_MESSAGES.UNKNOWN_ERROR;
}

/**
 * Crea un messaggio di errore completo per UI
 */
export function formatErrorForUI(error: unknown): string {
  const friendly = toUserFriendlyError(error);
  return [friendly.message, friendly.suggestion].filter(Boolean).join(' ');
}