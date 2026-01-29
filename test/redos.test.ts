import { describe, it, expect } from 'vitest';
import { parseChatData } from '../lib/chat-parser';
import { extractSlotsFromConversation } from '../lib/system-prompt';

const TIMEOUT_MS = 500; // Fail if regex takes > 500ms

describe('ReDoS Vulnerability Tests', () => {

    const runWithTimeout = async (fn: () => void) => {
        const start = performance.now();
        fn();
        const end = performance.now();
        expect(end - start).toBeLessThan(TIMEOUT_MS);
    };

    describe('lib/chat-parser.ts', () => {
        it('should be safe against catastrophic backtracking in name extraction', async () => {
            // Vulnerable pattern: (a+)+
            const maliciousInput = 'mi chiamo ' + 'a'.repeat(5000) + '!';
            await runWithTimeout(async () => {
                await parseChatData([{ role: 'user', content: maliciousInput }]);
            });
        });

        it('should be safe against overlapping name groups', async () => {
            // Vulnerable pattern: (x+x+)+
            const maliciousInput = 'sono ' + 'a '.repeat(2000) + 'a';
            await runWithTimeout(async () => {
                await parseChatData([{ role: 'user', content: maliciousInput }]);
            });
        });

        it('should be safe against email ReDoS', async () => {
            // Vulnerable pattern: domain part with excessive backtracking
            const maliciousInput = 'test@' + 'a'.repeat(5000) + '.com';
            await runWithTimeout(async () => {
                await parseChatData([{ role: 'user', content: maliciousInput }]);
            });
        });
    });

    describe('lib/system-prompt.ts', () => {
        it('should be safe against street address ReDoS', () => {
            // Vulnerable pattern: nested repetition of words
            const maliciousInput = 'via ' + 'a '.repeat(5000) + '10';
            runWithTimeout(() => {
                extractSlotsFromConversation([{ role: 'user', content: maliciousInput }]);
            });
        });
    });
});
