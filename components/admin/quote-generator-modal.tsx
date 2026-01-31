'use client';

import { useState, useRef } from 'react';
import { Database } from '@/lib/database.types';
import { X, Plus, Trash2, Printer, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClientAnimationWrapper } from '@/components/ui/client-animation-wrapper';

type Ticket = Database['public']['Tables']['tickets']['Row'];

interface QuoteItem {
    id: string;
    description: string;
    quantity: number;
    price: number;
}

interface QuoteGeneratorModalProps {
    readonly isOpen: boolean;
    readonly onClose: () => void;
    readonly ticket: Ticket;
}

export function QuoteGeneratorModal({ isOpen, onClose, ticket }: QuoteGeneratorModalProps) {
    const [items, setItems] = useState<QuoteItem[]>(() => {
        // Initialize with ticket data if available
        if (ticket.description || ticket.price_range_min) {
            return [{
                id: '1',
                description: ticket.description || 'Intervento tecnico',
                quantity: 1,
                price: ticket.price_range_min || 0
            }];
        }
        // Default mock item
        return [
            { id: '1', description: 'Intervento tecnico (diritto di chiamata)', quantity: 1, price: 50 }
        ];
    });

    const [notes, setNotes] = useState('');
    const [vatRate, setVatRate] = useState(22);

    const contentRef = useRef<HTMLDivElement>(null);

    if (!isOpen) return null;

    const addItem = () => {
        setItems([...items, { id: crypto.randomUUID(), description: '', quantity: 1, price: 0 }]);
    };

    const removeItem = (id: string) => {
        // Prevent removing the last item? No, user might want to clear.
        setItems(items.filter(i => i.id !== id));
    };

    const updateItem = (id: string, field: keyof QuoteItem, value: string | number) => {
        setItems(items.map(i => {
            if (i.id === id) {
                return { ...i, [field]: value };
            }
            return i;
        }));
    };

    const subtotal = items.reduce((acc, item) => acc + (item.quantity * item.price), 0);
    const vat = subtotal * (vatRate / 100);
    const total = subtotal + vat;

    const handlePrint = () => {
        // Wait for next tick to ensure styles are applied or just print
        // The CSS @media print is usually enough
        setTimeout(() => {
            globalThis.print();
        }, 100);
    };

    return (
        <dialog open className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-transparent" aria-modal="true">
            {/* Backdrop */}
            <button
                type="button"
                className="absolute inset-0 bg-black/80 backdrop-blur-sm print:hidden w-full h-full cursor-default"
                onClick={onClose}
                onKeyDown={(e) => e.key === 'Escape' && onClose()}
                aria-label="Close modal"
            ></button>

            {/* Modal Content */}
            <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden print:overflow-visible print:max-h-none print:shadow-none print:w-full print:max-w-none print:fixed print:inset-0 print:rounded-none print-container">
                <ClientAnimationWrapper>

                    {/* Header (Hidden in Print) */}
                    <div className="flex items-center justify-between p-4 border-b bg-slate-50 print:hidden">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="font-bold text-slate-800">Generatore Preventivo</h2>
                                <p className="text-xs text-slate-500">Ticket #{ticket.id.slice(0, 8)}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={handlePrint} className="gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                <Printer className="w-4 h-4" />
                                Stampa / PDF
                            </Button>
                            <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>

                    {/* Main Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-8 print:p-0 print:overflow-visible" ref={contentRef}>

                        {/* PRINT LAYOUT */}
                        <div className="max-w-3xl mx-auto bg-white min-h-[800px] print:min-h-0">

                            {/* 1. Header Azienda */}
                            <div className="flex justify-between items-start mb-12">
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-900 mb-1">Niki Tuttofare</h1>
                                    <p className="text-sm text-slate-500">Soluzioni rapide per la casa</p>
                                    <div className="mt-4 text-xs text-slate-600 space-y-0.5">
                                        <p>P.IVA: 12345678901</p>
                                        <p>Via Roma 123, Milano (MI)</p>
                                        <p>info@nikituttofare.it</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <h2 className="text-xl font-light text-slate-400 uppercase tracking-widest mb-4">Preventivo</h2>
                                    <div className="text-sm">
                                        <p className="font-bold text-slate-800">#{new Date().getFullYear()}-{ticket.id.slice(0, 4)}</p>
                                        <p className="text-slate-500">{new Date().toLocaleDateString('it-IT')}</p>
                                    </div>
                                </div>
                            </div>

                            {/* 2. Cliente Info */}
                            <div className="bg-slate-50 rounded-lg p-6 mb-12 print:bg-transparent print:p-0 print:border print:border-slate-200">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Cliente</h3>
                                <div className="grid grid-cols-2 gap-8">
                                    <div>
                                        <p className="font-bold text-slate-800 text-lg">{ticket.customer_name || 'Cliente'}</p>
                                        <p className="text-slate-600 text-sm mt-1">{ticket.address}</p>
                                        <p className="text-slate-600 text-sm">{ticket.city}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-slate-600">{ticket.contact_phone || ''}</p>
                                    </div>
                                </div>
                            </div>

                            {/* 3. Items Editing Table (Editable in UI, Static in Print) */}
                            <div className="mb-12">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b-2 border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                            <th className="pb-3 w-[50%]">Descrizione</th>
                                            <th className="pb-3 text-right">Qtà</th>
                                            <th className="pb-3 text-right">Prezzo</th>
                                            <th className="pb-3 text-right">Totale</th>
                                            <th className="pb-3 w-8 print:hidden"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {items.map((item) => (
                                            <tr key={item.id} className="border-b border-slate-50 group">
                                                <td className="py-3 pr-4">
                                                    <input
                                                        type="text"
                                                        value={item.description}
                                                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                                        className="w-full bg-transparent border-none p-0 focus:ring-0 placeholder:text-slate-300 print:text-black"
                                                        placeholder="Descrizione voce..."
                                                    />
                                                </td>
                                                <td className="py-3 text-right w-20">
                                                    <input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                                                        className="w-full bg-transparent border-none p-0 focus:ring-0 text-right print:text-black"
                                                    />
                                                </td>
                                                <td className="py-3 text-right w-24">
                                                    <input
                                                        type="number"
                                                        value={item.price}
                                                        onChange={(e) => updateItem(item.id, 'price', Number(e.target.value))}
                                                        className="w-full bg-transparent border-none p-0 focus:ring-0 text-right print:text-black"
                                                    />
                                                </td>
                                                <td className="py-3 text-right font-medium">
                                                    € {(item.quantity * item.price).toFixed(2)}
                                                </td>
                                                <td className="py-3 pl-2 print:hidden">
                                                    <button onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                <div className="mt-4 print:hidden">
                                    <Button variant="outline" size="sm" onClick={addItem} className="gap-2 text-slate-600 border-dashed">
                                        <Plus className="w-4 h-4" /> Aggiungi Voce
                                    </Button>
                                </div>
                            </div>

                            {/* 4. Totals */}
                            <div className="flex justify-end mb-12">
                                <div className="w-64 space-y-3">
                                    <div className="flex justify-between text-sm text-slate-600">
                                        <span>Imponibile</span>
                                        <span>€ {subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-slate-600">
                                        <span className="flex items-center gap-2">
                                            IVA
                                            {' '}
                                            <input
                                                type="number"
                                                value={vatRate}
                                                onChange={(e) => setVatRate(Number(e.target.value))}
                                                className="w-10 bg-slate-50 border rounded px-1 text-center text-xs print:hidden"
                                            />
                                            <span className="hidden print:inline">{vatRate}%</span>
                                        </span>
                                        <span>€ {vat.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold text-slate-900 border-t-2 border-slate-900 pt-3">
                                        <span>TOTALE</span>
                                        <span>€ {total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* 5. Footer / Notes */}
                            <div className="border-t pt-8">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Note & Condizioni</h4>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="w-full text-sm text-slate-600 bg-transparent border-none p-0 focus:ring-0 resize-none print:text-black"
                                    rows={4}
                                    placeholder="Inserisci note aggiuntive, tempi di validità, coordinate bancarie..."
                                >
                                    Preventivo valido per 30 giorni. Pagamento bonifico bancario 30gg d.f.
                                    IBAN: IT00 0000 0000 0000 0000 0000 00
                                </textarea>
                            </div>

                        </div>
                    </div>

                    {/* Footer Actions (Hidden in Print) */}
                    <div className="p-4 border-t bg-slate-50 flex justify-between print:hidden">
                        <div className="text-xs text-slate-400 flex items-center gap-2">
                            <Badge variant="outline" className="text-slate-500 border-slate-300">A4 Layout</Badge>
                            <span>Pronto per la stampa</span>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={onClose}>Chiudi</Button>
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2" onClick={handlePrint}>
                                <Printer className="w-4 h-4" /> Stampa
                            </Button>
                        </div>
                    </div>
                </ClientAnimationWrapper>
            </div>

            {/* Print CSS Injection */}
            <style jsx global>{`
                @media print {
                    @page { margin: 0; size: A4; }
                    body {
                        visibility: hidden;
                    }
                    .print-container, .print-container * {
                        visibility: visible;
                    }
                    .print-container {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        margin: 0;
                        padding: 0;
                        background: white;
                    }
                }
            `}</style>
        </dialog>
    );
}
