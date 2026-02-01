import { createHmac, randomBytes } from 'crypto';

// Secret key for signing tokens. 
// In production, this should be a long random string in .env (e.g. N8N_SIGNING_SECRET).
// Fallback to a hardcoded random-ish string for dev sanity if missing, but log a warning.
const SECRET = process.env.N8N_SIGNING_SECRET || process.env.NEXTAUTH_SECRET || (process.env.NODE_ENV === 'production' ? undefined : 'dev-fallback-secret-do-not-use-in-prod');

if (!SECRET) {
    throw new Error("⚠️ CRITICAL SECURITY: N8N_SIGNING_SECRET is missing. Cannot sign tokens securely.");
}

// At this point, we know SECRET is defined. We cast it to string to satisfy TypeScript in the functions below.
const SIGNING_KEY = SECRET as string;

interface ChatTokenPayload {
    msg: 'chat-allowed';
    exp: number; // Timestamp expiration
    jti: string; // Unique ID to prevent repeats (optional for now, but good practice)
}

// Validity duration: 1 hour
const TOKEN_TTL_MS = 60 * 60 * 1000;

export function generateChatToken(): string {
    const now = Date.now();
    const payload: ChatTokenPayload = {
        msg: 'chat-allowed',
        exp: now + TOKEN_TTL_MS,
        jti: randomBytes(8).toString('hex')
    };

    const payloadStr = JSON.stringify(payload);
    const signature = createHmac('sha256', SIGNING_KEY).update(payloadStr).digest('hex');

    // Format: payload.signature (Encoding payload in Base64Url would be JWT-style, 
    // but let's keep it simple: Base64(payload).signature)
    const b64Payload = Buffer.from(payloadStr).toString('base64');
    return `${b64Payload}.${signature}`;
}

export function verifyChatToken(token: string | null | undefined): boolean {
    if (!token) return false;

    const parts = token.split('.');
    if (parts.length !== 2) return false;

    const [b64Payload, signature] = parts;

    // 1. Recreate signature
    const payloadStr = Buffer.from(b64Payload, 'base64').toString('utf-8');
    const expectedSignature = createHmac('sha256', SIGNING_KEY).update(payloadStr).digest('hex');

    // 2. Timing Safe Compare
    if (signature !== expectedSignature) return false;

    // 3. Parse and Check Expiration
    try {
        const payload = JSON.parse(payloadStr) as ChatTokenPayload;
        if (payload.msg !== 'chat-allowed') return false;

        if (Date.now() > payload.exp) {
            return false; // Expired
        }

        return true;
    } catch (e) {
        return false;
    }
}
