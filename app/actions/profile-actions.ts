'use server';

import { createServerClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const TechnicianProfileSchema = z.object({
    first_name: z.string().min(2, 'Il nome deve avere almeno 2 caratteri'),
    last_name: z.string().min(2, 'Il cognome deve avere almeno 2 caratteri'),
    primary_role: z.string().min(1, 'Seleziona un ruolo principale'),
    coverage_area: z.string().min(3, 'Inserisci almeno una zona di copertura'),
    phone: z.string().optional().nullable(),
});

export type ProfileState = {
    message?: string;
    success?: boolean;
    errors?: {
        first_name?: string[];
        last_name?: string[];
        primary_role?: string[];
        coverage_area?: string[];
        phone?: string[];
    };
};

export async function updateTechnicianProfile(prevState: ProfileState, formData: FormData): Promise<ProfileState> {
    const supabase = await createServerClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, message: 'Utente non autenticato' };
    }

    const rawData = {
        first_name: formData.get('first_name') as string,
        last_name: formData.get('last_name') as string,
        primary_role: formData.get('primary_role') as string,
        coverage_area: formData.get('coverage_area') as string,
        phone: formData.get('phone') as string,
    };

    const validatedFields = TechnicianProfileSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return {
            success: false,
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Ci sono errori nel modulo. Controlla i campi.'
        };
    }

    const { first_name, last_name, primary_role, coverage_area, phone } = validatedFields.data;

    // Construct full_name for backward compatibility or display purposes if needed, 
    // but we primarily save first/last now.
    const full_name = `${first_name} ${last_name}`.trim();

    try {
        const { error } = await supabase
            .from('profiles')
            .update({
                first_name,
                last_name,
                full_name, // Keep full_name in sync
                primary_role,
                coverage_area,
                phone: phone || null,
            })
            .eq('id', user.id);

        if (error) {
            console.error('Database Error:', error);
            return { success: false, message: 'Errore durante l\'aggiornamento del profilo.' };
        }

        revalidatePath('/technician/profile');

        return { success: true, message: 'Profilo aggiornato con successo!' };
    } catch (error) {
        console.error('Update Profile Error:', error);
        return { success: false, message: 'Si è verificato un errore imprevisto.' };
    }
}

const GeneralProfileSchema = z.object({
    full_name: z.string().min(2, 'Il nome deve avere almeno 2 caratteri'),
    phone: z.string().optional().nullable(),
});

export async function updateProfile(prevState: any, formData: FormData) {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, message: 'Utente non autenticato' };
    }

    const rawData = {
        full_name: formData.get('full_name') as string,
        phone: formData.get('phone') as string,
    };

    const validatedFields = GeneralProfileSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return {
            success: false,
            message: 'Dati non validi. Controlla i campi.'
        };
    }

    const { full_name, phone } = validatedFields.data;
    // Split full_name into first/last just in case we need them populated
    const parts = full_name.split(' ');
    const first_name = parts[0];
    const last_name = parts.slice(1).join(' ') || '';

    try {
        const { error } = await supabase
            .from('profiles')
            .update({
                full_name,
                first_name,
                last_name,
                phone: phone || null,
            })
            .eq('id', user.id);

        if (error) {
            console.error('Database Error:', error);
            return { success: false, message: 'Errore durante l\'aggiornamento.' };
        }

        revalidatePath('/dashboard/profile');
        return { success: true, message: 'Profilo aggiornato con successo!' };
    } catch (error) {
        console.error('Update Profile Error:', error);
        return { success: false, message: 'Errore imprevisto.' };
    }
}
