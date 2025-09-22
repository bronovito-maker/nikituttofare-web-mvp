// File: lib/types.ts

import { ReactNode } from 'react';

// Tipi per la Chat
export type Message = {
  role: 'user' | 'assistant';
  content: ReactNode;
  isLoading?: boolean;
};

export type Step = 'intro' | 'service' | 'details' | 'confirm' | 'done';

export type ChatFormState = {
  message?: string;
  details?: {
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
  imageUrl?: string;
  service?: string;
};

// Tipi per l'AI e le Richieste
export type AiResult = {
  category?: string;
  acknowledgement?: string;
  clarification_question?: string;
  request_type?: 'problem' | 'task';
  urgency?: string;
  price_low?: number;
  price_high?: number;
  est_minutes?: number;
  summary_for_technician?: string;
};

export type Request = {
  id?: string;
  CreatedAt?: string;
  ticketId: string;
  category: string;
  urgency?: string;
  message: string;
  address?: string;
  price_low?: number;
  price_high?: number;
  est_minutes?: number;
  city?: string;
  status: 'new' | 'assigned' | 'completed' | 'cancelled';
  technicianPhone?: string;
  name?: string;
  phone?: string;
  email?: string;
  timeslot?: string;
  createdAt: string; // Assicuriamoci che ci sia sempre
};