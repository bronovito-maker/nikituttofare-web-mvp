'use client';

import { ChangeEvent, CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import { useChat, CustomMessage } from '@/hooks/useChat';
import { ChatIntroScreen } from './ChatIntroScreen';
import MessageInput from './MessageInput';
import Typing from '../Typing';
import ChatBubble from '../ChatBubble';
import { PlumbingForm } from './forms/PlumbingForm';
import { ElectricForm } from './forms/ElectricForm';
import { LocksmithForm } from './forms/LocksmithForm';
import { ClimateForm } from './forms/ClimateForm';
import { GenericForm } from './forms/GenericForm';
import { AIResponseType, FormType } from '@/lib/ai-structures';
import { z } from 'zod';

const isDisplayableMessage = (message: CustomMessage): boolean =>
  message.role === 'user' || message.role === 'assistant';

export default function ChatInterface({
  assistantConfig,
  widgetColor,
}: {
  assistantConfig?: any;
  widgetColor?: string | null;
}) {
  const {
    messages,
    isLoading,
    sendMessage,
    error,
  } = useChat();

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = (override?: string) => {
    const messageToSend = override ?? input;
    if (!messageToSend.trim()) return;
    sendMessage(messageToSend.trim());
    setInput('');
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInput(event.target.value);
  };

  const handleFormSubmit = async (formData: Record<string, any>) => {
    const { photo, ...textData } = formData;
    
    const formattedText = Object.entries(textData)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
      
    const message = `Ho compilato il modulo con i seguenti dati:\n${formattedText}`;
    
    await sendMessage(message, photo);
  };

  const renderForm = (formContent: FormType) => {
    switch (formContent.formName) {
      case 'plumbing-issue':
        return <PlumbingForm formDefinition={formContent} onSubmit={handleFormSubmit} />;
      case 'electric-issue':
        return <ElectricForm onSubmit={handleFormSubmit} />;
      case 'locksmith-issue':
        return <LocksmithForm onSubmit={handleFormSubmit} />;
      case 'climate-issue':
        return <ClimateForm onSubmit={handleFormSubmit} />;
      case 'generic-issue':
        return <GenericForm onSubmit={handleFormSubmit} />;
      default:
        return null;
    }
  }

  if (messages.length === 0) {
    return (
      <ChatIntroScreen
        onSuggestionClick={handleSendMessage}
        businessName={assistantConfig?.name}
      />
    );
  }

  return (
    <div className="relative flex h-full min-h-full flex-col bg-gray-50">
      <div className="flex-1 overflow-y-auto px-4 pb-24 pt-4 space-y-4">
        {messages
          .filter(isDisplayableMessage)
          .map((msg, index) => (
            <div key={msg.id ?? index}>
              {msg.role === 'user' && typeof msg.content === 'string' && (
                <ChatBubble role="user" content={msg.content} />
              )}
              {msg.role === 'assistant' && (
                <>
                  {typeof msg.content === 'string' && (
                    <ChatBubble role="assistant" content={msg.content} />
                  )}
                  {typeof msg.content === 'object' && msg.content.type === 'text' && (
                     <ChatBubble role="assistant" content={msg.content.content as string} />
                  )}
                  {typeof msg.content === 'object' && msg.content.type === 'form' && (
                    renderForm(msg.content.content as FormType)
                  )}
                </>
              )}
            </div>
          ))}
        {isLoading && <Typing />}
        <div ref={messagesEndRef} className="h-0" />
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white">
        <MessageInput
          input={input}
          handleInputChange={handleInputChange}
          handleSend={handleSendMessage}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
