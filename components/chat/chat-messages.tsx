'use client';

import { useRef, useEffect, useState, useCallback, memo, useMemo } from 'react';
import { Bot, User } from 'lucide-react';
import Image from 'next/image';
import { AIResponseType } from '@/lib/ai-structures';
import { AIThinkingAnimation } from './ai-thinking-animation';

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

// Message Bubble Component - Memoized to prevent unnecessary re-renders
const MessageBubble = memo(function MessageBubble({ message }: Readonly<{ message: ChatMessageData }>) {
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
          className={`px-4 py-3 rounded-2xl ${isUser
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
            <div className="mt-3 relative w-full max-w-sm">
              <Image
                src={message.photo}
                alt="User uploaded content"
                width={400}
                height={300}
                className="rounded-lg object-cover w-full h-auto"
                loading="lazy"
                quality={75}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 400px"
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
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if message content actually changed
  return prevProps.message.id === nextProps.message.id &&
         prevProps.message.content === nextProps.message.content &&
         prevProps.message.photo === nextProps.message.photo;
});

// AI Response Renderer
function AIResponseRenderer({ content }: Readonly<{ content: AIResponseType }>) {
  if (!content || typeof content !== 'object') return null;

  switch (content.type) {
    case 'booking_summary': {
      const summaryData = content.content as Record<string, unknown>;
      return (
        <div className="space-y-3">
          <div className="font-semibold text-slate-900 dark:text-slate-50">📋 Riepilogo Prenotazione</div>
          <div className="space-y-2 text-sm">
            {summaryData && Object.entries(summaryData).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400 capitalize">{key}:</span>
                <span className="font-medium text-slate-900 dark:text-slate-50">{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case 'confirmation':
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2 font-semibold text-green-700 dark:text-green-400">
            <span className="text-lg">✅</span>
            <span>Prenotazione Confermata</span>
          </div>
          <div className="text-sm text-slate-700 dark:text-slate-300">
            {typeof content.content === 'string' ? content.content : stringifyContent(content.content)}
          </div>
        </div>
      );

    case 'text':
      return (
        <div className="whitespace-pre-wrap text-slate-900 dark:text-slate-50">
          {typeof content.content === 'string' ? content.content : stringifyContent(content.content)}
        </div>
      );

    case 'form': {
      const formContent = content.content as { fields?: Array<{ name: string; label: string }> };
      return (
        <div className="space-y-2">
          <div className="text-sm font-medium text-slate-900 dark:text-slate-50">Compila i seguenti campi:</div>
          {formContent?.fields?.map((field) => (
            <div key={field.name} className="text-sm text-slate-600 dark:text-slate-400">
              • {field.label}
            </div>
          ))}
        </div>
      );
    }

    case 'recap':
      return (
        <div className="space-y-2">
          <div className="font-semibold text-slate-900 dark:text-slate-50">📝 Riepilogo</div>
          <div className="text-sm text-slate-900 dark:text-slate-50">
            {typeof content.content === 'string' ? content.content : stringifyContent(content.content)}
          </div>
        </div>
      );

    default:
      return (
        <div className="whitespace-pre-wrap text-slate-900 dark:text-slate-50">
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

export function ChatMessages({ messages, isLoading }: Readonly<ChatMessagesProps>) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Virtual scrolling for performance with many messages
  // Memoize to avoid unnecessary recalculations
  const visibleMessages = useMemo(() => {
    // Show last 50 messages for optimal mobile performance
    return messages.slice(-50);
  }, [messages]);

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
      className={`flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-4 transition-colors ${isDragging ? 'bg-blue-50/50' : ''
        }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      role="log"
      aria-label="Chat messages"
      aria-live="polite"
    >
      {
        visibleMessages.map((msg, index) => (
          <MessageBubble key={msg.id || `msg-${index}`} message={msg} />
        ))
      }

      {/* AI Thinking Animation - alternates between 5 different animations */}
      {isLoading && <AIThinkingAnimation variant="random" interval={4000} />}

      {
        messages.length > 50 && (
          <div className="text-center py-2">
            <p className="text-xs text-slate-500">
              Mostra solo gli ultimi 50 messaggi per prestazioni ottimali
            </p>
          </div>
        )
      }

      <div ref={messagesEndRef} />
    </div >
  );
}

export default ChatMessages;

