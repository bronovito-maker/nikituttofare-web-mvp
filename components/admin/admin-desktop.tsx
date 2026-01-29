'use client';

import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

import { TicketFeed } from '@/components/admin/ticket-feed';
import { CognitiveChat } from '@/components/admin/cognitive-chat';
import { ContextSidebar } from '@/components/admin/context-sidebar';
import { Database } from '@/lib/database.types';
import { QuoteGeneratorModal } from '@/components/admin/quote-generator-modal';
import { toggleAutopilot } from '@/app/actions/admin-chat-actions';

type Ticket = Database['public']['Tables']['tickets']['Row'];

interface AdminDesktopProps {
    readonly initialTickets: Ticket[];
}

export function AdminDesktop({ initialTickets }: AdminDesktopProps) {
    const [selectedTicketId, setSelectedTicketId] = useState<string | undefined>(
        initialTickets.length > 0 ? initialTickets[0].id : undefined
    );
    // Lifted Autopilot State
    const [autoPilot, setAutoPilot] = useState(true);

    const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);

    const selectedTicket = initialTickets.find(t => t.id === selectedTicketId) || null;

    // Sync Autopilot state when ticket changes
    useEffect(() => {
        if (selectedTicket) {
            setAutoPilot(!selectedTicket.ai_paused);
        }
    }, [selectedTicketId, selectedTicket]); // Depend on ID change mostly

    const handleToggleAutopilot = async (checked: boolean) => {
        if (!selectedTicket) return;
        setAutoPilot(checked); // Optimistic UI
        try {
            await toggleAutopilot(selectedTicket.id, !checked); // Paused is inverse of Enabled
            toast.success(checked ? "Autopilot Attivato" : "Controllo Manuale Attivato");
        } catch {
            setAutoPilot(!checked); // Revert
            toast.error("Errore nel cambio stato Autopilot");
        }
    };

    return (
        <div className="flex h-screen w-full overflow-hidden bg-[#121212] font-sans selection:bg-blue-500/30">


            {/* Pane B: Master List (Ticket Feed) */}
            <aside className={`w-full md:w-80 flex-none border-r border-[#333] z-40 ${selectedTicketId ? 'hidden md:block' : 'block'}`}>
                <TicketFeed
                    tickets={initialTickets}
                    selectedTicketId={selectedTicketId}
                    onSelectTicket={(id) => {
                        setSelectedTicketId(id);
                        // Optional: close modal when switching tickets?
                        setIsQuoteModalOpen(false);
                    }}
                />
            </aside>

            {/* Pane C: Workspace (Chat + Context) */}
            <main className={`flex-1 flex flex-col min-w-0 bg-[#121212] ${selectedTicketId ? 'flex fixed inset-0 z-[100]' : 'hidden md:flex relative'}`}>
                {/* Mobile Sticky Header (2-Rows) */}
                {selectedTicketId && (
                    <div className="md:hidden flex-none bg-[#121212] border-b border-[#333] flex flex-col px-4 py-3 gap-3 sticky top-0 z-50 shadow-lg">
                        {/* Row 1: Navigation & Actions */}
                        <div className="flex items-center justify-between">
                            <button
                                onClick={() => setSelectedTicketId(undefined)}
                                className="p-2 -ml-2 text-slate-300 hover:text-white bg-[#1a1a1a]/50 rounded-full"
                            >
                                <span className="flex items-center gap-2 font-medium text-sm">
                                    ← Indietro
                                </span>
                            </button>

                            <div className="flex items-center gap-2 bg-[#1a1a1a] px-3 py-1.5 rounded-full border border-[#333]">
                                <span className={`text-[10px] font-bold ${autoPilot ? 'text-emerald-400' : 'text-slate-500'}`}>
                                    {autoPilot ? 'AI ON' : 'AI OFF'}
                                </span>
                                <Switch
                                    checked={autoPilot}
                                    onCheckedChange={handleToggleAutopilot}
                                    className="data-[state=checked]:bg-emerald-600 scale-75 origin-right"
                                />
                            </div>
                        </div>

                        {/* Row 2: Context Info */}
                        <div className="flex items-center gap-3">
                            <h2 className="text-lg font-bold text-white truncate flex-1 leading-none">
                                {selectedTicket?.description || 'Dettaglio Ticket'}
                            </h2>
                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-[#333] text-slate-400 font-mono flex-none bg-[#1a1a1a]">
                                #{selectedTicket?.chat_session_id?.slice(0, 6) || selectedTicket?.id.slice(0, 4)}
                            </Badge>
                        </div>
                    </div>
                )}

                {/* Chat Area */}
                <div className="flex-1 flex flex-col overflow-hidden relative">
                    <CognitiveChat
                        ticket={selectedTicket}
                        isMobileView={!!selectedTicketId}
                        externalAutoPilot={autoPilot}
                        onToggleAutoPilot={handleToggleAutopilot}
                    />
                </div>

                {/* Right Sidebar: Context Panel (Collapsible if needed, fixed for now) */}
                <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-80 border-l border-[#333] bg-[#0a0a0a] z-30">
                    <ContextSidebar
                        ticket={selectedTicket}
                        onOpenQuoteModal={() => setIsQuoteModalOpen(true)}
                    />
                </div>
            </main>

            {/* Modals - Hoisted for global access within Admin context */}
            {selectedTicket && (
                <QuoteGeneratorModal
                    isOpen={isQuoteModalOpen}
                    onClose={() => setIsQuoteModalOpen(false)}
                    ticket={selectedTicket}
                />
            )}
        </div>
    );
}
