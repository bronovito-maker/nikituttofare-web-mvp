'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Send, 
  ArrowLeft, 
  Phone, 
  Wrench, 
  Zap, 
  Key, 
  Thermometer,
  X,
  CheckCircle2,
  Clock,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NikiBotAvatar, Avatar } from '@/components/ui/avatar';
import { LoadingDots, LoadingSpinner } from '@/components/ui/loading-dots';
import { ClientAnimationWrapper } from '@/components/ui/client-animation-wrapper';
import { GenerativeUI } from '@/components/chat/generative-ui';
import { MagicLinkModal } from '@/components/chat/magic-link-modal';
import { ImageUpload, ImagePreview } from '@/components/ui/image-upload';
import { useChatStore, type ChatMessage } from '@/lib/stores/chat-store';
import type { AIResponseType } from '@/lib/ai-structures';
import { createBrowserClient } from '@/lib/supabase-browser';

// Quick action categories
const QUICK_ACTIONS = [
  { 
    id: 'plumbing', 
    label: 'Idraulico', 
    icon: Wrench, 
    color: 'from-blue-600 to-blue-500',
    shadowColor: 'shadow-blue-500/25',
    message: 'Ho bisogno di un idraulico urgente'
  },
  { 
    id: 'electric', 
    label: 'Elettricista', 
    icon: Zap, 
    color: 'from-yellow-500 to-orange-500',
    shadowColor: 'shadow-orange-500/25',
    message: 'Ho bisogno di un elettricista urgente'
  },
  { 
    id: 'locksmith', 
    label: 'Fabbro', 
    icon: Key, 
    color: 'from-slate-700 to-slate-600',
    shadowColor: 'shadow-slate-500/25',
    message: 'Ho bisogno di un fabbro urgente'
  },
  { 
    id: 'climate', 
    label: 'Clima', 
    icon: Thermometer, 
    color: 'from-cyan-500 to-blue-500',
    shadowColor: 'shadow-cyan-500/25',
    message: 'Ho un problema con il condizionatore/caldaia'
  },
];

