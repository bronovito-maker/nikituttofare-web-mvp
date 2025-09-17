import { ReactNode } from 'react';

export type Step = 
  | 'problem'
  | 'clarification'
  | 'collecting_info'
  | 'confirm'
  | 'done';

export type Msg = { 
  id: number; 
  role: 'user' | 'assistant'; 
  content: ReactNode;
  isThinking?: boolean;
};

export type ChatFormState = {
  message: string;
  category: string;
  urgency: string;
  address: string;
  phone: string;
  details: { [key: string]: string };
};

export type UploadedFile = {
  url: string;
  pathname: string;
};

export type AiResult = {
  category?: string;
  acknowledgement?: string;
  clarification_question?: string;
  urgency?: string;
  price_low?: number;
  price_high?: number;
  est_minutes?: number;
  summary?: string;
};