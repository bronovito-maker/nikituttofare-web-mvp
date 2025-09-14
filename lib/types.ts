export type Step =
  | 'problem' | 'post-quote' | 'name' | 'phone' | 'email'
  | 'city' | 'address' | 'timeslot' | 'confirm' | 'sending' | 'done';

export type AiResult = {
  category?: string;
  urgency?: 'bassa' | 'media' | 'alta' | 'critica' | string;
  feasible?: boolean;
  summary?: string;
  price?: number;
  price_low?: number;
  price_high?: number;
  est_minutes?: number;
  source?: 'n8n' | 'local' | 'none';
};

// Questo tipo non è più usato nella nuova versione della chat, ma lo lascio per compatibilità futura
export type PhotonFeature = {
  properties?: {
    name?: string; city?: string; postcode?: string; country?: string;
    street?: string; housenumber?: string;
  };
  geometry?: { coordinates?: [number, number] };
};

