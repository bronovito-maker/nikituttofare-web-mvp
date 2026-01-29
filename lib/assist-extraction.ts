
import { ConversationSlots } from '@/lib/system-prompt';

export const PHONE_PATTERNS = [
    /(\+39\s?)?\d{3}[\s.-]?\d{3}[\s.-]?\d{4}/,
    /(\+39\s?)?\d{3}[\s.-]?\d{6,7}/,
    /3\d{2}[\s.-]?\d{3}[\s.-]?\d{4}/,
    /0\d{2,4}[\s.-]?\d{5,8}/,
];

export const CATEGORY_KEYWORDS: Record<string, string[]> = {
    plumbing: ['idraulico', 'acqua', 'tubo', 'perdita', 'scarico', 'rubinetto', 'allagamento', 'wc', 'bagno', 'bidet', 'intasato', 'otturato'],
    electric: ['elettric', 'luce', 'presa', 'corrente', 'salvavita', 'blackout', 'scintill'],
    locksmith: ['fabbro', 'serratura', 'chiave', 'porta', 'bloccato', 'chiuso fuori'],
    climate: ['condizionatore', 'caldaia', 'riscaldamento', 'termosifone', 'clima', 'aria condizionata'],
};

export const EMERGENCY_KEYWORDS = [
    'urgente', 'emergenza', 'subito', 'allagamento', 'bloccato fuori', 'senza luce'
];

export function normalizeText(text: string): string {
    let normalized = text.toLowerCase();

    const typoMap: Record<string, string> = {
        alagamento: 'allagamento',
        alagato: 'allagato',
        allagametno: 'allagamento',
        intatasto: 'intasato',
        intatasta: 'intasato',
        intatasti: 'intasato',
        intassato: 'intasato',
        intassata: 'intasato',
        ovuneuqe: 'ovunque',
        solpito: 'scoppiato',
        sepozzata: 'spezzata',
        chisua: 'chiusa',
        blocataaa: 'bloccata',
        presaaaa: 'presa',
        brucoato: 'bruciato',
        preseee: 'prese',
        bgano: 'bagno',
        foco: 'fuoco',
        semrba: 'sembra',
        tremamo: 'tremano',
    };

    for (const [typo, correct] of Object.entries(typoMap)) {
        normalized = normalized.replaceAll(typo, correct);
    }

    normalized = normalized.replaceAll(/(.)\1{2,}/g, '$1$1');

    return normalized;
}

export function extractPhoneNumber(text: string): string | undefined {
    for (const pattern of PHONE_PATTERNS) {
        const match = pattern.exec(text);
        if (match) return match[0].replaceAll(/[\s.-]/g, '');
    }
    return undefined;
}

export function extractAddress(text: string): string | undefined {
    const addressRegex = /(?:via|corso|piazza|viale|vicolo|largo)\s+[a-zàèéìòùáíóú]+(?:\s+[a-zàèéìòùáíóú]+)*[\s,]*\d+[a-z]?/i;
    const match = addressRegex.exec(text);
    return match ? match[0].trim() : undefined;
}

export function extractCategory(text: string): ConversationSlots['problemCategory'] | undefined {
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        if (keywords.some(kw => text.includes(kw))) {
            return category as ConversationSlots['problemCategory'];
        }
    }
    return undefined;
}

export function extractUrgency(text: string): 'emergency' | undefined {
    if (EMERGENCY_KEYWORDS.some(kw => text.includes(kw))) {
        return 'emergency';
    }
    return undefined;
}
