'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase-browser';
import { TechnicianNav } from '@/components/technician/technician-nav';
import { InventoryItem } from '@/lib/actions/inventory';
import { Search, Mic, Plus, Trash2, Check, X, AlertTriangle, Package, Loader2, Save } from 'lucide-react';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function InventoryPage() {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [tenantId, setTenantId] = useState<string | null>(null);
    const [isListening, setIsListening] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const [pendingItems, setPendingItems] = useState<any[]>([]);
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

    const handleSave = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!tenantId) return;

        const { error } = await (supabase as any).from('inventory_items').insert([{
            tenant_id: tenantId,
            ...formData
        }]);

        if (error) {
            toast.error('Errore salvataggio: ' + error.message);
        } else {
            toast.success('Articolo aggiunto');
            setShowForm(false);
            setFormData({ name: '', sku: '', category: '', quantity_at_hand: 0, minimum_quantity_alert: 5, unit_of_measure: 'pz' });
            loadItems(tenantId);
        }
    };

    const startVoiceAdd = async () => {
        let partialListener: { remove: () => Promise<void> } | null = null;
        try {
            const perm = await SpeechRecognition.checkPermissions();
            if (perm.speechRecognition !== 'granted') {
                const req = await SpeechRecognition.requestPermissions();
                if (req.speechRecognition !== 'granted') return;
            }

            setIsListening(true);
            let finalTranscription = '';

            partialListener = await (SpeechRecognition as any).addListener('partialResults', (data: any) => {
                if (data.matches && data.matches.length > 0) {
                    finalTranscription = data.matches[0];
                }
            });

            await SpeechRecognition.start({
                language: 'it-IT',
                partialResults: true,
                popup: false,
            });

            setTimeout(async () => {
                await SpeechRecognition.stop();
                setIsListening(false);
                if (partialListener) {
                    await partialListener.remove();
                }
                if (finalTranscription) {
                    processTranscription(finalTranscription);
                }
            }, 8000);

        } catch (error) {
            setIsListening(false);
            if (partialListener) {
                await partialListener.remove();
            }
            toast.error('Errore microfono');
        }
    };

    const processTranscription = async (text: string) => {
        setIsParsing(true);
        try {
            const res = await fetch('/api/technician/inventory/voice-parse', {
                method: 'POST',
                body: JSON.stringify({ transcription: text })
            });
            const data = await res.json();
            if (data.items) {
                setPendingItems(data.items);
            }
        } catch (err) {
            toast.error('Errore parsing AI');
        } finally {
            setIsParsing(false);
        }
    };

    const confirmBulkInsert = async () => {
        if (!tenantId || pendingItems.length === 0) return;

        const toInsert = pendingItems.map(item => ({
            tenant_id: tenantId,
            name: item.name,
            quantity_at_hand: item.quantity,
            unit_of_measure: item.unit,
            category: item.category || 'Varie',
            sku: item.sku || '',
            minimum_quantity_alert: 5
        }));

        const { error } = await (supabase as any).from('inventory_items').insert(toInsert);

        if (error) {
            toast.error('Errore inserimento massivo');
        } else {
            toast.success(`${pendingItems.length} articoli aggiunti`);
            setPendingItems([]);
            loadItems(tenantId);
        }
    };

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading && !isParsing) return (
        <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0F172A] text-white pb-32">
            <TechnicianNav />

            <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">MAGAZZINO</h1>
                        <p className="text-slate-400 text-sm font-medium">Gestisci scorte e materiali del furgone</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={startVoiceAdd}
                            disabled={isListening || isParsing}
                            className={cn(
                                "rounded-2xl h-12 px-6 font-bold transition-all shadow-lg",
                                isListening ? "bg-red-500 animate-pulse hover:bg-red-600" : "bg-blue-600/10 text-blue-400 border border-blue-500/20 hover:bg-blue-600/20"
                            )}
                        >
                            {isListening ? <Mic className="w-5 h-5 mr-2" /> : <Mic className="w-5 h-5 mr-2 opacity-70" />}
                            {isListening ? 'Ascolto...' : 'Voce'}
                        </Button>
                        <Button
                            onClick={() => setShowForm(!showForm)}
                            className="bg-white text-black hover:bg-white/90 rounded-2xl h-12 px-6 font-bold shadow-lg"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Aggiungi
                        </Button>
                    </div>
                </div>

                {/* AI Parsing Overlay */}
                {isParsing && (
                    <div className="bg-blue-600/10 border border-blue-500/30 rounded-[2.5rem] p-8 text-center animate-in fade-in zoom-in duration-300">
                        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-4" />
                        <h3 className="text-xl font-bold">Niki sta analizzando...</h3>
                        <p className="text-blue-400/80 text-sm">Sto trasformando la tua voce in articoli strutturati</p>
                    </div>
                )}

                {/* Pending Voice Items */}
                {pendingItems.length > 0 && (
                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-[2.5rem] p-6 space-y-4 animate-in slide-in-from-top duration-500">
                        <div className="flex items-center justify-between">
                            <h3 className="font-black text-emerald-400 flex items-center gap-2">
                                <Check className="w-5 h-5" /> CONFERMA MATERIALI RILEVATI
                            </h3>
                            <Button variant="ghost" size="sm" onClick={() => setPendingItems([])} className="text-slate-500 hover:text-white">Annulla</Button>
                        </div>
                        <div className="grid gap-2">
                            {pendingItems.map((item, i) => (
                                <div key={i} className="flex items-center justify-between bg-white/5 p-3 rounded-2xl border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 text-xs font-bold">
                                            {item.quantity}
                                        </div>
                                        <span className="font-bold text-sm">{item.name}</span>
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{item.unit} • {item.category}</span>
                                </div>
                            ))}
                        </div>
                        <Button onClick={confirmBulkInsert} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl h-12 font-black shadow-xl shadow-emerald-900/20">
                            CARICA TUTTO NEL FURGONE
                        </Button>
                    </div>
                )}

                {/* Search & Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-3 relative group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                        <input
                            type="text"
                            placeholder="Cerca per nome, SKU o categoria..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-[2rem] pl-14 pr-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-600"
                        />
                    </div>
                    <div className="bg-slate-900/30 border border-white/5 rounded-[2rem] p-4 flex items-center justify-center gap-3">
                        <Package className="w-5 h-5 text-slate-500" />
                        <span className="text-xl font-black">{items.length}</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Articoli totali</span>
                    </div>
                </div>

                {/* Manual Form */}
                {showForm && (
                    <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 space-y-6 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center">
                                <Plus className="w-6 h-6 text-blue-500" />
                            </div>
                            <h2 className="text-2xl font-black italic uppercase italic">Aggiungi Materiale</h2>
                        </div>
                        <form onSubmit={handleSave} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Nome Materiale</label>
                                    <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-slate-800/50 border border-white/5 rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" placeholder="es. Cavo elettrico 2.5mm" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">SKU / Codice</label>
                                    <input type="text" value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} className="w-full bg-slate-800/50 border border-white/5 rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" placeholder="es. EL-25-CV" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Categoria</label>
                                    <input type="text" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full bg-slate-800/50 border border-white/5 rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" placeholder="es. Elettricità" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Unità di Misura</label>
                                    <select value={formData.unit_of_measure} onChange={e => setFormData({ ...formData, unit_of_measure: e.target.value })} className="w-full bg-slate-800/50 border border-white/5 rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none transition-all appearance-none">
                                        <option value="pz">Pezzi (pz)</option>
                                        <option value="m">Metri (m)</option>
                                        <option value="kg">Chilogrammi (kg)</option>
                                        <option value="l">Litri (l)</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4 md:col-span-2">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Quantità</label>
                                        <input type="number" required value={formData.quantity_at_hand} onChange={e => setFormData({ ...formData, quantity_at_hand: parseInt(e.target.value) || 0 })} className="w-full bg-slate-800/50 border border-white/5 rounded-2xl px-5 py-3 text-sm" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Allarme Min.</label>
                                        <input type="number" required value={formData.minimum_quantity_alert} onChange={e => setFormData({ ...formData, minimum_quantity_alert: parseInt(e.target.value) || 0 })} className="w-full bg-slate-800/50 border border-white/5 rounded-2xl px-5 py-3 text-sm" />
                                    </div>
                                </div>
                            </div>
                            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white py-6 rounded-2xl font-black text-lg transition-all shadow-xl shadow-blue-900/20">
                                <Save className="w-5 h-5 mr-2" /> SALVA IN INVENTARIO
                            </Button>
                        </form>
                    </div>
                )}

                {/* List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredItems.length === 0 ? (
                        <div className="col-span-full text-center p-20 bg-slate-900/30 border border-white/5 rounded-[3rem] space-y-4">
                            <Package className="w-16 h-16 text-slate-700 mx-auto" />
                            <p className="text-slate-500 font-medium italic">Nessun materiale trovato corrispondente alla ricerca.</p>
                        </div>
                    ) : (
                        filteredItems.map(item => {
                            const isLowStock = item.quantity_at_hand <= item.minimum_quantity_alert;
                            return (
                                <div key={item.id} className={cn(
                                    "group bg-slate-900/40 backdrop-blur-md border rounded-[2rem] p-6 transition-all duration-300 hover:-translate-y-1",
                                    isLowStock ? 'border-red-500/30 shadow-lg shadow-red-900/10' : 'border-white/5 hover:border-white/20'
                                )}>
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-black text-lg leading-tight uppercase tracking-tight">{item.name}</h3>
                                            </div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                {item.category || 'Senza Categoria'} {item.sku && `• SKU: ${item.sku}`}
                                            </p>
                                        </div>
                                        {isLowStock && (
                                            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                                                <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-end justify-between">
                                        <div className="space-y-0.5">
                                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Giacenza</p>
                                            <div className={cn(
                                                "text-4xl font-black tracking-tighter",
                                                isLowStock ? 'text-red-400' : 'text-white'
                                            )}>
                                                {item.quantity_at_hand}
                                                <span className="text-sm font-bold text-slate-500 ml-1.5 uppercase">{item.unit_of_measure}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Status</p>
                                            {isLowStock ? (
                                                <span className="bg-red-500/20 text-red-400 text-[9px] px-3 py-1 rounded-full border border-red-500/20 font-black uppercase tracking-widest underline decoration-wavy">Low Stock</span>
                                            ) : (
                                                <span className="bg-emerald-500/10 text-emerald-400 text-[9px] px-3 py-1 rounded-full border border-emerald-500/10 font-black uppercase tracking-widest">In Stock</span>
                                            )}
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
