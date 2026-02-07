# Rate Limiting Implementation

## Overview

The rate limiting system protects the NikiTuttoFare API endpoints from abuse by limiting the number of requests a client can make within a specific time window. This is implemented using an in-memory rate limiter with automatic cleanup.

## Implementation Details

### Core Module: `lib/rate-limit.ts`

The rate limiter provides:

- **In-memory storage** - Fast, simple, no external dependencies
- **Automatic cleanup** - Expired entries are removed every 5 minutes
- **Flexible configuration** - Customizable limits per endpoint
- **Standard HTTP headers** - Follows RFC 6585 for `429 Too Many Requests`

### Key Functions

#### `checkRateLimit(key, config)`

Checks if a request is within rate limit.

```typescript
const rateLimitResult = checkRateLimit('review:user_123', {
  maxRequests: 5,
  windowMs: 60 * 60 * 1000, // 1 hour
});
```

Returns:
- `success: boolean` - Whether request is allowed
- `remaining: number` - Requests remaining in window
- `resetTime: number` - Timestamp when limit resets
- `error?: string` - Error message if limit exceeded

#### `getClientIdentifier(request)`

Extracts client identifier from request (IP address).

Checks in order:
1. `x-forwarded-for` header (for proxies/load balancers)
2. `x-real-ip` header
3. `request.ip` 
4. Fallback to `'unknown'`

#### `rateLimitExceededResponse(result)`

Creates standardized 429 response with headers:
- `Retry-After` - Seconds until limit resets
- `X-RateLimit-Limit` - Total requests allowed
- `X-RateLimit-Remaining` - Requests remaining (0)
- `X-RateLimit-Reset` - Unix timestamp when limit resets

### Predefined Rate Limits: `RATE_LIMITS`

| Endpoint | Limit | Window | Purpose |
|----------|-------|--------|---------|
| `assist` | 30 | 1 minute | AI chat messages |
| `tickets` | 10 | 1 hour | Ticket creation |
| `upload` | 20 | 1 hour | Image uploads |
| `reviews` | 5 | 1 hour | Review submissions |

## Usage Examples

### 1. Review Endpoint (`app/api/tickets/[id]/review/route.ts`)

```typescript
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export async function POST(request: NextRequest, { params }) {
  const { user } = await supabase.auth.getUser();
  
  // Rate limit by user ID
  const rateLimitResult = checkRateLimit(`review:${user.id}`, RATE_LIMITS.reviews);
  
  if (!rateLimitResult.success) {
    const resetInMinutes = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000 / 60);
    return NextResponse.json(
      {
        error: 'Troppe recensioni in poco tempo',
        details: `Riprova tra ${resetInMinutes} minuti`,
      },
      { status: 429 }
    );
  }
  
  // Process review...
  
  // Include rate limit headers in success response
  return NextResponse.json(
    { success: true },
    {
      headers: {
        'X-RateLimit-Remaining': String(rateLimitResult.remaining),
        'X-RateLimit-Reset': String(rateLimitResult.resetTime),
      },
    }
  );
}
```

### 2. Anonymous Endpoint (rate limit by IP)

```typescript
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const clientId = getClientIdentifier(request);
  const rateLimitResult = checkRateLimit(`upload:${clientId}`, RATE_LIMITS.upload);
  
  if (!rateLimitResult.success) {
    return rateLimitExceededResponse(rateLimitResult);
  }
  
  // Process upload...
}
```

## Protected Endpoints

The following endpoints have rate limiting:

### User-Specific (by user ID)
- ✅ **POST** `/api/tickets/[id]/review` - 5 reviews/hour
  - Prevents spam reviews
  - Protects against malicious rating manipulation

### IP-Based (by client IP)
- ✅ **POST** `/api/assist` - 30 messages/minute
  - Prevents AI abuse
  - Protects Gemini API costs
  
- ✅ **POST** `/api/tickets` - 10 tickets/hour
  - Prevents ticket spam
  - Protects against database overload
  
- ✅ **POST** `/api/upload-image` - 20 uploads/hour
  - Prevents storage abuse
  - Protects Supabase storage costs
  
- ✅ **POST** `/api/chat/token` - 10 tokens/minute
  - Prevents token generation abuse

## Testing

Unit tests are located in `lib/__tests__/rate-limit.test.ts`:

```bash
npm test -- lib/__tests__/rate-limit.test.ts
```

Tests cover:
- Allows requests within limit
- Blocks requests over limit
- Resets after time window expires
- Handles different keys independently

## Production Considerations

### Current Implementation (In-Memory)

✅ **Pros:**
- Simple, no external dependencies
- Fast (no network calls)
- Works out-of-the-box

⚠️ **Limitations:**
- Not shared across multiple servers/instances
- Lost on server restart
- Not suitable for multi-region deployments

### Production Upgrade Path

For production with multiple servers, consider:

1. **Redis-based rate limiter**
   - Shared state across all instances
   - Persistent across restarts
   - Battle-tested libraries: `rate-limiter-flexible`, `redis-rate-limiter`

2. **Vercel Edge Middleware** (if using Vercel)
   - Native rate limiting at edge
   - No backend changes needed
   - See: https://vercel.com/templates/rate-limiting

3. **API Gateway** (Cloudflare, Kong, etc.)
   - Rate limiting before reaching your app
   - DDoS protection
   - Analytics included

## Migration Path

To migrate to Redis-based rate limiting:

```typescript
// lib/rate-limit-redis.ts
import { RateLimiterRedis } from 'rate-limiter-flexible';
import Redis from 'ioredis';

const redisClient = new Redis(process.env.REDIS_URL);

const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'ntf_rl',
  points: 5, // Number of requests
  duration: 3600, // Per 1 hour
});

export async function checkRateLimit(key: string) {
  try {
    await rateLimiter.consume(key);
    return { success: true };
  } catch (rejRes) {
    return { 
      success: false, 
      resetTime: new Date(Date.now() + rejRes.msBeforeNext)
    };
  }
}
```

## Security Notes

1. **IP Spoofing Protection**: Always validate `x-forwarded-for` header in production
2. **User ID vs IP**: Use user ID for authenticated endpoints, IP for anonymous
3. **Bypass for Admin**: Consider allowing admins to bypass rate limits for testing
4. **Monitoring**: Track 429 responses to detect abuse patterns

## Related Documentation

- [API Documentation](./API.md)
- [Security Best Practices](./SECURITY.md)
- [Review System](./REVIEW_SYSTEM.md)
