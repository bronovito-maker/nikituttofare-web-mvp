'use client';

import { useChat } from '@/hooks/useChat';
import { ChatIntroScreen } from './ChatIntroScreen';
import MessageInput from './MessageInput';
import Typing from '../Typing';
import ChatBubble from '../ChatBubble';
import { useRef, useEffect } from 'react';

export default function ChatInterface({ tenantId }: { tenantId: string | null }) {
  const { messages, isLoading, sendMessage } = useChat({ tenantId });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = (message: string) => {
    sendMessage(message);
  };

  if (messages.length <= 1) {
    // La prop corretta per ChatIntroScreen è onSuggestionClick
    return <ChatIntroScreen onSuggestionClick={handleSendMessage} />;
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.slice(1).map((msg) => (
          <ChatBubble key={msg.id} role={msg.role}>
            {msg.content}
          </ChatBubble>
        ))}
        {isLoading && <Typing />}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t bg-white">
          {/* La prop corretta per MessageInput è handleSend */}
          <MessageInput
            input=""
            handleInputChange={() => {}}
            handleSend={() => handleSendMessage("")}
            isLoading={isLoading}
            step={'intro'}
            setFileToUpload={() => {}}
        />
      </div>
    </div>
  );
}