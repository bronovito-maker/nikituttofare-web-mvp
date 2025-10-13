'use client';
'use client';

import { useChat } from '@/hooks/useChat';
import { ChatIntroScreen } from './ChatIntroScreen';
import MessageInput from './MessageInput';
import Typing from '../Typing';
import ChatBubble from '../ChatBubble';
import { ChangeEvent, useEffect, useRef, useState } from 'react';

type ChatInterfaceProps = {
  tenantId: string | null;
};

export default function ChatInterface({ tenantId }: ChatInterfaceProps) {
  const { messages, isLoading, sendMessage, assistantConfig } = useChat({ tenantId });
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

  if (messages.length <= 1) {
    return <ChatIntroScreen onSuggestionClick={handleSendMessage} />;
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
        step="chat"
        setFileToUpload={() => {}}
      />
    </div>
  );
}
