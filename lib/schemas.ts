import { z } from 'zod';

// Utility: UUID Validation
const uuidSchema = z.string().uuid("ID non valido (formato UUID richiesto)");

// 1. Login Tecnico
export const TechnicianLoginSchema = z.object({
    phone: z.string()
        .min(5, "Il numero di telefono è troppo corto")
        .regex(/^\+?[0-9\s]+$/, "Il numero contiene caratteri non validi (ammessi solo cifre e +)"),
    pin: z.string()
        .length(6, "Il PIN deve essere esattamente di 6 cifre")
        .regex(/^\d+$/, "Il PIN deve contenere solo numeri")
});

// 2. Ticket Actions
export const TicketActionSchema = z.object({
    ticketId: uuidSchema
});

// 3. Add Note
export const AddNoteSchema = z.object({
    ticketId: uuidSchema,
    content: z.string()
        .min(1, "La nota non può essere vuota")
        .max(2000, "La nota supera il limite di 2000 caratteri")
});

// 4. Admin Actions
export const RegisterTechnicianSchema = z.object({
    fullName: z.string().min(3, "Il nome deve avere almeno 3 caratteri"),
    phone: z.string()
        .min(5, "Il numero di telefono è troppo corto")
        .regex(/^\+?[0-9\s]+$/, "Il numero contiene caratteri non validi (ammessi solo cifre e +)"),
    pin: z.string()
        .length(6, "Il PIN deve essere esattamente di 6 cifre")
        .regex(/^\d+$/, "Il PIN deve contenere solo numeri")
});

export const TechnicianStatusSchema = z.object({
    technicianId: uuidSchema,
    isActive: z.boolean()
});

export const DeleteTechnicianSchema = z.object({
    technicianId: uuidSchema
});
