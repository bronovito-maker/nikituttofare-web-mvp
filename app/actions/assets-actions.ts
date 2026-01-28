'use server';

import { createServerClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const AssetSchema = z.object({
    address: z.string().min(5, 'L\'indirizzo è troppo corto'),
    city: z.string().min(2, 'La città è obbligatoria'),
    notes: z.string().optional().nullable(),
});

export type AssetState = {
    message?: string;
    success?: boolean;
    errors?: {
        address?: string[];
        city?: string[];
        notes?: string[];
    };
};

export async function addUserAsset(prevState: AssetState, formData: FormData): Promise<AssetState> {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, message: 'Utente non autenticato' };
    }

    const rawData = {
        address: formData.get('address') as string,
        city: formData.get('city') as string,
        notes: formData.get('notes') as string,
    };

    const validatedFields = AssetSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return {
            success: false,
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Ci sono errori nel modulo.'
        };
    }

    const { address, city, notes } = validatedFields.data;

    try {
        const { error } = await supabase
            .from('user_assets')
            .insert({
                user_id: user.id,
                address,
                city,
                notes: notes || null,
                created_at: new Date().toISOString()
            });

        if (error) {
            console.error('Insert Asset Error:', error);
            return { success: false, message: 'Errore durante l\'aggiunta dell\'immobile.' };
        }

        revalidatePath('/dashboard/assets');
        return { success: true, message: 'Immobile aggiunto con successo!' };
    } catch (error) {
        console.error('Add Asset Error:', error);
        return { success: false, message: 'Errore imprevisto.' };
    }
}

export async function deleteUserAsset(assetId: string) {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, message: 'Non autorizzato' };

    try {
        const { error } = await supabase
            .from('user_assets')
            .delete()
            .eq('id', assetId)
            .eq('user_id', user.id); // Security: Ensure ownership

        if (error) {
            console.error('Delete Asset Error:', error);
            return { success: false, message: 'Errore durante la cancellazione.' };
        }

        revalidatePath('/dashboard/assets');
        return { success: true, message: 'Immobile rimosso.' };
    } catch (error) {
        console.error('Delete Asset Error:', error);
        return { success: false, message: 'Errore imprevisto.' };
    }
}
