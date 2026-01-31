// hooks/useN8NChat.tsx
import { useState, useEffect } from 'react';

export const useN8NChat = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // Un ID a caso per far funzionare la memoria di n8n
  const [chatId, setChatId] = useState('');

  useEffect(() => {
    const array = new Uint32Array(1);
    globalThis.crypto.getRandomValues(array);
    setChatId(array[0].toString(36));

    // Welcome message from Niki
    const welcomeMsg = {
      role: 'assistant',
      content: 'Ciao! 👋 Sono Niki, il tuo assistente personale. Sono qui per aiutarti con qualsiasi problema domestico: idraulica, elettricità, serrature, climatizzazione... **Raccontami cosa sta succedendo** e troverò il tecnico giusto per te!',
      id: 'welcome',
    };
    setMessages([welcomeMsg]);
  }, []);

  const sendMessage = async (userMessage: string) => {
    // 1. Mostra subito il messaggio dell'utente
    const newUserMsg = { role: 'user', content: userMessage, id: Date.now().toString() };
    setMessages((prev) => [...prev, newUserMsg]);
    setIsLoading(true);

    try {
      // 2. Chiama il nostro Proxy
      const response = await fetch('/api/n8n-proxy', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          chatId: chatId,
        }),
      });

      const data = await response.json();

      // 3. Mostra la risposta di n8n
      // 3. Mostra la risposta di n8n
      const aiText = data.text || "Risposta ricevuta";

      const newAiMsg = { role: 'assistant', content: aiText, id: (Date.now() + 1).toString() };
      setMessages((prev) => [...prev, newAiMsg]);

    } catch (error) {
      console.error('Chat Error:', error);
      setMessages((prev) => [...prev, { role: 'assistant', content: "Si è verificato un errore.", id: Date.now().toString() }]);
    } finally {
      setIsLoading(false);
    }
  };

  return { messages, sendMessage, isLoading };
};