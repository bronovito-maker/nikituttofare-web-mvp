import { z } from 'zod';

// Definiamo lo schema per un singolo campo del form
export const FormFieldSchema = z.object({
  name: z.string(),
  label: z.string(),
  type: z.enum(['text', 'textarea', 'select']),
  options: z.array(z.string()).optional(), // Solo per 'select'
});

// Definiamo lo schema per l'intero form
export const FormSchema = z.object({
  name: z.enum(['plumbing-issue', 'electric-issue', 'locksmith-issue', 'climate-issue', 'generic-issue']), // e.g., 'plumbing-issue'
  fields: z.array(FormFieldSchema),
});

// Schema per il preventivo con bottoni di azione
export const PriceEstimateSchema = z.object({
  message: z.string(),
  priceMin: z.number(),
  priceMax: z.number(),
  category: z.string().optional(),
  needsConfirmation: z.boolean().default(true),
});

// Definiamo lo schema generale della risposta AI
export const AIResponseSchema = z.object({
  type: z.enum(['text', 'form', 'recap', 'booking_summary', 'confirmation', 'auth_required', 'price_estimate']),
  content: z.union([z.string(), FormSchema, PriceEstimateSchema, z.record(z.any())]),
});

// Tipi inferiti per un uso sicuro nel frontend
export type AIResponseType = z.infer<typeof AIResponseSchema>;
export type FormType = z.infer<typeof FormSchema>;
export type PriceEstimateType = z.infer<typeof PriceEstimateSchema>;