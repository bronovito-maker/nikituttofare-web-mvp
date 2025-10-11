export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

// Questo è l'unico altro tipo che ci serve per ora.
export type FormState = {
  [key: string]: any;
};

export interface Request {
  ticketId: string;
  category: string;
  status: string;
  message: string;
  createdAt: string;
  [key: string]: unknown;
}
