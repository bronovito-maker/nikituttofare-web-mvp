// File: components/chat/ChatInterface.tsx

'use client';

import { useEffect, useRef, ChangeEvent, ReactNode } from 'react';
import { Message, Step, ChatFormState } from '@/lib/types';
import ChatBubble from '../ChatBubble';
import Typing from '../Typing';
import MessageInput from './MessageInput';
import { ChatIntroScreen } from './ChatIntroScreen';
import { SummaryBubble } from './SummaryBubble';

interface ChatInterfaceProps {
  messages: Message[];
  input: string;
  handleInputChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSend: () => void;
  isLoading: boolean;
  step: Step;
  formSummary: any;
  startChat: (service: string) => void;
  finalTicketId: string | null;
  resetChat: () => void;
  fileToUpload: File | null;
  setFileToUpload: (file: File | null) => void;
  removeFile: () => void;
  previewUrl: string | null;
}

export default function ChatInterface({
  messages,
  input,
  handleInputChange,
  handleSend,
  isLoading,
  step,
  formSummary,
  startChat,
  finalTicketId,
  resetChat,
  fileToUpload,
  setFileToUpload,
  removeFile,
  previewUrl,
}: ChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {messages.length === 1 && <ChatIntroScreen onSuggestionClick={startChat} />}
        {messages.map((msg, index) => (
          <ChatBubble key={index} role={msg.role}>
            {msg.isLoading ? <Typing /> : msg.content}
          </ChatBubble>
        ))}
        {formSummary && step === 'confirm' && <SummaryBubble form={formSummary.formState} aiResult={formSummary.aiResult} />}
        <div ref={messagesEndRef} />
      </div>
      <MessageInput
        input={input}
        handleInputChange={handleInputChange}
        handleSend={handleSend}
        fileToUpload={fileToUpload}
        setFileToUpload={setFileToUpload}
        removeFile={removeFile}
        previewUrl={previewUrl}
        step={step}
      />
    </div>
  );
}