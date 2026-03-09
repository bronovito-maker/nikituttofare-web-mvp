'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase-browser';
import { TechnicianNav } from '@/components/technician/technician-nav';
import { InventoryItem } from '@/lib/actions/inventory';

export default function InventoryPage() {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [tenantId, setTenantId] = useState<string | null>(null);
    const supabase = createBrowserClient();
    const router = useRouter();

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        category: '',
        quantity_at_hand: 0,
        minimum_quantity_alert: 5,
        unit_of_measure: 'pz'
    });

    useEffect(() => {
        const checkAuthAndLoad = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/technician/login');
                return;
            }
            const tId = user.user_metadata?.tenant_id;
            setTenantId(tId);

            if (tId) {
                await loadItems(tId);
            }
        };
        checkAuthAndLoad();
    }, [router, supabase]);

    const loadItems = async (tId: string) => {
        setLoading(true);
        const { data } = await (supabase as any)
            .from('inventory_items')
            .select('*')
            .eq('tenant_id', tId)
            .order('name', { ascending: true });

        if (data) setItems(data as InventoryItem[]);
        setLoading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tenantId) return;

        const { error } = await (supabase as any).from('inventory_items').insert([{
            tenant_id: tenantId,
            ...formData
        }]);

        if (error) {
            alert('Errore salvataggio: ' + error.message);
        } else {
            setShowForm(false);
            setFormData({ name: '', sku: '', category: '', quantity_at_hand: 0, minimum_quantity_alert: 5, unit_of_measure: 'pz' });
            loadItems(tenantId);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0F172A] text-white pb-24">
            <TechnicianNav />

            <div className="p-4 md:p-6 max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold font-heading">📦 Magazzino / Furgone</h1>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl text-sm font-bold transition-colors"
                    >
                        {showForm ? 'Annulla' : '+ Nuovo Articolo'}
                    </button>
                </div>

                {showForm && (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8">
                        <h2 className="text-lg font-bold mb-4">Aggiungi Materiale</h2>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-slate-400 mb-1 block">Nome Materiale</label>
                                    <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm" placeholder="es. Cavo elettrico 2.5mm" />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 mb-1 block">SKU / Codice</label>
                                    <input type="text" value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm" placeholder="es. EL-25-CV" />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 mb-1 block">Categoria</label>
                                    <input type="text" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm" placeholder="es. Elettricità" />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 mb-1 block">Unità di Misura</label>
                                    <select value={formData.unit_of_measure} onChange={e => setFormData({ ...formData, unit_of_measure: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm appearance-none">
                                        <option value="pz">Pezzi (pz)</option>
                                        <option value="m">Metri (m)</option>
                                        <option value="kg">Chilogrammi (kg)</option>
                                        <option value="l">Litri (l)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 mb-1 block">Qtà Iniziale</label>
                                    <input type="number" required value={formData.quantity_at_hand} onChange={e => setFormData({ ...formData, quantity_at_hand: parseInt(e.target.value) || 0 })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 mb-1 block">Allarme Scorta Minima</label>
                                    <input type="number" required value={formData.minimum_quantity_alert} onChange={e => setFormData({ ...formData, minimum_quantity_alert: parseInt(e.target.value) || 0 })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm" />
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-green-600 hover:bg-green-500 py-3 rounded-xl font-bold mt-4 transition-colors">Salva in Inventario</button>
                        </form>
                    </div>
                )}

                <div className="space-y-3">
                    {items.length === 0 ? (
                        <div className="text-center p-12 bg-slate-900 border border-slate-800 rounded-2xl text-slate-500">
                            Nessun materiale in magazzino.
                        </div>
                    ) : (
                        items.map(item => {
                            const isLowStock = item.quantity_at_hand <= item.minimum_quantity_alert;
                            return (
                                <div key={item.id} className={`bg-slate-900 border ${isLowStock ? 'border-red-500/50' : 'border-slate-800'} rounded-2xl p-4 flex justify-between items-center transition-all hover:bg-slate-800/80`}>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-lg">{item.name}</h3>
                                            {isLowStock && <span className="bg-red-500/20 text-red-400 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider animate-pulse">Scorta Bassa</span>}
                                        </div>
                                        <p className="text-xs text-slate-400 mt-1">
                                            {item.sku && <span className="mr-3">SKU: {item.sku}</span>}
                                            {item.category && <span>Cat: {item.category}</span>}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-2xl font-black ${isLowStock ? 'text-red-400' : 'text-green-400'}`}>
                                            {item.quantity_at_hand} <span className="text-sm font-normal text-slate-500">{item.unit_of_measure}</span>
                                        </div>
                                        <div className="text-[10px] text-slate-500 mt-1">
                                            Min: {item.minimum_quantity_alert}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
