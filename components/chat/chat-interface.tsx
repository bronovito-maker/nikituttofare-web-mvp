'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Lazy load the heavy chat components
const ChatMessages = dynamic(() => import('./chat-messages'), {
  loading: () => (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center space-y-2">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm text-slate-500">Caricamento chat...</p>
      </div>
    </div>
  ),
});

// ChatInput component removed - input logic is now in the main chat page

export function ChatInterface({ messages, isLoading }: { messages: any[], isLoading: boolean }) {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-slate-500">Inizializzazione chat...</p>
        </div>
      </div>
    }>
      <ChatMessages messages={messages} isLoading={isLoading} />
    </Suspense>
  );
}