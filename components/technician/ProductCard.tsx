'use client';

import { useState } from 'react';
import { ExternalLink, ShoppingCart, Info, MapPin, Maximize2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export interface ProductMetadata {
    nome: string;
    prezzo: string;
    sku?: string;
    corsia?: string;
    url?: string;
    image_url?: string;
}

interface ProductCardProps {
    product: ProductMetadata;
    onAddToList?: (product: ProductMetadata) => void;
    isAdded?: boolean;
}

export function ProductCard({ product, onAddToList, isAdded }: ProductCardProps) {
    const [isImageOpen, setIsImageOpen] = useState(false);
    const [imgError, setImgError] = useState(false);
    
    // Check if image_url is valid and not "N/A"
    const hasImage = product.image_url && product.image_url !== 'N/A' && !imgError;

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg my-2 animate-in fade-in zoom-in-95 duration-300 w-full max-w-full">
            <div className="flex h-full min-w-0 w-full">
                {/* Product Image Section */}
                {hasImage && (
                    <div className="relative w-20 sm:w-24 aspect-square bg-white shrink-0 group overflow-hidden">
                        <Image 
                            src={product.image_url!} 
                            alt={product.nome}
                            fill
                            className="object-contain p-1"
                            unoptimized
                            onError={() => setImgError(true)}
                        />
                        <Dialog open={isImageOpen} onOpenChange={setIsImageOpen}>
                            <DialogTrigger asChild>
                                <button className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <Maximize2 className="w-6 h-6 text-white" />
                                </button>
                            </DialogTrigger>
                            <DialogContent className="max-w-[95vw] max-h-[90vh] p-0 border-none bg-black/95 flex flex-col items-center justify-center">
                                <DialogHeader>
                                    <DialogTitle className="sr-only">{product.nome}</DialogTitle>
                                </DialogHeader>
                                <div className="relative w-full h-[80vh] flex items-center justify-center p-4">
                                    <Image 
                                        src={product.image_url!} 
                                        alt={product.nome}
                                        fill
                                        className="object-contain rounded-lg"
                                        unoptimized
                                    />
                                    <button 
                                        onClick={() => setIsImageOpen(false)}
                                        className="absolute top-4 right-4 z-10 bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
                                    >
                                        <X className="w-5 h-5 text-white" />
                                    </button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                )}

                {/* Content Section */}
                <div className={`p-4 flex-1 flex flex-col justify-between space-y-3 ${!hasImage ? 'w-full' : ''}`}>
                    <div className="space-y-1 min-w-0 overflow-hidden">
                        <div className="flex justify-between items-start gap-2">
                            <h4 className="font-bold text-slate-100 leading-tight text-[13px] break-words">
                                {product.nome}
                            </h4>
                            <Badge variant="outline" className="shrink-0 bg-blue-500/10 text-blue-400 border-blue-500/20 text-[8px] font-bold px-1 h-4">
                                TECNOMAT
                            </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                            <div className="flex items-center gap-1.5">
                                <span className="text-slate-500 uppercase font-black text-[7px] tracking-widest">Prezzo</span>
                                <span className="text-emerald-400 font-bold text-sm tracking-tight">{product.prezzo}</span>
                            </div>
                            {product.corsia && product.corsia !== 'N/A' && (
                                <div className="flex items-center gap-1.5 border-l border-slate-800 pl-4">
                                    <span className="text-slate-500 uppercase font-black text-[7px] tracking-widest">Posizione</span>
                                    <div className="flex items-center gap-1 text-slate-200 font-bold text-[11px]">
                                        <MapPin className="w-3 h-3 text-orange-500" />
                                        {(product.corsia.startsWith('Corsia') || product.corsia.startsWith('Reparto')) 
                                            ? product.corsia 
                                            : `Pos. ${product.corsia}`}
                                    </div>
                                </div>
                            )}
                        </div>

                        {product.sku && product.sku !== 'N/A' && (
                            <div className="text-[9px] text-slate-500 font-mono">
                                SKU: {product.sku}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {product.url && product.url !== 'N/A' && (
                            <Button 
                                asChild 
                                variant="secondary" 
                                size="sm" 
                                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 h-7 text-[10px] font-bold rounded-lg"
                            >
                                <a href={product.url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="w-3 h-3 mr-1" />
                                    Scheda
                                </a>
                            </Button>
                        )}
                        
                        {onAddToList && (
                            <Button 
                                variant={isAdded ? "ghost" : "default"}
                                size="sm" 
                                onClick={() => onAddToList(product)}
                                disabled={isAdded}
                                className={isAdded 
                                    ? "flex-1 h-7 text-[10px] font-bold text-emerald-500" 
                                    : "flex-1 bg-blue-600 hover:bg-blue-500 h-7 text-[10px] font-bold rounded-lg shadow-sm shadow-blue-500/20 px-2"
                                }
                            >
                                {isAdded ? (
                                    <>Aggiunto</>
                                ) : (
                                    <>
                                        <ShoppingCart className="w-3 h-3 mr-1" />
                                        Aggiungi
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
