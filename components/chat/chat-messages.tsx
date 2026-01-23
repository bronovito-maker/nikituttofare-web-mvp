'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Bot, User } from 'lucide-react';
import { AIResponseType } from '@/lib/ai-structures';

// Helper function to safely stringify content
function stringifyContent(content: unknown): string {
  if (typeof content === 'string') return content;
  try {
    return JSON.stringify(content, null, 2);
  } catch {
    return String(content ?? '');
  }
}

// Message type
interface ChatMessageData {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string | AIResponseType;
  createdAt?: Date | string;
  photo?: string;
}

// Message Bubble Component
function MessageBubble({ message }: { message: ChatMessageData }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-500 rounded-full flex items-center justify-center">
          <Bot className="w-4 h-4 text-white" />
        </div>
      )}

      <div className={`max-w-[80%] sm:max-w-[70%] ${isUser ? 'order-1' : ''}`}>
        <div
          className={`px-4 py-3 rounded-2xl ${
            isUser
              ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-br-md'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-tl-md shadow-sm'
          }`}
        >
          {/* Message Content */}
          <div className={`text-sm leading-relaxed ${isUser ? 'text-white' : 'text-slate-900 dark:text-slate-50'}`}>
            {typeof message.content === 'string' ? (
              <div className="whitespace-pre-wrap">{message.content}</div>
            ) : (
              <AIResponseRenderer content={message.content} />
            )}
          </div>

          {/* Photo Attachment */}
          {message.photo && (
            <div className="mt-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={message.photo}
                alt="User uploaded content"
                loading="lazy"
              />
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div className={`text-xs text-slate-500 mt-1 ${isUser ? 'text-right' : ''}`}>
          {message.createdAt && new Date(message.createdAt).toLocaleTimeString('it-IT', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-slate-600 to-slate-500 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
      )}
    </div>
  );
}

// AI Response Renderer
function AIResponseRenderer({ content }: { content: AIResponseType }) {
  if (!content || typeof content !== 'object') return null;

  switch (content.type) {
    case 'booking_summary': {
      const summaryData = content.content as Record<string, unknown>;
      return (
        <div className="space-y-3">
          <div className="font-semibold text-slate-900">📋 Riepilogo Prenotazione</div>
          <div className="space-y-2 text-sm">
            {summaryData && Object.entries(summaryData).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="text-slate-600 capitalize">{key}:</span>
                <span className="font-medium">{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case 'confirmation':
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2 font-semibold text-green-700">
            <span className="text-lg">✅</span>
            Prenotazione Confermata
          </div>
          <div className="text-sm text-slate-700">
            {typeof content.content === 'string' ? content.content : stringifyContent(content.content)}
          </div>
        </div>
      );

    case 'text':
      return (
        <div className="whitespace-pre-wrap">
          {typeof content.content === 'string' ? content.content : stringifyContent(content.content)}
        </div>
      );

    case 'form': {
      const formContent = content.content as { fields?: Array<{ name: string; label: string }> };
      return (
        <div className="space-y-2">
          <div className="text-sm font-medium">Compila i seguenti campi:</div>
          {formContent?.fields?.map((field) => (
            <div key={field.name} className="text-sm text-slate-600">
              • {field.label}
            </div>
          ))}
        </div>
      );
    }

    case 'recap':
      return (
        <div className="space-y-2">
          <div className="font-semibold">📝 Riepilogo</div>
          <div className="text-sm">
            {typeof content.content === 'string' ? content.content : stringifyContent(content.content)}
          </div>
        </div>
      );

    default:
      return (
        <div className="whitespace-pre-wrap">
          {typeof content.content === 'string'
            ? content.content
            : stringifyContent(content.content) || 'Risposta ricevuta'}
        </div>
      );
  }
}

interface ChatMessagesProps {
  messages: ChatMessageData[];
  isLoading: boolean;
}

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Virtual scrolling for performance with many messages
  const visibleMessages = messages.slice(-50);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  return (
    <div
      className={`flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-4 transition-colors ${
        isDragging ? 'bg-blue-50/50' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {visibleMessages.map((msg, index) => (
        <MessageBubble key={msg.id || `msg-${index}`} message={msg} />
      ))}

      {/* Typing Indicator */}
      {isLoading && (
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-500 rounded-full flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div className="bg-slate-100 rounded-2xl rounded-tl-md px-4 py-3">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      )}

      {messages.length > 50 && (
        <div className="text-center py-2">
          <p className="text-xs text-slate-500">
            Mostra solo gli ultimi 50 messaggi per prestazioni ottimali
          </p>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}

export default ChatMessages;

