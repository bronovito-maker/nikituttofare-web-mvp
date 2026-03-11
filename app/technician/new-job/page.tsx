'use client';

import { createManualJob, searchCustomers } from '@/app/actions/technician-actions';
import { CreateManualJobParams } from '@/lib/types/internal-app';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';

export default function NewJobPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [suggestions, setSuggestions] = useState<{ id: string | null; full_name: string; phone: any; address: string; city: string }[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);

    const [formData, setFormData] = useState<CreateManualJobParams>({
        category: 'generic',
        description: '',
        customer_name: '',
        contact_phone: 0,
        city: '',
        address: '',
        priority: 'medium',
        scheduled_at: (() => {
            const now = new Date();
            const offset = now.getTimezoneOffset() * 60000;
            const localISOTime = new Date(now.getTime() - offset).toISOString().slice(0, 16);
            return localISOTime;
        })(),
        user_id: null,
    });

    const categories = [
        { value: 'plumbing', label: 'Idraulica 🚰', color: '#3B82F6' },
        { value: 'electric', label: 'Elettricista ⚡', color: '#F59E0B' },
        { value: 'climate', label: 'Climatizzazione ❄️', color: '#10B981' },
        { value: 'locksmith', label: 'Fabbro 🔑', color: '#6B7280' },
        { value: 'handyman', label: 'Tuttofare 🛠️', color: '#EC4899' },
        { value: 'generic', label: 'Generico 📦', color: '#8B5CF6' },
    ];

    const handleSearch = async (query: string) => {
        if (query.length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        setIsSearching(true);
        try {
            console.log('Searching for:', query);
            const results = await searchCustomers(query);
            console.log('Results received:', results);
            setSuggestions(results);
            setShowSuggestions(true); // Mostriamo comunque se abbiamo avviato la ricerca
        } catch (err) {
            console.error('Search error:', err);
        } finally {
            setIsSearching(false);
        }
    };

    const selectCustomer = (customer: { id: string | null; full_name: string; contact_phone: any; address: string; city: string }) => {
        // Log per debug
        console.log('Customer selected:', customer);
        
        setFormData((prev: CreateManualJobParams) => ({
            ...prev,
            customer_name: customer.full_name || '',
            contact_phone: customer.contact_phone ? String(customer.contact_phone) : (prev.contact_phone || ''),
            address: customer.address || prev.address,
            city: customer.city || prev.city,
            user_id: customer.id,
        }));
        setShowSuggestions(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Convertiamo l'orario locale (datetime-local) in un oggetto Date
            // e poi in ISO string (UTC) per il database. 
            // Questo evita lo shift di 1 ora se Supabase riceve una stringa senza offset.
            const scheduledAtISO = formData.scheduled_at 
                ? new Date(formData.scheduled_at).toISOString() 
                : null;

            const result = await createManualJob({
                ...formData,
                contact_phone: Number(formData.contact_phone),
                scheduled_at: scheduledAtISO as any
            });

            if (result.success) {
                router.push('/technician/jobs');
            } else {
                setError(result.error || 'Errore durante la creazione del lavoro');
            }
        } catch (err: any) {
            setError(err.message || 'Si è verificato un errore');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev: CreateManualJobParams) => {
            const newState = { ...prev, [name]: value };
            // Se l'utente modifica il nome a mano dopo aver selezionato un cliente, resettiamo lo user_id
            if (name === 'customer_name') {
                newState.user_id = null;
            }
            return newState;
        });

        if (name === 'customer_name') {
            if (searchTimeout.current) clearTimeout(searchTimeout.current);
            searchTimeout.current = setTimeout(() => handleSearch(value), 300);
        }
    };

    return (
        <div className="min-h-screen bg-[#0F172A] text-white p-4 pb-24 md:p-8">
            <div className="max-w-2xl mx-auto">
                <header className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
                            Nuovo Lavoro
                        </h1>
                        <p className="text-slate-400">Inserimento manuale da chiamata</p>
                    </div>
                    <button
                        onClick={() => router.back()}
                        className="p-2 bg-slate-800 text-white rounded-full hover:bg-slate-700 transition-colors shadow-lg border border-slate-700/50"
                        aria-label="Chiudi"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </header>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl mb-6 shadow-lg shadow-red-500/5 animate-pulse">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Categoria Grid */}
                    <section className="space-y-3">
                        <label className="text-sm font-medium text-slate-300 ml-1">Tipo di Intervento</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {categories.map((cat) => (
                                <button
                                    key={cat.value}
                                    type="button"
                                    onClick={() => setFormData((p: CreateManualJobParams) => ({ ...p, category: cat.value as any }))}
                                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${formData.category === cat.value
                                            ? 'border-blue-500 bg-blue-500/10 scale-105 shadow-lg shadow-blue-500/10'
                                            : 'border-slate-800 bg-slate-900/50 grayscale opacity-60 hover:grayscale-0 hover:opacity-100'
                                        }`}
                                >
                                    <span className="text-lg">{cat.label.split(' ')[1]}</span>
                                    <span className="text-xs font-semibold">{cat.label.split(' ')[0]}</span>
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Dati Cliente */}
                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl space-y-4 backdrop-blur-xl">
                        <h2 className="text-lg font-bold flex items-center gap-2 mb-2">
                            <span className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">👤</span>
                            Dati del Cliente
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2 relative">
                                <label className="text-xs text-slate-400 uppercase tracking-wider ml-1">Nome Completo</label>
                                <input
                                    required
                                    name="customer_name"
                                    value={formData.customer_name}
                                    onChange={handleChange}
                                    onFocus={() => {
                                        if (formData.customer_name.length >= 2) {
                                            handleSearch(formData.customer_name);
                                        }
                                    }}
                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 300)}
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all pr-10"
                                    placeholder="es. Mario Rossi"
                                />
                                {isSearching && (
                                    <div className="absolute right-3 top-[38px] animate-spin h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full" />
                                )}
                                {showSuggestions && formData.customer_name.length >= 2 && (
                                    <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
                                        {isSearching ? (
                                            <div className="px-4 py-3 text-slate-400 text-sm flex items-center gap-2">
                                                <div className="animate-spin h-3 w-3 border-2 border-indigo-500 border-t-transparent rounded-full" />
                                                Ricerca in corso...
                                            </div>
                                        ) : suggestions.length > 0 ? (
                                            suggestions.map((s: any, i: number) => (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    onClick={() => selectCustomer(s)}
                                                    className="w-full text-left px-4 py-3 hover:bg-slate-700 transition-colors border-b border-slate-700/50 last:border-none flex flex-col"
                                                >
                                                    <span className="font-bold text-sm text-white">{s.full_name}</span>
                                                    <span className="text-[10px] text-slate-400 capitalize">
                                                        {s.city} • {s.address} ({s.contact_phone})
                                                    </span>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="px-4 py-3 text-slate-400 text-sm italic bg-slate-800/80">
                                                Nessun cliente trovato nello storico
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs text-slate-400 uppercase tracking-wider ml-1">Telefono</label>
                                <input
                                    required
                                    type="tel"
                                    name="contact_phone"
                                    value={formData.contact_phone || ''}
                                    onChange={handleChange}
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                    placeholder="333 1234567"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-800 pt-4">
                            <div className="md:col-span-1 space-y-2">
                                <label className="text-xs text-slate-400 uppercase tracking-wider ml-1">Città</label>
                                <input
                                    required
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                    placeholder="Firenze"
                                />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-xs text-slate-400 uppercase tracking-wider ml-1">Indirizzo</label>
                                <input
                                    required
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                    placeholder="Via Roma 123"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Dettagli Lavoro */}
                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl space-y-4 backdrop-blur-xl">
                        <h2 className="text-lg font-bold flex items-center gap-2 mb-2">
                            <span className="p-2 bg-blue-500/10 rounded-lg text-blue-400">📝</span>
                            Dettagli Intervento
                        </h2>

                        <div className="space-y-2">
                            <label className="text-xs text-slate-400 uppercase tracking-wider ml-1">Descrizione del Problema</label>
                            <textarea
                                required
                                name="description"
                                rows={4}
                                value={formData.description}
                                onChange={handleChange}
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none"
                                placeholder="Descrivi brevemente il lavoro da svolgere..."
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs text-slate-400 uppercase tracking-wider ml-1">Appuntamento</label>
                                <input
                                    type="datetime-local"
                                    name="scheduled_at"
                                    value={formData.scheduled_at}
                                    onChange={handleChange}
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all color-scheme-dark"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs text-slate-400 uppercase tracking-wider ml-1">Priorità</label>
                                <select
                                    name="priority"
                                    value={formData.priority}
                                    onChange={handleChange}
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none"
                                >
                                    <option value="low">Bassa</option>
                                    <option value="medium">Media</option>
                                    <option value="high">Alta</option>
                                    <option value="urgent">Urgente 🚨</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-5 rounded-2xl text-lg font-bold transition-all transform active:scale-95 shadow-2xl ${loading
                                ? 'bg-slate-700 cursor-not-allowed'
                                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/20'
                            }`}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Creazione in corso...
                            </span>
                        ) : "Crea Lavoro"}
                    </button>
                </form>
            </div>

            <style jsx global>{`
        .color-scheme-dark {
          color-scheme: dark;
        }
      `}</style>
        </div>
    );
}
