// hooks/useN8NChat.tsx
import { useState, useEffect } from 'react';

import { Message } from '@/lib/types';

export const useN8NChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatId, setChatId] = useState('');
  const [securityToken, setSecurityToken] = useState<string | null>(null);

  useEffect(() => {
    const array = new Uint32Array(1);
    globalThis.crypto.getRandomValues(array);
    setChatId(array[0].toString(36));

    // Welcome message removed to show Zero State
    // setMessages([]);

    // Fetch Security Token
    fetch('/api/chat/token', { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        if (data.token) {
          setSecurityToken(data.token);
        }
      })
      .catch(err => console.error("Failed to init chat security:", err));
  }, []);

  const sendMessage = async (userMessage: string) => {
    // 1. Mostra subito il messaggio dell'utente
    const newUserMsg: Message = { role: 'user', content: userMessage, id: Date.now().toString() };
    setMessages((prev) => [...prev, newUserMsg]);
    setIsLoading(true);

    try {
      if (!securityToken) {
        // Silently try to refresh or just wait? For now throw error.
        console.warn("Security token missing, retrying fetch...");
        // Simple retry logic could go here, but for MVP just fail safely
        throw new Error("Connessione sicura in fase di stabilimento... Riprova tra un secondo.");
      }

      // 2. Chiama il nostro Proxy
      const response = await fetch('/api/n8n-proxy', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-chat-token": securityToken
        },
        body: JSON.stringify({
          message: userMessage,
          chatId: chatId,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) throw new Error("Sessione scaduta, ricarica la pagina.");
        throw new Error("Errore di comunicazione");
      }

      const data = await response.json();

      // 3. Mostra la risposta di n8n
      const aiText = data.text || "Risposta ricevuta";

      const newAiMsg: Message = { role: 'assistant', content: aiText, id: (Date.now() + 1).toString() };
      setMessages((prev) => [...prev, newAiMsg]);

    } catch (error: any) {
      console.error('Chat Error:', error);
      const errorMsg: Message = { role: 'assistant', content: `⚠️ ${error.message || "Si è verificato un errore."}`, id: Date.now().toString() };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return { messages, sendMessage, isLoading };
};