'use client';

import dynamic from 'next/dynamic';
import { Suspense, useMemo } from 'react';

// Lazy load dei messaggi per performance
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

interface ChatInterfaceProps {
  messages: any[];
  isLoading: boolean;
}

export function ChatInterface({ messages, isLoading }: ChatInterfaceProps) {
  // PULIZIA MESSAGGI (FRONTEND):
  // Rimuove il tag tecnico [UTENTE HA CARICATO...] dal testo visibile all'utente.
  // Usiamo useMemo per non ricalcolare ad ogni render se i messaggi non cambiano.
  const cleanMessages = useMemo(() => {
    return messages.map((msg) => {
      // Controlliamo solo i messaggi utente che sono stringhe
      if (msg.role === 'user' && typeof msg.content === 'string') {
        const cleanedContent = msg.content
          // Regex che trova e rimuove tutto ciò che è tra [UTENTE ... ]
          .replace(/\[UTENTE HA CARICATO UNA FOTO:.*?\]/g, '')
          .trim();

        // Ritorniamo una copia del messaggio con il contenuto pulito
        return {
          ...msg,
          content: cleanedContent
        };
      }
      // I messaggi dell'AI o di sistema passano invariati
      return msg;
    });
  }, [messages]);

  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-2">
          <LoadingDots size="lg" />
        </div>
      </div>
    }>
      {/* Passiamo i messaggi puliti invece di quelli grezzi */}
      <ChatMessages messages={cleanMessages} isLoading={isLoading} />
    </Suspense>
  );
}

// Helper per lo spinner
function LoadingDots({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
    const s = size === 'sm' ? 'w-1.5 h-1.5' : size === 'md' ? 'w-2 h-2' : 'w-3 h-3';
    return (
      <div className="flex space-x-1 items-center justify-center">
        <div className={`${s} bg-current rounded-full animate-bounce [animation-delay:-0.3s]`}></div>
        <div className={`${s} bg-current rounded-full animate-bounce [animation-delay:-0.15s]`}></div>
        <div className={`${s} bg-current rounded-full animate-bounce`}></div>
      </div>
    );
}