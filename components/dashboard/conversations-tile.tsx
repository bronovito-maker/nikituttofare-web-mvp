'use client';

import Link from 'next/link';
import { MessageSquare } from 'lucide-react';

interface ConversationsTileProps {
  totalConversations: number;
  activeConversations: number;
}

export function ConversationsTile({ totalConversations, activeConversations }: ConversationsTileProps) {
  return (
    <Link href="/dashboard/conversations" className="block h-full w-full group">
      <div className="h-full min-h-[180px] w-full rounded-[2rem] bg-gradient-to-br from-card to-background border border-border p-6 relative overflow-hidden transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(139,92,246,0.15)] group-hover:border-purple-500/30">

        {/* Glow Effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-purple-600/20 rounded-full blur-3xl group-hover:bg-purple-500/30 transition-all duration-500" />

        <div className="relative z-10 flex flex-col h-full justify-between">
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform duration-300">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>

            {activeConversations > 0 && (
              <div className="px-2.5 py-1 bg-orange-500 text-white text-xs font-bold rounded-full shadow-lg shadow-orange-500/30 animate-pulse">
                {activeConversations} attive
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-bold text-foreground mb-1">Le Mie Chat</h3>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {totalConversations}
            </p>
            <p className="text-xs text-muted-foreground font-medium">conversazioni totali</p>
          </div>

          <div className="w-full h-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </Link>
  );
}
