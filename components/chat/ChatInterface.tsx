'use client';

import { useChat } from '@/hooks/useChat';
import { ChatIntroScreen } from './ChatIntroScreen';
import MessageInput from './MessageInput';
import Typing from '../Typing';
import ChatBubble from '../ChatBubble';
import { ChangeEvent, useEffect, useRef, useState } from 'react';
import type { AssistantConfig } from '@/lib/types';

type ChatInterfaceProps = {
  assistantConfig?: AssistantConfig | null;
};

export default function ChatInterface({ assistantConfig = null }: ChatInterfaceProps) {
  const { messages = [], isLoading, sendMessage } = useChat();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = (override?: string) => {
    const messageToSend = override ?? input;
    if (!messageToSend.trim()) {
      return;
    }
    sendMessage(messageToSend.trim());
    setInput('');
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInput(event.target.value);
  };

  if (!Array.isArray(messages) || messages.length <= 1) {
    return (
      <ChatIntroScreen
        onSuggestionClick={handleSendMessage}
        businessName={assistantConfig?.name}
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.slice(1).map((msg) => (
          <ChatBubble
            key={msg.id}
            role={msg.role}
            content={msg.content}
            menuUrl={assistantConfig?.menu_url ? String(assistantConfig.menu_url) : undefined}
          />
        ))}
        {isLoading && <Typing />}
        <div ref={messagesEndRef} />
      </div>
      <MessageInput
        input={input}
        handleInputChange={handleInputChange}
        handleSend={handleSendMessage}
        isLoading={isLoading}
      />
    </div>
  );
}
