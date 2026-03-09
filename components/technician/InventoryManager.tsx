'use client';

import { useState, useEffect } from 'react';
import { getInventoryItems, insertJobInventoryUsage, getJobInventoryUsages, removeJobInventoryUsage, InventoryItem } from '@/lib/actions/inventory';

interface InventoryManagerProps {
    tenantId: string;
    jobId: string;
    technicianId: string;
}

export default function InventoryManager({ tenantId, jobId, technicianId }: InventoryManagerProps) {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [usages, setUsages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const [catalogData, usageData] = await Promise.all([
                getInventoryItems(tenantId),
                getJobInventoryUsages(jobId)
            ]);
            setItems(catalogData);
            setUsages(usageData || []);
            setLoading(false);
        };
        loadData();
    }, [tenantId, jobId]);

    const handleAddUsage = async () => {
        if (!selectedItem || quantity <= 0) return;
        setIsSaving(true);
        const result = await insertJobInventoryUsage(tenantId, jobId, selectedItem.id, quantity, technicianId);
        if (result.success) {
            // Ricarica la lista degli utilizzi
            const usageData = await getJobInventoryUsages(jobId);
            setUsages(usageData || []);
            setSelectedItem(null);
            setQuantity(1);
            setSearchQuery('');
        } else {
            alert(result.error);
        }
        setIsSaving(false);
    };

    const handleRemoveUsage = async (usageId: string) => {
        if (!confirm('Sei sicuro di voler stornare questo materiale dal cantiere?')) return;
        const result = await removeJobInventoryUsage(usageId, jobId);
        if (result.success) {
            const usageData = await getJobInventoryUsages(jobId);
            setUsages(usageData || []);
        } else {
            alert(result.error);
        }
    };

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.sku && item.sku.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (loading) return <div className="p-4 bg-slate-800/50 rounded-2xl animate-pulse h-32"></div>;

    return (
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl">
            <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
                📦 Materiale Utilizzato
            </h3>

            {/* Lista Materiali Usati (Carrello del lavoro) */}
            <div className="space-y-2 mb-6">
                {usages.length === 0 ? (
                    <p className="text-sm text-slate-500 italic">Nessun materiale prelevato dal magazzino per questo intervento.</p>
                ) : (
                    usages.map(u => (
                        <div key={u.id} className="flex justify-between items-center bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                            <div>
                                <div className="font-semibold text-white">{u.inventory_items?.name}</div>
                                <div className="text-xs text-slate-400">
                                    SKU: {u.inventory_items?.sku || 'N/A'} • {u.quantity_used} {u.inventory_items?.unit_of_measure}
                                </div>
                            </div>
                            <button
                                onClick={() => handleRemoveUsage(u.id)}
                                className="text-red-400 hover:bg-red-400/10 p-2 rounded-lg transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Aggiunta Nuovo Materiale */}
            <div className="border-t border-slate-800 pt-4">
                <h4 className="text-sm font-semibold text-slate-300 mb-3">Aggiungi Materiale da Furgone/Magazzino</h4>

                <div className="space-y-4">
                    <input
                        type="text"
                        placeholder="Cerca materiale per nome o SKU..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setSelectedItem(null); // Resetta la selezione quando si cerca
                        }}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />

                    {searchQuery && !selectedItem && (
                        <div className="bg-slate-800 border border-slate-700 rounded-xl max-h-48 overflow-y-auto">
                            {filteredItems.length === 0 ? (
                                <div className="p-3 text-sm text-slate-500 text-center">Nessun risultato trovato</div>
                            ) : (
                                filteredItems.map(item => (
                                    <div
                                        key={item.id}
                                        onClick={() => setSelectedItem(item)}
                                        className="p-3 border-b border-slate-700/50 hover:bg-slate-700 cursor-pointer flex justify-between items-center last:border-0"
                                    >
                                        <div>
                                            <span className="font-semibold">{item.name}</span>
                                            <span className="text-xs text-slate-400 ml-2 block">{item.sku}</span>
                                        </div>
                                        <div className="text-xs font-semibold px-2 py-1 rounded bg-slate-900 border border-slate-600">
                                            Stock: <span className={item.quantity_at_hand <= item.minimum_quantity_alert ? 'text-red-400' : 'text-green-400'}>{item.quantity_at_hand}</span> {item.unit_of_measure}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {selectedItem && (
                        <div className="bg-blue-900/20 border border-blue-800/50 p-4 rounded-xl flex items-center justify-between">
                            <div>
                                <div className="font-semibold text-blue-200">{selectedItem.name}</div>
                                <div className="text-xs text-blue-300/60">Quanti ne hai usati? (Unità: {selectedItem.unit_of_measure})</div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold"
                                >-</button>
                                <input
                                    type="number"
                                    min="1"
                                    value={quantity}
                                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                                    className="w-16 bg-slate-800 border border-slate-700 rounded-lg text-center h-8 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                                <button
                                    onClick={() => setQuantity(quantity + 1)}
                                    className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold"
                                >+</button>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-2">
                        {selectedItem && (
                            <button
                                onClick={() => { setSelectedItem(null); setSearchQuery(''); }}
                                className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all text-sm"
                            >
                                Annulla
                            </button>
                        )}
                        <button
                            onClick={handleAddUsage}
                            disabled={!selectedItem || isSaving}
                            className={`flex-[2] px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {isSaving ? 'Salvataggio...' : 'Conferma Scarico'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
