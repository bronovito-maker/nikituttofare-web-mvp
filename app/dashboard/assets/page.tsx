import { createServerClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { AddAssetDialog } from '@/components/dashboard/add-asset-dialog';
import { AssetCard } from '@/components/dashboard/asset-card';
import { Building } from 'lucide-react';

export default async function AssetsPage() {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Fetch assets
    const { data: assets } = await supabase
        .from('user_assets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    return (
        <div className="container py-8 max-w-5xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold">I Miei Immobili</h1>
                    <p className="text-muted-foreground mt-1">Gestisci i luoghi dove richiedi assistenza ricorrente.</p>
                </div>
                <AddAssetDialog />
            </div>

            {!assets || assets.length === 0 ? (
                <div className="text-center py-16 border rounded-xl bg-card border-dashed">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                        <Building className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-1">Nessun immobile salvato</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                        Aggiungi il tuo primo indirizzo per velocizzare le richieste di intervento future.
                    </p>
                    <AddAssetDialog />
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {assets.map((asset) => (
                        <AssetCard key={asset.id} asset={asset} />
                    ))}
                </div>
            )}
        </div>
    );
}
