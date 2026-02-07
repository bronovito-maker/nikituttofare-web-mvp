/**
 * Simple in-memory rate limiter for API endpoints
 * For production with multiple servers, consider Redis-based solution
 */

interface RateLimitStore {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitStore>();

interface RateLimitConfig {
  /**
   * Maximum number of requests allowed in the time window
   */
  maxRequests: number;
  /**
   * Time window in milliseconds
   */
  windowMs: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
  error?: string;
}

/**
 * Check if a request is within rate limit
 * @param key - Unique identifier for the rate limit (e.g., "review:user_id")
 * @param config - Rate limit configuration
 * @returns Rate limit result with success status and remaining requests
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const stored = rateLimitMap.get(key);

  // If no stored data or window expired, create new entry
  if (!stored || now > stored.resetTime) {
    const resetTime = now + config.windowMs;
    rateLimitMap.set(key, {
      count: 1,
      resetTime,
    });

    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetTime,
    };
  }

  // Check if limit exceeded
  if (stored.count >= config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetTime: stored.resetTime,
      error: 'Rate limit exceeded',
    };
  }

  // Increment count
  stored.count += 1;
  rateLimitMap.set(key, stored);

  return {
    success: true,
    remaining: config.maxRequests - stored.count,
    resetTime: stored.resetTime,
  };
}

/**
 * Clear rate limit for a specific key (useful for testing)
 */
export function clearRateLimit(key: string): void {
  rateLimitMap.delete(key);
}

/**
 * Clean up expired entries (call periodically to prevent memory leaks)
 */
export function cleanupExpiredRateLimits(): void {
  const now = Date.now();
  for (const [key, stored] of rateLimitMap.entries()) {
    if (now > stored.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}

// Auto-cleanup every 5 minutes
if (typeof globalThis !== 'undefined' && typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredRateLimits, 5 * 60 * 1000);
}

/**
 * Get client identifier from request (IP address or forwarded IP)
 * @param request - Next.js request object
 * @returns Client identifier string
 */
export function getClientIdentifier(request: { headers: Headers; ip?: string }): string {
  // Try to get real IP from headers (for proxies/load balancers)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to request IP or unknown
  return request.ip || 'unknown';
}

/**
 * Create standardized rate limit exceeded response
 * @param result - Rate limit check result
 * @returns NextResponse with 429 status and retry headers
 */
export function rateLimitExceededResponse(result: RateLimitResult) {
  const { NextResponse } = require('next/server');
  const resetInSeconds = Math.ceil((result.resetTime - Date.now()) / 1000);
  const resetInMinutes = Math.ceil(resetInSeconds / 60);

  return NextResponse.json(
    {
      error: 'Troppe richieste',
      message: `Limite richieste raggiunto. Riprova tra ${resetInMinutes} minut${resetInMinutes === 1 ? 'o' : 'i'}.`,
      retryAfter: resetInSeconds,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(resetInSeconds),
        'X-RateLimit-Limit': '0',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.floor(result.resetTime / 1000)),
      },
    }
  );
}

/**
 * Predefined rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
  /**
   * AI assistant chat endpoint - 30 requests per minute
   */
  assist: {
    maxRequests: 30,
    windowMs: 60 * 1000,
  },
  /**
   * Ticket creation - 10 tickets per hour
   */
  tickets: {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000,
  },
  /**
   * Image upload - 20 uploads per hour
   */
  upload: {
    maxRequests: 20,
    windowMs: 60 * 60 * 1000,
  },
  /**
   * Review submission - 5 reviews per hour
   */
  reviews: {
    maxRequests: 5,
    windowMs: 60 * 60 * 1000,
  },
} as const;
