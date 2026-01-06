'use client';

import { ChangeEvent, CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import { useChat, CustomMessage } from '@/hooks/useChat';
import { ChatIntroScreen } from './ChatIntroScreen';
import { CategoryGuide } from './CategoryGuide';
import MessageInput from './MessageInput';
import Typing from '../Typing';
import ChatBubble from '../ChatBubble';
import { PlumbingForm } from './forms/PlumbingForm';
import { ElectricForm } from './forms/ElectricForm';
import { LocksmithForm } from './forms/LocksmithForm';
import { ClimateForm } from './forms/ClimateForm';
import { GenericForm } from './forms/GenericForm';
import { AIResponseType, FormType } from '@/lib/ai-structures';
import { toast } from 'sonner';
import { z } from 'zod';

const isDisplayableMessage = (message: CustomMessage): boolean =>
  message.role === 'user' || message.role === 'assistant';

const categoryNames = {
  plumbing: 'Idraulico',
  electric: 'Elettricista',
  locksmith: 'Fabbro',
  climate: 'Clima',
};

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
  const [selectedCategory, setSelectedCategory] = useState<'plumbing' | 'electric' | 'locksmith' | 'climate' | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleCategorySelect = (category: 'plumbing' | 'electric' | 'locksmith' | 'climate') => {
    setSelectedCategory(category);
  };

  const handleStartChat = async (initialMessage: string) => {
    setSelectedCategory(null);
    await sendMessage(initialMessage);
  };

  const handleSkipGuide = () => {
    setSelectedCategory(null);
  };

  const handleSendMessage = async (override?: string, photoFile?: File) => {
    const messageToSend = override ?? input;
    if (!messageToSend.trim() && !photoFile) return;
    
    // Se c'è un file, caricalo prima
    let photoUrl: string | undefined;
    if (photoFile) {
      const uploadToast = toast.loading('Caricamento immagine in corso...', {
        description: 'Attendi, stiamo caricando la tua foto...'
      });
      
      try {
        const formData = new FormData();
        formData.append('file', photoFile);
        
        const uploadRes = await fetch('/api/upload-image', {
          method: 'POST',
          body: formData,
        });
        
        if (uploadRes.ok) {
          const data = await uploadRes.json();
          photoUrl = data.url;
          toast.success('Immagine caricata con successo!', { 
            id: uploadToast,
            description: 'La foto è stata caricata e sarà inviata con il messaggio'
          });
        } else {
          const errorData = await uploadRes.json().catch(() => ({ error: 'Errore sconosciuto' }));
          console.error('Errore nel caricamento dell\'immagine:', errorData.error);
          
          let errorMessage = 'Errore nel caricamento dell\'immagine.';
          if (errorData.error?.includes('Bucket')) {
            errorMessage = 'Storage non configurato. L\'immagine non può essere caricata al momento.';
          } else if (errorData.error?.includes('Non autorizzato')) {
            errorMessage = 'Sessione scaduta. Ricarica la pagina e riprova.';
          }
          
          toast.error(errorMessage, { 
            id: uploadToast,
            duration: 5000
          });
          return; // Non inviare il messaggio se l'upload fallisce
        }
      } catch (error) {
        console.error('Errore nel caricamento dell\'immagine:', error);
        toast.error('Errore di connessione durante il caricamento. Riprova.', { 
          id: uploadToast,
          duration: 5000
        });
        return;
      }
    }
    
    await sendMessage(messageToSend.trim() || 'Foto caricata', photoUrl);
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

  // Mostra la guida se una categoria è stata selezionata
  if (selectedCategory && messages.length === 0) {
    return (
      <>
        <CategoryGuide
          category={selectedCategory}
          categoryName={categoryNames[selectedCategory]}
          onStartChat={handleStartChat}
          onSkip={handleSkipGuide}
        />
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t">
          <MessageInput
            input={input}
            handleInputChange={handleInputChange}
            handleSend={handleSendMessage}
            isLoading={isLoading}
          />
        </div>
      </>
    );
  }

  // Mostra la schermata iniziale se non ci sono messaggi
  if (messages.length === 0) {
    return (
      <>
        <ChatIntroScreen
          onCategorySelect={handleCategorySelect}
          businessName={assistantConfig?.name}
        />
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t">
          <MessageInput
            input={input}
            handleInputChange={handleInputChange}
            handleSend={handleSendMessage}
            isLoading={isLoading}
          />
        </div>
      </>
    );
  }

  return (
    <div className="relative flex h-full min-h-full flex-col bg-gray-50">
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 md:px-6 pb-20 sm:pb-24 pt-4 sm:pt-6 space-y-3 sm:space-y-4">
        {messages
          .filter(isDisplayableMessage)
          .map((msg, index) => (
            <div key={msg.id ?? index} className="max-w-full">
              {msg.role === 'user' && typeof msg.content === 'string' && (
                <ChatBubble 
                  role="user" 
                  content={msg.content} 
                  imageUrl={msg.photo}
                  createdAt={msg.createdAt}
                />
              )}
              {msg.role === 'assistant' && (
                <>
                  {typeof msg.content === 'string' && (
                    <ChatBubble 
                      role="assistant" 
                      content={msg.content}
                      createdAt={msg.createdAt}
                    />
                  )}
                  {typeof msg.content === 'object' && msg.content.type === 'text' && (
                     <ChatBubble 
                       role="assistant" 
                       content={msg.content.content as string}
                       createdAt={msg.createdAt}
                     />
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

      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t shadow-lg">
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
