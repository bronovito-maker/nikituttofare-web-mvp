/**
 * Rate Limiting per API
 * 
 * Protezione base contro abusi. In produzione, considera Upstash Redis
 * per rate limiting distribuito su edge functions.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (funziona per single-instance, non per edge/serverless distribuito)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup automatico ogni 5 minuti
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now > entry.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitConfig {
  /** Numero massimo di richieste nel periodo */
  limit: number;
  /** Periodo in secondi */
  windowSeconds: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetIn: number;
  limit: number;
}

/**
 * Verifica e aggiorna il rate limit per un identificatore
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  const key = identifier;

  let entry = rateLimitStore.get(key);

  // Se non esiste o è scaduto, crea nuovo entry
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 1,
      resetTime: now + windowMs,
    };
    rateLimitStore.set(key, entry);

    return {
      success: true,
      remaining: config.limit - 1,
      resetIn: config.windowSeconds,
      limit: config.limit,
    };
  }

  // Incrementa il contatore
  entry.count++;

  // Verifica se ha superato il limite
  if (entry.count > config.limit) {
    return {
      success: false,
      remaining: 0,
      resetIn: Math.ceil((entry.resetTime - now) / 1000),
      limit: config.limit,
    };
  }

  return {
    success: true,
    remaining: config.limit - entry.count,
    resetIn: Math.ceil((entry.resetTime - now) / 1000),
    limit: config.limit,
  };
}

/**
 * Ottiene un identificatore univoco dalla request
 * Usa IP + User-Agent come fallback per utenti non autenticati
 */
export function getClientIdentifier(request: Request, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }

  // Estrai IP da headers (Vercel, Cloudflare, etc.)
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfIp = request.headers.get('cf-connecting-ip');
  
  const ip = cfIp || realIp || forwardedFor?.split(',')[0]?.trim() || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  // Hash semplice per privacy
  return `anon:${ip}:${userAgent.slice(0, 50)}`;
}

/**
 * Configurazioni predefinite per diversi endpoint
 */
export const RATE_LIMITS = {
  // Chat AI - più restrittivo (costa soldi!)
  assist: {
    limit: 20,        // 20 richieste
    windowSeconds: 60, // per minuto
  } as RateLimitConfig,

  // Creazione ticket
  tickets: {
    limit: 10,        // 10 ticket
    windowSeconds: 300, // per 5 minuti
  } as RateLimitConfig,

  // Upload immagini
  upload: {
    limit: 10,        // 10 upload
    windowSeconds: 300, // per 5 minuti
  } as RateLimitConfig,

  // Auth (magic link)
  auth: {
    limit: 5,         // 5 tentativi
    windowSeconds: 300, // per 5 minuti
  } as RateLimitConfig,

  // API generiche
  default: {
    limit: 100,       // 100 richieste
    windowSeconds: 60, // per minuto
  } as RateLimitConfig,
} as const;

/**
 * Helper per creare response di rate limit exceeded
 */
export function rateLimitExceededResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      error: 'Troppe richieste. Riprova tra poco.',
      retryAfter: result.resetIn,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': result.resetIn.toString(),
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': result.resetIn.toString(),
      },
    }
  );
}
