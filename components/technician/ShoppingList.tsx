'use client';

import { useState, useEffect } from 'react';
import { ShoppingBag, Package, Trash2, CheckCircle, Clock, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface ShoppingItem {
    id?: string;
    nome: string;
    sku?: string;
    prezzo?: string;
    url?: string;
    added_at?: string;
    completed?: boolean;
}

interface ShoppingListProps {
    items: ShoppingItem[];
    onToggleComplete?: (index: number) => void;
    onRemove?: (index: number) => void;
    className?: string;
}

export function ShoppingList({ items, onToggleComplete, onRemove, className }: ShoppingListProps) {
    if (!items || items.length === 0) {
        return (
            <div className={cn("text-center py-10 px-6 border-2 border-dashed border-slate-800 rounded-3xl", className)}>
                <ShoppingBag className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-400 text-sm font-medium">Lista della spesa vuota</p>
                <p className="text-slate-600 text-[11px] mt-1">Chiedi a Niki AI di cercare materiali per aggiungerli qui.</p>
            </div>
        );
    }

    return (
        <div className={cn("space-y-3", className)}>
            <div className="flex items-center justify-between px-1">
                <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-500">Materiali Necessari</h4>
                <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-none px-2 py-0 text-[10px]">
                    {items.length} articoli
                </Badge>
            </div>

            <div className="space-y-2">
                {items.map((item, idx) => (
                    <div 
                        key={idx} 
                        className={cn(
                            "group relative overflow-hidden bg-slate-900 border transition-all duration-300 rounded-2xl p-4",
                            item.completed ? "border-emerald-500/20 bg-emerald-500/5 opacity-70" : "border-slate-800 hover:border-slate-700"
                        )}
                    >
                        <div className="flex gap-4">
                            <div 
                                onClick={() => onToggleComplete?.(idx)}
                                className={cn(
                                    "mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 cursor-pointer transition-colors",
                                    item.completed 
                                        ? "bg-emerald-500 border-emerald-500 text-white" 
                                        : "border-slate-700 hover:border-blue-500"
                                )}
                            >
                                {item.completed && <CheckCircle className="w-4 h-4" />}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <p className={cn(
                                        "font-bold text-sm leading-tight transition-all",
                                        item.completed ? "text-slate-500 line-through" : "text-slate-100"
                                    )}>
                                        {item.nome}
                                    </p>
                                    {item.prezzo && (
                                        <span className="text-emerald-400 font-bold text-xs shrink-0 ml-2">
                                            {item.prezzo}
                                        </span>
                                    )}
                                </div>

                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                                    {item.sku && item.sku !== 'N/A' && (
                                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono uppercase tracking-tight">
                                            <Package className="w-3 h-3" />
                                            SKU: {item.sku}
                                        </div>
                                    )}
                                    {item.added_at && (
                                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                            <Clock className="w-3 h-3" />
                                            {new Date(item.added_at).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Actions on hover */}
                        <div className="absolute right-2 bottom-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {item.url && (
                                <Button asChild variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-blue-400">
                                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                </Button>
                            )}
                            {onRemove && (
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => onRemove(idx)}
                                    className="h-7 w-7 text-slate-500 hover:text-red-500"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
