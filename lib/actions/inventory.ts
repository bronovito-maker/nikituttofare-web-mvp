'use server'

import { createServerClient } from '@/lib/supabase-server'; // Assuming this provides the Supabase client
import { revalidatePath } from 'next/cache';

// Tipizzazione dei materiali
export interface InventoryItem {
    id: string;
    tenant_id: string;
    name: string;
    sku: string | null;
    category: string | null;
    description: string | null;
    quantity_at_hand: number;
    minimum_quantity_alert: number;
    unit_of_measure: string;
    unit_cost: number | null;
}

// 1. Recupero Catalogo Materiali del Tenant
export async function getInventoryItems(tenantId: string): Promise<InventoryItem[]> {
    const supabase = await createServerClient(); // Use await createServerClient() based on recent Next.js/Supabase conventions 

    const { data, error } = await (supabase as any)
        .from('inventory_items')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('name', { ascending: true });

    if (error) {
        console.error('Error fetching inventory items:', error);
        return [];
    }

    return data as InventoryItem[];
}

// 2. Registrazione Scarico Materiale
export async function insertJobInventoryUsage(
    tenantId: string,
    jobId: string,
    inventoryItemId: string,
    quantityUsed: number,
    technicianId: string,
    notes?: string
) {
    if (quantityUsed <= 0) {
        return { success: false, error: 'La quantità deve essere maggiore di zero.' };
    }

    const supabase = await createServerClient();

    // Inseriamo l'utilizzo (il trigger SQL si occuperà di aggiornare inventory_items e inventory_movements)
    const { data, error } = await (supabase as any)
        .from('job_inventory_usage')
        .insert([{
            tenant_id: tenantId,
            job_id: jobId,
            inventory_item_id: inventoryItemId,
            quantity_used: quantityUsed,
            technician_id: technicianId,
            notes: notes || null
        }])
        .select();

    if (error) {
        console.error('Error recording inventory usage:', error);
        // Podrebbe essere un errore di chiave duplicata (già inserito per questo job)
        if (error.code === '23505') {
            return { success: false, error: 'Questo materiale è già stato aggiunto a questo intervento. Per modificare la quantità, usa la funzione di aggiornamento (da implementare).' };
        }
        return { success: false, error: 'Impossibile registrare lo scarico del materiale.' };
    }

    revalidatePath(`/technician/jobs/${jobId}`);
    return { success: true, data };
}

// 3. Recupero Materiali Usati in un Lavoro
export async function getJobInventoryUsages(jobId: string) {
    const supabase = await createServerClient();

    const { data, error } = await (supabase as any)
        .from('job_inventory_usage')
        .select(`
            *,
            inventory_items (
                name,
                unit_of_measure,
                sku
            )
        `)
        .eq('job_id', jobId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching job inventory usages:', error);
        return [];
    }

    return data;
}

// 4. (Opzionale per ora) Rimozione di un materiale dal lavoro
export async function removeJobInventoryUsage(usageId: string, jobId: string) {
    const supabase = await createServerClient();

    const { error } = await (supabase as any)
        .from('job_inventory_usage')
        .delete()
        .eq('id', usageId);

    if (error) {
        console.error('Error removing inventory usage:', error);
        return { success: false, error: 'Impossibile rimuovere il materiale.' };
    }

    revalidatePath(`/technician/jobs/${jobId}`);
    return { success: true };
}
