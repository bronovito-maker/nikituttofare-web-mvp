'use client';

import dynamic from 'next/dynamic';
import { Suspense, useMemo } from 'react';
import { type Message } from '../../lib/types';
import { LoadingSpinner } from '../ui/loading-dots';

// Lazy load dei messaggi per performance
interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
}

const ChatMessages = dynamic<ChatMessagesProps>(() => import('./chat-messages').then(mod => mod.default), {
  loading: () => (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center space-y-2">
        <LoadingSpinner />
        <p className="text-sm text-slate-500">Caricamento chat...</p>
      </div>
    </div>
  ),
});

interface ChatInterfaceProps {
  readonly messages: Message[];
  readonly isLoading: boolean;
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
          .replaceAll(/\[UTENTE HA CARICATO UNA FOTO:.*?\]/g, '')
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
          <LoadingSpinner size="lg" />
        </div>
      </div>
    }>
      {/* Passiamo i messaggi puliti invece di quelli grezzi */}
  <ChatMessages messages={cleanMessages} isLoading={isLoading} />
    </Suspense>
  );
}