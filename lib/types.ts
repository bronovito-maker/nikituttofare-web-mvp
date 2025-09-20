// lib/types.ts
import { ReactNode } from 'react';

// ... (Msg, Step, UploadedFile, AiResult rimangono invariati) ...
export type Msg = { 
  id: number; 
  role: 'user' | 'assistant'; 
  content: ReactNode;
  isThinking?: boolean;
};

// --- MODIFICA CHIAVE: 'details' ora è definito correttamente ---
export type ChatFormState = {
  message: string; // Messaggio iniziale
  details: { // Dettagli aggiuntivi dalle domande
    clarification1?: string;
    clarification2?: string;
    clarification3?: string;
  };
  name?: string;
  city?: string;
  address?: string;
  phone?: string;
  email?: string;
  timeslot?: string;
};

export type AiResult = {
  category?: string;
  acknowledgement?: string;
  clarification_question?: string;
  request_type?: 'problem' | 'task';
  urgency?: string;
  price_low?: number;
  price_high?: number;
  est_minutes?: number;
  summary?: string;
};