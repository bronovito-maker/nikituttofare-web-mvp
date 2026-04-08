'use client';

import { useState, useEffect, useRef } from 'react';
import { getInventoryItems, insertJobInventoryUsage, getJobInventoryUsages, removeJobInventoryUsage, InventoryItem } from '@/lib/actions/inventory';
import { Mic } from 'lucide-react';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import { cn } from '@/lib/utils';

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
    const [isRecording, setIsRecording] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const isRecordingRef = useRef(false);
    const voiceTextRef = useRef('');

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

    const startVoiceInput = async (e?: React.TouchEvent | React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (isRecordingRef.current) return;

        voiceTextRef.current = '';
        setSearchQuery('');

        const platform = typeof window !== 'undefined' ? (window as any).Capacitor?.getPlatform() : 'web';
        const isNative = platform !== 'web';
        
        if (!isNative) {
            // Web Fallback
            const SpeechRecog = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
            if (!SpeechRecog) return;
            const rec = new SpeechRecog();
            rec.lang = 'it-IT';
            rec.continuous = false;
            rec.interimResults = true;
            (window as any)._webSpeechRecInv = rec;
            rec.onstart = () => { setIsRecording(true); isRecordingRef.current = true; };
            rec.onresult = (e: any) => {
                let current = '';
                for (let i = 0; i < e.results.length; i++) {
                    current += e.results[i][0].transcript;
                }
                voiceTextRef.current = current;
                setSearchQuery(current);
                setSelectedItem(null);
            };
            rec.onend = () => { 
                setIsRecording(false); 
                isRecordingRef.current = false; 
                processSmartMatch(voiceTextRef.current);
            };
            rec.start();
        } else {
            // Native Logic using Capacitor SpeechRecognition
            try {
                const perm = await SpeechRecognition.checkPermissions();
                if (perm.speechRecognition !== 'granted') {
                    const req = await SpeechRecognition.requestPermissions();
                    if (req.speechRecognition !== 'granted') {
                        setIsRecording(false);
                        isRecordingRef.current = false;
                        return;
                    }
                }

                setIsRecording(true); 
                isRecordingRef.current = true;
                
                if ((window as any)._partialSpeechListenerInv) {
                    await (window as any)._partialSpeechListenerInv.remove();
                }
                
                (window as any)._partialSpeechListenerInv = await (SpeechRecognition as any).addListener('partialResults', (data: any) => {
                    if (data.matches && data.matches.length > 0) {
                        voiceTextRef.current = data.matches[0];
                        setSearchQuery(data.matches[0]);
                        setSelectedItem(null);
                    }
                });

                await SpeechRecognition.start({
                    language: 'it-IT',
                    partialResults: true,
                    popup: false,
                });
            } catch (error) {
                console.error("Native speech recognition error:", error);
                setIsRecording(false); 
                isRecordingRef.current = false;
            }
        }
    };

    const stopVoiceInput = async (e?: React.TouchEvent | React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (!isRecordingRef.current) return;

        const platform = typeof window !== 'undefined' ? (window as any).Capacitor?.getPlatform() : 'web';
        const isNative = platform !== 'web';

        setIsRecording(false);
        isRecordingRef.current = false;
        
        if (isNative) {
            try {
                await SpeechRecognition.stop();
                processSmartMatch(voiceTextRef.current);
            } catch (err) {
                console.error("Error stopping native voice:", err);
            }
        } else if ((window as any)._webSpeechRecInv) {
            (window as any)._webSpeechRecInv.stop();
        }
    };

    const processSmartMatch = async (text: string) => {
        if (!text || !text.trim()) return;
        setIsParsing(true);
        try {
            const res = await fetch('/api/technician/inventory/smart-match', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transcription: text, mode: 'discharge' })
            });
            const data = await res.json();
            
            if (data.matched && data.matched.length > 0) {
                let successCount = 0;
                setIsSaving(true);
                for (const match of data.matched) {
                    const result = await insertJobInventoryUsage(tenantId, jobId, match.inventoryItemId, match.quantity, technicianId);
                    if (result.success) successCount++;
                }
                
                const usageData = await getJobInventoryUsages(jobId);
                setUsages(usageData || []);
                setIsSaving(false);
                
                let message = `Dettatura completata! Aggiunti ${successCount} articoli correttamente.`;
                if (data.unmatched && data.unmatched.length > 0) {
                    message += `\nAttenzione, alcuni articoli non sono nel catalogo: ${data.unmatched.map((u: any) => u.nameMentioned).join(', ')}.`;
                }
                alert(message);
            } else if (data.unmatched && data.unmatched.length > 0) {
                alert(`Nessun articolo corrispondente trovato nel magazzino. Rilevati: ${data.unmatched.map((u: any) => u.nameMentioned).join(', ')}`);
            } else {
                alert('Nessun articolo chiaro rilevato dalla voce.');
            }
        } catch (error) {
            alert("Errore durante l'analisi AI del magazzino.");
        }
        setIsParsing(false);
        setSearchQuery('');
        voiceTextRef.current = '';
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
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            placeholder="Cerca materiale per nome o SKU..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setSelectedItem(null); // Resetta la selezione quando si cerca
                            }}
                            className="w-full flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                        <button 
                            onTouchStart={startVoiceInput}
                            onTouchEnd={stopVoiceInput}
                            onTouchCancel={stopVoiceInput}
                            onMouseDown={startVoiceInput}
                            onMouseUp={stopVoiceInput}
                            onMouseLeave={stopVoiceInput}
                            onContextMenu={(e) => e.preventDefault()}
                            disabled={isParsing}
                            className={cn(
                                "p-3 rounded-xl transition-all select-none self-stretch flex items-center justify-center relative",
                                isRecording ? "bg-red-500 text-white animate-pulse scale-110 shadow-lg shadow-red-500/20 border-red-500" : "bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700",
                                isParsing ? "opacity-50 cursor-wait bg-blue-900 border-blue-500 text-blue-300" : ""
                            )}
                        >
                            {isParsing ? (
                                <svg className="animate-spin h-5 w-5 text-blue-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <Mic className="w-5 h-5" />
                            )}
                        </button>
                    </div>

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