export default function ChatPage() {
  // Zustand store
  const { 
    messages, 
    isLoading, 
    error,
    isConfirmationPending,
    addMessage, 
    setLoading, 
    setError,
    setConfirmationPending,
    currentTicketId,
    setCurrentTicketId
  } = useChatStore();
  
  const [input, setInput] = useState('');
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [showMagicLinkModal, setShowMagicLinkModal] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle Magic Link auth redirect - exchange code for session
  useEffect(() => {
    const supabase = createBrowserClient();
    
    // Check if we have auth params in URL (from Magic Link redirect)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const queryParams = new URLSearchParams(window.location.search);
    
    const accessToken = hashParams.get('access_token');
    const code = queryParams.get('code');
    
    if (accessToken || code) {
      // Let Supabase handle the session exchange
      supabase.auth.getSession().then(({ data, error }) => {
        if (error) {
          console.error('Auth session error:', error);
        } else if (data.session) {
          console.log('✅ Session established:', data.session.user.email);
          // Clean up URL
          window.history.replaceState({}, '', '/chat');
        }
      });
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Hide quick actions after first message
  useEffect(() => {
    if (messages.length > 0) {
      setShowQuickActions(false);
    }
  }, [messages.length]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const sendMessage = useCallback(async (messageContent: string, photo?: string) => {
    if (isLoading) return;
    
    const trimmedContent = messageContent.trim();
    if (!trimmedContent && !photo) return;

    setError(null);
    setLoading(true);

    // Add user message to store
    addMessage({
      role: 'user',
      content: trimmedContent || 'Foto caricata',
      photo,
    });

    try {
      // Detect category from message
      const category = detectCategory(trimmedContent);

      // Create ticket if first message
      let ticketId = currentTicketId;
      if (!ticketId && messages.length === 0) {
        const ticketRes = await fetch('/api/tickets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category,
            description: trimmedContent,
            priority: 'medium',
            address: null,
            imageUrl: photo,
          }),
        });

        if (ticketRes.ok) {
          const data = await ticketRes.json();
          ticketId = data.ticketId;
          setCurrentTicketId(ticketId);
        }
      }

      // Call AI assist
      const allMessages = [...messages, { role: 'user', content: trimmedContent, photo }];
      const res = await fetch('/api/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: allMessages.map(m => ({
            role: m.role,
            content: m.content,
            photo: m.photo,
          })),
          ticketId,
        }),
      });

      if (!res.ok) {
        throw new Error('Errore nella risposta AI');
      }

      const aiResponse: AIResponseType = await res.json();

      // Add AI response to store
      addMessage({
        role: 'assistant',
        content: aiResponse,
      });

      // Check if confirmation is needed (recap type)
      if (aiResponse.type === 'recap') {
        setConfirmationPending(true);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setLoading(false);
    }
  }, [messages, isLoading, currentTicketId, addMessage, setLoading, setError, setCurrentTicketId, setConfirmationPending]);

  const handleSend = useCallback(async () => {
    if ((!input.trim() && !uploadedImageUrl) || isLoading || isUploading) return;
    
    const messageToSend = input.trim();
    const imageUrl = uploadedImageUrl;
    setInput('');
    setUploadedImageUrl(null);
    
    await sendMessage(messageToSend, imageUrl || undefined);
  }, [input, uploadedImageUrl, isLoading, isUploading, sendMessage]);

  const handleQuickAction = async (action: typeof QUICK_ACTIONS[0]) => {
    setShowQuickActions(false);
    await sendMessage(action.message);
  };

  const handleFormSubmit = useCallback(
    async (formData: Record<string, string>) => {
      if (!currentTicketId) {
        setError('Ticket non disponibile. Riprovare.');
        return;
      }
      setLoading(true);
      try {
        const res = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticketId: currentTicketId,
            role: 'user',
            content: 'Dati aggiuntivi inviati',
            metaData: formData,
          }),
        });

        if (!res.ok) {
          throw new Error('Salvataggio dati non riuscito');
        }

        addMessage({
          role: 'assistant',
          content: {
            type: 'text',
            content: 'Perfetto, ho registrato i dettagli. Sto finalizzando la richiesta.',
          } as AIResponseType,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Errore nel salvataggio del form');
      } finally {
        setLoading(false);
      }
    },
    [currentTicketId, addMessage, setError, setLoading]
  );

  const handleImageUploaded = useCallback((url: string) => {
    setUploadedImageUrl(url);
    setIsUploading(false);
  }, []);

  const handleUploadStart = useCallback(() => {
    setIsUploading(true);
  }, []);

  const handleUploadError = useCallback((error: string) => {
    setIsUploading(false);
    setError(error);
  }, [setError]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleConfirmRequest = () => {
    setShowMagicLinkModal(true);
  };

  const handleMagicLinkSuccess = (email: string) => {
    // Add confirmation message
    addMessage({
      role: 'assistant',
      content: {
        type: 'confirmation',
        content: {
          message: `Perfetto! La tua richiesta è stata confermata. Un tecnico ti contatterà a breve all'indirizzo ${email}.`,
          ticketId: currentTicketId,
        }
      }
    });
    setConfirmationPending(false);
    setShowMagicLinkModal(false);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50/50">
      
      {/* Header - NO GLASSMORPHISM per la chat */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          
          {/* Left - Back + Logo */}
          <div className="flex items-center gap-3">
            <Link 
              href="/" 
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Link>
            
            <div className="flex items-center gap-3">
              <NikiBotAvatar size="md" />
              <div className="hidden sm:block">
                <h1 className="text-sm font-bold text-slate-900 leading-tight">NikiBot</h1>
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Online • Risponde subito
                </div>
              </div>
            </div>
          </div>

          {/* Right - Emergency Call */}
          <Button
            asChild
            size="sm"
            className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white rounded-full px-4 py-2 shadow-lg shadow-orange-200/50 font-semibold text-sm"
          >
            <a href="tel:+390541123456" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              <span className="hidden sm:inline">Emergenza</span>
            </a>
          </Button>
        </div>
      </header>

      {/* Chat Messages Area */}
      <main className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          
          {/* Welcome Message */}
          {messages.length === 0 && (
            <ClientAnimationWrapper delay={0.1} duration={0.5}>
              <div className="text-center space-y-6 py-8">
                
                {/* Hero Icon */}
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-xl shadow-blue-500/25">
                  <Wrench className="w-10 h-10 text-white" />
                </div>
                
                {/* Welcome Text */}
                <div className="space-y-2">
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                    Ciao! Come posso aiutarti?
                  </h2>
                  <p className="text-slate-500 text-sm sm:text-base max-w-md mx-auto">
                    Descrivi il problema o scatta una foto. Ti darò un preventivo istantaneo e ti metterò in contatto con un tecnico.
                  </p>
                </div>

                {/* Trust Badges */}
                <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>Risposta in 2 min</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
                    <Shield className="w-3.5 h-3.5 text-green-600" />
                    <span>Preventivo garantito</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
                    <CheckCircle2 className="w-3.5 h-3.5 text-orange-600" />
                    <span>Intervento in 60 min</span>
                  </div>
                </div>

              </div>
            </ClientAnimationWrapper>
          )}

          {/* Quick Actions */}
          {showQuickActions && messages.length === 0 && (
            <ClientAnimationWrapper delay={0.3} duration={0.5}>
              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-600 text-center">
                  Seleziona il tipo di emergenza:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {QUICK_ACTIONS.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.id}
                        onClick={() => handleQuickAction(action)}
                        className="group flex flex-col items-center gap-3 p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/50 hover:border-slate-300 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                      >
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} ${action.shadowColor} shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">
                          {action.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </ClientAnimationWrapper>
          )}

          {/* Messages */}
          {messages.map((message, index) => (
            <MessageBubble 
              key={message.id} 
              message={message} 
              isLast={index === messages.length - 1}
              onConfirm={isConfirmationPending && index === messages.length - 1 ? handleConfirmRequest : undefined}
              onFormSubmit={handleFormSubmit}
            />
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-start gap-3 message-enter">
              <NikiBotAvatar size="sm" />
              <div className="chat-bubble-assistant px-4 py-3 max-w-[85%] sm:max-w-[70%]">
                <LoadingDots size="md" />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex justify-center">
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area - NO GLASSMORPHISM */}
      <div className="sticky bottom-0 w-full bg-white border-t border-slate-200 shadow-lg shadow-slate-200/20">
        <div className="max-w-4xl mx-auto px-4 py-4">
          
          {/* Image Preview - shown when image is uploaded */}
          {uploadedImageUrl && (
            <div className="mb-3">
              <ImagePreview 
                url={uploadedImageUrl} 
                onRemove={() => setUploadedImageUrl(null)} 
              />
            </div>
          )}

          {/* Input Row */}
          <div className="flex items-end gap-3">
            
            {/* Image Upload Button with Progress */}
            <ImageUpload
              onUploadComplete={handleImageUploaded}
              onUploadStart={handleUploadStart}
              onError={handleUploadError}
              disabled={isLoading}
            />

            {/* Text Input */}
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Descrivi il problema..."
                rows={1}
                disabled={isLoading}
                className="w-full px-4 py-3 pr-14 bg-slate-100 border-0 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all resize-none min-h-[48px] max-h-[120px]"
              />
              
              {/* Send Button (inside input) */}
              <button
                onClick={handleSend}
                disabled={(!input.trim() && !uploadedImageUrl) || isLoading || isUploading}
                className="absolute right-2 bottom-2 w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg shadow-blue-500/25 hover:shadow-xl hover:scale-105 active:scale-95"
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" className="text-white" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Helper Text */}
          <p className="text-xs text-slate-400 text-center mt-3">
            Premi Invio per inviare • Shift+Invio per andare a capo
          </p>
        </div>
      </div>

      {/* Magic Link Modal */}
      <MagicLinkModal
        isOpen={showMagicLinkModal}
        onClose={() => setShowMagicLinkModal(false)}
        onSuccess={handleMagicLinkSuccess}
      />
    </div>
  );
}

// Message Bubble Component
function MessageBubble({ 
  message, 
  isLast,
  onConfirm,
  onFormSubmit
}: { 
  message: ChatMessage; 
  isLast: boolean;
  onConfirm?: () => void;
  onFormSubmit?: (data: Record<string, string>) => void;
}) {
  const isUser = message.role === 'user';
  const content = message.content;

  return (
    <div 
      className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''} ${isLast ? 'message-enter' : ''}`}
    >
      {/* Avatar */}
      {isUser ? (
        <Avatar fallback="Tu" size="sm" />
      ) : (
        <NikiBotAvatar size="sm" />
      )}

      {/* Bubble */}
      <div 
        className={`max-w-[85%] sm:max-w-[70%] ${
          isUser ? 'chat-bubble-user' : 'chat-bubble-assistant'
        } px-4 py-3 space-y-2`}
      >
        {/* Image if present */}
        {message.photo && (
          <img 
            src={message.photo} 
            alt="Foto allegata" 
            className="rounded-lg max-w-full h-auto max-h-48"
          />
        )}

        {/* Text Content */}
        {typeof content === 'string' ? (
          <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
            {content}
          </p>
        ) : (
          <GenerativeUI 
            response={content} 
            onConfirm={onConfirm}
            onFormSubmit={onFormSubmit}
          />
        )}
      </div>
    </div>
  );
}

// Helper function to detect category
function detectCategory(message: string): 'plumbing' | 'electric' | 'locksmith' | 'climate' | 'generic' {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('idraulico') || lowerMessage.includes('acqua') || lowerMessage.includes('tubo') || lowerMessage.includes('perdita') || lowerMessage.includes('scarico')) {
    return 'plumbing';
  }
  if (lowerMessage.includes('elettric') || lowerMessage.includes('luce') || lowerMessage.includes('presa') || lowerMessage.includes('salvavita')) {
    return 'electric';
  }
  if (lowerMessage.includes('fabbro') || lowerMessage.includes('serratura') || lowerMessage.includes('chiave') || lowerMessage.includes('porta')) {
    return 'locksmith';
  }
  if (lowerMessage.includes('clima') || lowerMessage.includes('condizionatore') || lowerMessage.includes('caldaia') || lowerMessage.includes('riscaldamento')) {
    return 'climate';
  }
  
  return 'generic';
}
