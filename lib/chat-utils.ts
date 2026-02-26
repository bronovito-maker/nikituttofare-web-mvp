/**
 * Utility for sanitizing user chat input to prevent XSS and other injection attacks.
 */

/**
 * Sanitize a string by removing potential HTML tags and trimming whitespace.
 * This is a basic frontend-safe sanitization.
 */
export function sanitizeChatInput(input: string): string {
    if (!input) return "";

    return input
        .replace(/<[^>]*>?/gm, "") // Remove HTML tags
        .trim();
}

/**
 * Validates if the message is within reasonable length limits.
 */
export function validateMessageLength(input: string, maxLength: number = 2000): boolean {
    return input.length <= maxLength;
}
