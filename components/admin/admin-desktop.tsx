'use client';

import { useState } from 'react';
import { SidebarNav } from '@/components/admin/sidebar-nav';
import { TicketFeed } from '@/components/admin/ticket-feed';
import { CognitiveChat } from '@/components/admin/cognitive-chat';
import { ContextSidebar } from '@/components/admin/context-sidebar';
import { Database } from '@/lib/database.types';
import { QuoteGeneratorModal } from '@/components/admin/quote-generator-modal';

type Ticket = Database['public']['Tables']['tickets']['Row'];

interface AdminDesktopProps {
    readonly initialTickets: Ticket[];
}

export function AdminDesktop({ initialTickets }: AdminDesktopProps) {
    const [selectedTicketId, setSelectedTicketId] = useState<string | undefined>(
        initialTickets.length > 0 ? initialTickets[0].id : undefined
    );

    const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);

    const selectedTicket = initialTickets.find(t => t.id === selectedTicketId) || null;

    return (
        <div className="flex h-screen w-full overflow-hidden bg-[#121212] font-sans selection:bg-blue-500/30">
            {/* Pane A: Sidebar Navigation (Fixed) */}
            <aside className="w-16 flex-none bg-[#0a0a0a] border-r border-[#333] z-50">
                <SidebarNav />
            </aside>

            {/* Pane B: Master List (Ticket Feed) */}
            <aside className="w-80 flex-none border-r border-[#333] z-40">
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
            <main className="flex-1 flex min-w-0 bg-[#121212]">
                {/* Chat Area */}
                <CognitiveChat ticket={selectedTicket} />

                {/* Right Sidebar: Context Panel (Collapsible if needed, fixed for now) */}
                <ContextSidebar
                    ticket={selectedTicket}
                    onOpenQuoteModal={() => setIsQuoteModalOpen(true)}
                />
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
