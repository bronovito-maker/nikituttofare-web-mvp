import { describe, it, expect, beforeEach } from 'vitest';
import { checkRateLimit, clearRateLimit } from '../rate-limit';

describe('Rate Limiter', () => {
  const testKey = 'test:user:123';

  beforeEach(() => {
    clearRateLimit(testKey);
  });

  it('should allow requests within limit', () => {
    const config = { maxRequests: 3, windowMs: 1000 };

    const result1 = checkRateLimit(testKey, config);
    expect(result1.success).toBe(true);
    expect(result1.remaining).toBe(2);

    const result2 = checkRateLimit(testKey, config);
    expect(result2.success).toBe(true);
    expect(result2.remaining).toBe(1);

    const result3 = checkRateLimit(testKey, config);
    expect(result3.success).toBe(true);
    expect(result3.remaining).toBe(0);
  });

  it('should block requests over limit', () => {
    const config = { maxRequests: 2, windowMs: 1000 };

    checkRateLimit(testKey, config);
    checkRateLimit(testKey, config);

    const result = checkRateLimit(testKey, config);
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.error).toBe('Rate limit exceeded');
  });

  it('should reset after time window expires', async () => {
    const config = { maxRequests: 1, windowMs: 50 }; // 50ms window

    const result1 = checkRateLimit(testKey, config);
    expect(result1.success).toBe(true);

    const result2 = checkRateLimit(testKey, config);
    expect(result2.success).toBe(false);

    // Wait for window to expire
    await new Promise((resolve) => setTimeout(resolve, 60));

    const result3 = checkRateLimit(testKey, config);
    expect(result3.success).toBe(true);
    expect(result3.remaining).toBe(0);
  });

  it('should handle different keys independently', () => {
    const config = { maxRequests: 1, windowMs: 1000 };
    const key1 = 'test:user:1';
    const key2 = 'test:user:2';

    clearRateLimit(key1);
    clearRateLimit(key2);

    const result1 = checkRateLimit(key1, config);
    expect(result1.success).toBe(true);

    const result2 = checkRateLimit(key2, config);
    expect(result2.success).toBe(true);

    const result3 = checkRateLimit(key1, config);
    expect(result3.success).toBe(false);

    const result4 = checkRateLimit(key2, config);
    expect(result4.success).toBe(false);
  });
});
