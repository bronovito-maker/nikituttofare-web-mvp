// File: components/chat/ChatInterface.tsx

'use client';

import { useEffect, useRef, ChangeEvent } from 'react';
import { Message, Step, ChatFormState } from '@/lib/types';
import ChatBubble from '../ChatBubble';
import MessageInput from './MessageInput';
import { ChatIntroScreen } from './ChatIntroScreen';
import { SummaryBubble } from './SummaryBubble';
import { FileUploadPreview } from './FileUploadPreview';
import Typing from '../Typing';

interface ChatInterfaceProps {
  messages: Message[];
  input: string;
  handleInputChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSend: (messageOverride?: string) => void;
  isLoading: boolean;
  step: Step;
  formState: ChatFormState;
  startChat: (service: string) => void;
  resetChat: () => void;
  isScriptedFlowActive: boolean;
  // File props
  fileToUpload?: File | null;
  setFileToUpload?: (file: File | null) => void;
  removeFile?: () => void;
  previewUrl?: string | null;
}

export default function ChatInterface({
  messages,
  input,
  handleInputChange,
  handleSend,
  isLoading,
  step,
  formState,
  startChat,
  resetChat,
  isScriptedFlowActive,
  fileToUpload,
  setFileToUpload,
  removeFile,
  previewUrl,
}: ChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- MODIFICA CHIAVE QUI ---
  // Mostra il riepilogo quando il preventivo è presentato e durante la raccolta dati finale.
  const showSummary = (step === 'confirm' || step === 'done') && formState && Object.values(formState).some(val => val !== null && val !== undefined && Object.keys(val).length > 0);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {messages.length === 1 && <ChatIntroScreen onSuggestionClick={startChat} />}
        {messages.map((msg, index) => (
          <ChatBubble key={index} role={msg.role}>
            {msg.isLoading ? <Typing /> : msg.content}
          </ChatBubble>
        ))}
        {showSummary && <SummaryBubble form={formState} />}
        <div ref={messagesEndRef} />
      </div>
      {previewUrl && <FileUploadPreview previewUrl={previewUrl} onRemove={removeFile!} />}
      <MessageInput
        input={input}
        handleInputChange={handleInputChange}
        handleSend={handleSend}
        isLoading={isLoading}
        step={step}
        setFileToUpload={setFileToUpload!}
      />
    </div>
  );
}