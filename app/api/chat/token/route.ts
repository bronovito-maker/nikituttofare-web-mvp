import { NextResponse } from 'next/server';
import { generateChatToken } from '@/lib/chat-security';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, rateLimitExceededResponse } from '@/lib/rate-limit';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
    // 1. Rate Limiting specific for token generation to prevent abuse
    const clientId = getClientIdentifier(req);
    const rateLimitResult = checkRateLimit(`token:${clientId}`, {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 10 // Max 10 tokens per minute per IP
    });

    if (!rateLimitResult.success) {
        return rateLimitExceededResponse(rateLimitResult);
    }

    // 2. Generate Token
    const token = generateChatToken();

    return NextResponse.json({
        token,
        expiresIn: 3600 // seconds
    });
}
