'use client';

import { useState, useEffect } from 'react';
import { Message } from '@/lib/types';

export const useChat = ({ tenantId }: { tenantId: string | null }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Messaggio di benvenuto iniziale
    setMessages([{ 
      id: '0', 
      role: 'assistant', 
      content: 'Ciao! Sono il tuo assistente virtuale. Come posso aiutarti oggi?' 
    }]);
  }, []);

  const sendMessage = async (prompt: string) => {
    if (!prompt.trim() || isLoading) return;
    if (!tenantId) {
      console.error("Tenant ID non fornito, impossibile inviare il messaggio.");
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: 'Errore di configurazione: ID assistente non trovato.' }]);
      return;
    }

    const newUserMessage: Message = { id: Date.now().toString(), role: 'user', content: prompt };
    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/assist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          tenant_id: tenantId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      const newAssistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
      };

      setMessages(prevMessages => [...prevMessages, newAssistantMessage]);

    } catch (error) {
      console.error('Errore durante la chiamata API:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Spiacente, si è verificato un errore. Riprova più tardi.',
      };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    isLoading,
    sendMessage,
  };
};