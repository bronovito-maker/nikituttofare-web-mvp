'use server';

import { createServerClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const ProfileSchema = z.object({
    full_name: z.string().min(2, 'Il nome deve avere almeno 2 caratteri'),
    phone: z.string().optional().nullable(),
    email: z.string().email().optional(), // Readonly usually, but good for validation if passed
});

export type ProfileState = {
    message?: string;
    success?: boolean;
    errors?: {
        full_name?: string[];
        phone?: string[];
    };
};

export async function updateProfile(prevState: ProfileState, formData: FormData): Promise<ProfileState> {
    const supabase = await createServerClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, message: 'Utente non autenticato' };
    }

    const rawData = {
        full_name: formData.get('full_name') as string,
        phone: formData.get('phone') as string,
    };

    const validatedFields = ProfileSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return {
            success: false,
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Ci sono errori nel modulo. Controlla i campi.'
        };
    }

    const { full_name, phone } = validatedFields.data;

    try {
        const { error } = await supabase
            .from('profiles')
            .update({
                full_name,
                phone: phone || null,
            })
            .eq('id', user.id);

        if (error) {
            console.error('Database Error:', error);
            return { success: false, message: 'Errore durante l\'aggiornamento del profilo.' };
        }

        revalidatePath('/dashboard/profile');
        revalidatePath('/dashboard');

        return { success: true, message: 'Profilo aggiornato con successo!' };
    } catch (error) {
        console.error('Update Profile Error:', error);
        return { success: false, message: 'Si è verificato un errore imprevisto.' };
    }
}
