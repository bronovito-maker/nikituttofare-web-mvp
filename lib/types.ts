export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

// Questo è l'unico altro tipo che ci serve per ora.
export type FormState = {
  [key: string]: any;
};