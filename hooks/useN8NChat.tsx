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
  }, []);

  const sendMessage = async (userMessage: string) => {
    // 1. Mostra subito il messaggio dell'utente
    const newUserMsg = { role: 'user', content: userMessage, id: Date.now().toString() };
    setMessages((prev) => [...prev, newUserMsg]);
    setIsLoading(true);

    try {
      // 2. Chiama il nostro PONTE (creato al passo 1)
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
      // Nota: n8n deve rispondere con un JSON che contiene "text" o "output"
      const aiText = data.text || data.output || "Risposta ricevuta";

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