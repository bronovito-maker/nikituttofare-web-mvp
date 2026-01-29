'use client';

import {
    Bot,
    User as UserIcon
} from 'lucide-react';
import { Database } from '@/lib/database.types';

type Message = Database['public']['Tables']['messages']['Row'];
type Ticket = Database['public']['Tables']['tickets']['Row'];

interface ChatMessageProps {
    readonly message: Message;
    readonly ticket: Ticket;
}

export function ChatMessage({ message, ticket }: ChatMessageProps) {
    const isUser = message.role === 'user';
    const senderName = isUser ? (ticket.customer_name || 'Utente') : 'Niki AI';
    const timeString = new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <div className={`flex ${isUser ? 'justify-start' : 'justify-end'} w-full`}>
            <div className={`flex gap-3 max-w-[85%] md:max-w-[70%] ${isUser ? '' : 'flex-row-reverse'}`}>
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isUser ? 'bg-slate-800' : 'bg-blue-600/20 border border-blue-500/30'}`}>
                    {isUser ? <UserIcon className="w-4 h-4 text-slate-400" /> : <Bot className="w-4 h-4 text-blue-400" />}
                </div>

                {/* Content */}
                <div className="space-y-1 min-w-0">
                    <div className={`flex items-baseline gap-2 ${isUser ? '' : 'justify-end'}`}>
                        <span className="text-sm font-bold text-slate-300 truncate">{senderName}</span>
                        <span className="text-xs text-slate-500 whitespace-nowrap">{timeString}</span>
                    </div>
                    <div className={`p-3 rounded-2xl border text-sm leading-relaxed overflow-x-auto break-words ${isUser
                        ? 'bg-[#1e1e1e] border-[#333] rounded-tl-none text-slate-300'
                        : 'bg-blue-950/30 border-blue-900/50 rounded-tr-none text-blue-100'
                        }`}>
                        {message.content}
                    </div>
                </div>
            </div>
        </div>
    );
}
