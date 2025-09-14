// lib/types.ts
export type AiResult = {
    category?: string;
    clarification_question?: string;
    urgency?: string;
    price_low?: number;
    price_high?: number;
    est_minutes?: number;
    summary?: string;
    // --- MODIFICA CHIAVE: Aggiunta la proprietà opzionale ---
    requires_specialist_contact?: boolean; 
}