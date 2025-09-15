// lib/types.ts
import { ReactNode } from 'react';

// Tipi per la logica della Chat
export type Step = 'problem' | 'clarification' | 'post_quote' | 'specialist_contact' | 'name' | 'phone' | 'email' | 'city' | 'address' | 'timeslot' | 'confirm' | 'done';

export type Msg = { 
  id: number; 
  role: 'user' | 'assistant'; 
  content: ReactNode;
  isThinking?: boolean;
};

export type ChatFormState = {
  message: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  timeslot: string;
};

export type UploadedFile = {
  url: string;
  pathname: string;
};

// Tipo per la risposta dell'API di assistenza
export type AiResult = {
  acknowledgement?: string; // <-- NUOVO: Per i messaggi di empatia
  category?: string;
  clarification_question?: string;
  urgency?: string;
  price_low?: number;
  price_high?: number;
  est_minutes?: number;
  summary?: string;
  requires_specialist_contact?: boolean;
};