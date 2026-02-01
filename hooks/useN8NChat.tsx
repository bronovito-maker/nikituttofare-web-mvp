// hooks/useN8NChat.tsx
import { useState, useEffect } from 'react';
import { Message } from '@/lib/types';

const CHAT_SESSION_KEY = 'chat_session_id';

export const useN8NChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatId, setChatId] = useState('');
  const [securityToken, setSecurityToken] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    // 1. Session Persistence
    let currentChatId = localStorage.getItem(CHAT_SESSION_KEY);

    if (!currentChatId) {
      const array = new Uint32Array(1);
      globalThis.crypto.getRandomValues(array);
      currentChatId = array[0].toString(36);
      localStorage.setItem(CHAT_SESSION_KEY, currentChatId);
    }

    setChatId(currentChatId);

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

  const sendMessage = async (userMessage: string, userId?: string) => {
    // 1. Mostra subito il messaggio dell'utente
    const newUserMsg: Message = { role: 'user', content: userMessage, id: Date.now().toString() };
    setMessages((prev) => [...prev, newUserMsg]);
    setSuggestions([]); // Clear previous suggestions
    setIsLoading(true);

    try {
      if (!securityToken) {
        console.warn("Security token missing, retrying fetch...");
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
          userId: userId // Passiamo l'ID utente se presente
        }),
      });

      if (!response.ok) {
        if (response.status === 401) throw new Error("Sessione scaduta, ricarica la pagina.");
        throw new Error("Errore di comunicazione");
      }

      const data = await response.json();

      // 3. Processa la risposta di n8n ed estrai suggerimenti
      let aiText = data.text || "Risposta ricevuta";
      const suggestionsRegex = /<<([^>>]+)>>/g; // Estrae "Suggerimento" da "<<Suggerimento>>"

      const foundSuggestions: string[] = [];
      let match;

      // Estrai tutti i match
      while ((match = suggestionsRegex.exec(aiText)) !== null) {
        if (match[1] && match[1].trim()) {
          foundSuggestions.push(match[1].trim());
        }
      }

      // Rimuovi i tag dal testo visibile
      aiText = aiText.replace(suggestionsRegex, '').trim();

      // Aggiorna lo stato dei suggerimenti (se trovati, altrimenti svuota o mantieni logicamente - qui sovrascriviamo)
      if (foundSuggestions.length > 0) {
        setSuggestions(foundSuggestions);
      } else {
        setSuggestions([]); // Reset se non ci sono nuovi suggerimenti (o logica diversa se vogliamo mantenerli?)
      }

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

  return { messages, sendMessage, isLoading, setMessages, suggestions };
};