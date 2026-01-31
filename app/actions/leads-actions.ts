'use server';

import { createServerClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export async function updateLeadStatus(id: string, field: string, value: boolean) {
    const supabase = await createServerClient();

    // Verify Admin
    // (Assuming middleware or RLS handles this, but explicit check is good practice)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        throw new Error('Unauthorized');
    }

    // Allowed fields check to prevent arbitrary column updates
    const allowedFields = ['status_mail_sent', 'status_called', 'status_visited', 'status_confirmed'];
    if (!allowedFields.includes(field)) {
        throw new Error('Invalid field');
    }

    const { error } = await supabase
        .from('leads' as any) // Table not yet in types
        .update({ [field]: value })
        .eq('id', id);

    if (error) {
        console.error('Error updating lead status:', error);
        throw new Error('Failed to update status');
    }

    revalidatePath('/admin/leads');
}

export async function updateLeadNotes(id: string, notes: string) {
    const supabase = await createServerClient();

    const { error } = await supabase
        .from('leads' as any)
        .update({ notes })
        .eq('id', id);

    if (error) {
        console.error('Error updating lead notes:', error);
        throw new Error('Failed to update notes');
    }

    revalidatePath('/admin/leads');
}

import { z } from 'zod';

const createLeadSchema = z.object({
    name: z.string().min(1, "Il nome è obbligatorio"),
    type: z.string().optional(),
    city: z.string().min(1, "La città è obbligatoria"),
    address: z.string().min(1, "L'indirizzo è obbligatorio"),
    phone: z.string().optional(),
    email: z.string().email("Email non valida").optional().or(z.literal("")),
    notes: z.string().optional(),
});

export type LeadFormData = z.infer<typeof createLeadSchema>;

// Shared Geocoding Logic (Server-Side)
async function geocodeAddress(address: string, city: string) {
    try {
        const query = `${address}, ${city}`;
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`, {
            headers: { 'User-Agent': 'NikiTuttofare-Web/1.0' }
        });

        if (!response.ok) return null;

        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
            // Postgres POINT format: (LON, LAT)
            return `(${data[0].lon},${data[0].lat})`;
        }
    } catch (error) {
        console.warn('Geocoding error:', error);
    }
    return null;
}

export async function createLead(data: LeadFormData) {
    const supabase = await createServerClient();

    // Verify Admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        throw new Error('Unauthorized');
    }

    // Validate Data
    const result = createLeadSchema.safeParse(data);
    if (!result.success) {
        return { error: result.error.errors[0].message };
    }

    const { name, city, address, type, phone, email, notes } = result.data;

    // Geocode
    const coordinates = await geocodeAddress(address, city);

    // Insert
    const { error } = await supabase
        .from('leads' as any)
        .insert({
            name,
            city,
            address,
            type: type || 'Ristorante',
            phone,
            email,
            notes,
            coordinates,
            rating: 0,
            status_mail_sent: false,
            status_called: false,
            status_visited: false,
            status_confirmed: false
        });

    if (error) {
        console.error('Error creating lead:', error);
        return { error: 'Failed to create lead' };
    }

    revalidatePath('/admin/leads');
    return { success: true };
}
