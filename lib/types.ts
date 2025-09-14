// lib/types.ts
export type Step =
  | 'problem' | 'clarification' | 'post-quote' | 'name' | 'phone' | 'email'
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
  clarification_question?: string;
  requires_specialist_contact?: boolean; // <-- Flag per lavori complessi
  source?: 'n8n' | 'local' | 'none';
};

export type PhotonFeature = {
  properties?: {
    name?: string; city?: string; postcode?: string; country?: string;
    street?: string; housenumber?: string;
  };
  geometry?: { coordinates?: [number, number] };
};