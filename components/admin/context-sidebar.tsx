'use client';

import {
    MapPin,
    Phone,
    CreditCard,
    User,
    Zap,
    MoreHorizontal,
    FileCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Database } from '@/lib/database.types';
import { toast } from 'sonner';

type Ticket = Database['public']['Tables']['tickets']['Row'];

interface ContextSidebarProps {
    readonly ticket: Ticket | null;
    readonly onOpenQuoteModal?: () => void;
}

export function ContextSidebar({ ticket, onOpenQuoteModal }: ContextSidebarProps) {
    if (!ticket) {
        return (
            <div className="w-80 border-l border-border bg-background p-6 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center mb-4">
                    <Zap className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="text-foreground font-medium mb-2">Nessun ticket selezionato</h3>
                <p className="text-sm text-muted-foreground">Seleziona una conversazione per vedere i dettagli e le azioni rapide.</p>
            </div>
        );
    }

    const handleMockAction = (action: string) => {
        toast.info(`Funzionalità "${action}" in arrivo!`, {
            description: "Questa azione sarà collegata a breve."
        });
    };

    return (
        <div className="w-80 border-l border-border bg-background flex flex-col h-full overflow-y-auto scrollbar-thin scrollbar-thumb-border">

            {/* Entity Extraction Card */}
            <div className="p-6 border-b border-border">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Zap className="w-3 h-3 text-amber-500" />
                    Dati Estratti (AI)
                </h3>

                <div className="space-y-4">
                    {/* Customer */}
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-card flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground mb-0.5">Cliente</p>
                            <p className="text-sm text-foreground font-medium">{ticket.customer_name || 'Non rilevato'}</p>
                        </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-card flex items-center justify-center flex-shrink-0">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground mb-0.5">Posizione</p>
                            <p className="text-sm text-foreground font-medium leading-tight">
                                {ticket.city || 'Città non rilevata'}
                                {ticket.address && <span className="block text-muted-foreground text-xs mt-0.5">{ticket.address}</span>}
                            </p>
                        </div>
                    </div>

                    {/* Phone */}
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-card flex items-center justify-center flex-shrink-0">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground mb-0.5">Contatto</p>
                            <p className="text-sm text-foreground font-medium">
                                {ticket.contact_phone ? `+39 ${ticket.contact_phone}` : 'Non rilevato'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Snapshot Preview (Mock) */}
            <div className="p-6 border-b border-border">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">
                    Media Rilevati
                </h3>
                {ticket.photo_url ? (
                    <div className="relative aspect-video rounded-lg overflow-hidden border border-border group cursor-pointer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={ticket.photo_url}
                            alt="Problem Snapshot"
                            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <span className="text-xs text-white font-medium">Ingrandisci</span>
                        </div>
                    </div>
                ) : (
                    <div className="h-24 bg-card rounded-lg border border-border border-dashed flex items-center justify-center text-xs text-muted-foreground">
                        Nessuna foto
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="p-6 space-y-3">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    Azioni Rapide
                </h3>

                <Button
                    onClick={() => handleMockAction('Link Pagamento')}
                    variant="outline"
                    className="w-full justify-start border-border hover:bg-secondary hover:text-foreground text-muted-foreground h-10"
                >
                    <CreditCard className="w-4 h-4 mr-2 text-purple-500" />
                    Link Pagamento
                </Button>

                <Button
                    onClick={onOpenQuoteModal}
                    className="w-full justify-start bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 hover:text-blue-500 h-10 border"
                >
                    <FileCheck className="w-4 h-4 mr-2" />
                    Genera Preventivo
                </Button>

                <Button variant="outline" className="w-full justify-start border-border hover:bg-secondary hover:text-foreground text-muted-foreground h-10">
                    <MoreHorizontal className="w-4 h-4 mr-2" />
                    Altro
                </Button>
            </div>

            <div className="mt-auto p-6 bg-card/50 border-t border-border">
                <h4 className="text-xs font-bold text-muted-foreground mb-1">Status Sistema</h4>
                <div className="flex items-center gap-2 text-[10px] text-emerald-500 font-mono">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    {' '}OPERATIVO • LATENZA 24ms
                </div>
            </div>
        </div>
    );
}
