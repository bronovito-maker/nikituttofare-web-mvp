import { createServerClient } from '@/lib/supabase-server';
import { LeadsClient } from './client';
import { redirect } from 'next/navigation';
import { AddLeadDialog } from '@/components/admin/leads/add-lead-dialog';

export default async function LeadsPage() {
    const supabase = await createServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        redirect('/login');
    }

    // Check if admin (optional, strict check in RLS but good for UX redirect)
    // Assuming getting profile or relying on RLS to return empty/error if not allowed.
    // For now relying on RLS.

    const { data: leads, error } = await supabase
        .from('leads' as any)
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching leads:", error);
        return <div>Errore nel caricamento dei leads.</div>;
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        CRM Horeca Leads
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">Gestisci e monitora i contatti commerciali.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-muted/50 px-4 py-2 rounded-lg text-sm text-muted-foreground hidden sm:block">
                        {leads?.length || 0} Strutture
                    </div>
                    <AddLeadDialog />
                </div>
            </div>

            <LeadsClient leads={(leads as any) || []} />
        </div>
    );
}
