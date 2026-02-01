// hooks/useN8NChat.tsx
import { useState, useEffect } from 'react';

export const useN8NChat = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatId, setChatId] = useState('');
  const [securityToken, setSecurityToken] = useState<string | null>(null);

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
    const newUserMsg = { role: 'user', content: userMessage, id: Date.now().toString() };
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

      const newAiMsg = { role: 'assistant', content: aiText, id: (Date.now() + 1).toString() };
      setMessages((prev) => [...prev, newAiMsg]);

    } catch (error: any) {
      console.error('Chat Error:', error);
      setMessages((prev) => [...prev, { role: 'assistant', content: `⚠️ ${error.message || "Si è verificato un errore."}`, id: Date.now().toString() }]);
    } finally {
      setIsLoading(false);
    }
  };

  return { messages, sendMessage, isLoading };
};