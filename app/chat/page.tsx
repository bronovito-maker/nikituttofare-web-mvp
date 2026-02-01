'use client';

import { useState, useRef, useEffect, useCallback, ComponentPropsWithoutRef } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown'; // Import ReactMarkdown
import {
  Send,
  ArrowLeft,
  Phone,
  Wrench,
  Zap,
  Key,
  Thermometer,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NikiBotAvatar, Avatar } from '@/components/ui/avatar';
import { LoadingDots, LoadingSpinner } from '@/components/ui/loading-dots';
import { ClientAnimationWrapper } from '@/components/ui/client-animation-wrapper';
import { ImageUpload, ImagePreview } from '@/components/ui/image-upload';
import { createBrowserClient } from '@/lib/supabase-browser';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { MobileNav } from '@/components/layout/mobile-nav';

// ⚠️ IMPORTIAMO IL NUOVO HOOK N8N
import { useN8NChat } from '@/hooks/useN8NChat';
import { COMPANY_PHONE_LINK } from '@/lib/constants';
import { ChatSuggestions, INITIAL_SUGGESTIONS, PROBLEM_FOLLOWUP_SUGGESTIONS } from '@/components/chat/chat-suggestions';
// import { ChatProgress } from '@/components/chat/chat-progress'; // REMOVED
import { ChatWelcome } from '@/components/chat/chat-welcome';

// Quick action categories removed - moved to chat-welcome.tsx

export default function ChatPage() {
  // ✅ USA IL NUOVO HOOK N8N (Motore Semplice)
  const { messages, sendMessage, isLoading } = useN8NChat();
  const router = useRouter();

  // Stati UI locali
  const [input, setInput] = useState('');
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conversationStep, setConversationStep] = useState(0);

  // Auth state (Mantenuto per mostrare l'avatar utente)
  const [userInitials, setUserInitials] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auth Effect (Solo per estetica avatar)
  useEffect(() => {
    const supabase = createBrowserClient();
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsAuthenticated(true);
        // User email removed as unused variable
        const email = user.email || '';
        const name = user.user_metadata?.full_name || email.split('@')[0];
        const initials = name.split(' ')
          .map((n: string) => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase();
        setUserInitials(initials || email[0]?.toUpperCase() || 'U');
      }
    };
    checkSession();
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Nascondi Quick Actions se ci sono messaggi
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

  // Gestione Invio Messaggio
  const handleSend = useCallback(async () => {
    if ((!input.trim() && !uploadedImageUrl) || isLoading || isUploading) return;

    const messageToSend = input.trim();
    // Nota: Per ora n8n riceve il testo. Se c'è una foto, aggiungiamo un testo che lo indica.
    const finalMessage = uploadedImageUrl
      ? `[UTENTE HA CARICATO UNA FOTO: ${uploadedImageUrl}] ${messageToSend}`
      : messageToSend;

    setInput('');
    setUploadedImageUrl(null);
    setError(null);

    // 🔥 Chiama n8n tramite il nostro hook
    await sendMessage(finalMessage);

    // Advance conversation step
    setConversationStep(prev => Math.min(prev + 1, 3));

  }, [input, uploadedImageUrl, isLoading, isUploading, sendMessage]);


  // Handle suggestion click
  const handleSuggestionClick = async (suggestion: string) => {
    await sendMessage(suggestion);
    setConversationStep(prev => Math.min(prev + 1, 3));
  };

  // Gestione Immagini (UI Only per ora)
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
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden bg-background">

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-secondary hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </Link>

            <div className="flex items-center gap-3">
              <NikiBotAvatar size="md" />
              <div>
                <h1 className="text-sm font-bold text-foreground leading-tight">Niki AI</h1>
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  {'Online • Powered by n8n'}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && userInitials && (
              <div className="flex items-center gap-2 group">
                <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/25">
                  {userInitials}
                </div>
              </div>
            )}

            <Button
              asChild
              size="sm"
              className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white rounded-full px-4 py-2 shadow-lg shadow-orange-500/50 font-semibold text-sm"
            >
              <a href={COMPANY_PHONE_LINK} className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span className="hidden sm:inline">Emergenza</span>
              </a>
            </Button>

            <MobileNav />
          </div>
        </div>
      </header>

      {/* Progress Bar REMOVED as per request */}

      {/* Main Chat Area */}
      <main className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 min-h-full">

          {/* Welcome / Hero - Only shown if no messages */}
          {messages.length === 0 ? (
            <ChatWelcome onOptionSelect={async (msg) => {
              await sendMessage(msg);
            }} />
          ) : (
            <>
              {/* Messages List */}
              {messages.map((message, index) => (
                <MessageBubble
                  key={message.id || index}
                  message={message}
                  isLast={index === messages.length - 1}
                />
              ))}
            </>
          )}

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
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <div className="sticky bottom-0 w-full bg-card border-t border-border shadow-lg shadow-black/5 pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-4">

          {/* Suggestions Chips - Floating above input */}
          {!isLoading && (
            <div className="mb-3 overflow-x-auto pb-1 scrollbar-none">
              <ChatSuggestions
                suggestions={messages.length === 0 ? INITIAL_SUGGESTIONS : (messages[messages.length - 1]?.role === 'assistant' ? PROBLEM_FOLLOWUP_SUGGESTIONS : [])}
                onSelect={handleSuggestionClick}
                disabled={isLoading}
              />
            </div>
          )}

          {uploadedImageUrl && (
            <div className="mb-3">
              <ImagePreview
                url={uploadedImageUrl}
                onRemove={() => setUploadedImageUrl(null)}
              />
            </div>
          )}

          {isUploading && (
            <div className="mb-2 flex items-center gap-2 text-sm text-blue-600">
              <LoadingSpinner size="sm" />
              <span>Caricamento foto...</span>
            </div>
          )}

          <div className="flex items-end gap-2 sm:gap-3">
            {/* Left Box: Upload */}
            <div className="flex-shrink-0">
              <ImageUpload
                onUploadComplete={handleImageUploaded}
                onUploadStart={handleUploadStart}
                onError={handleUploadError}
                disabled={isLoading}
                isAuthenticated={isAuthenticated}
                onAuthError={() => {
                  toast("Serve un account per le foto", {
                    description: "Per analizzare le tue immagini e garantirti la massima privacy, abbiamo bisogno che tu acceda. È questione di un attimo e potrai caricare tutte le foto che vuoi!",
                    action: {
                      label: "Accedi o Registrati",
                      onClick: () => router.push('/login?redirect=/chat')
                    },
                    duration: 5000,
                  });
                }}
              />
            </div>

            {/* Middle Box: Textarea */}
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Descrivi il problema..."
                rows={1}
                disabled={isLoading}
                className="w-full px-4 py-3 bg-secondary/50 border-0 rounded-2xl text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-card transition-all resize-none min-h-[48px] max-h-[120px]"
                style={{ fontSize: '16px' }}
              />
            </div>

            {/* Right Box: Send Button (Now outside) */}
            <div className="flex-shrink-0">
              <button
                onClick={handleSend}
                disabled={(!input.trim() && !uploadedImageUrl) || isLoading || isUploading}
                className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg shadow-blue-500/25 active:scale-95"
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" className="text-white" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 🎈 Componente Messaggio Semplificato


const MARKDOWN_COMPONENTS = {

  a: ({ node: _node, ...props }: ComponentPropsWithoutRef<'a'> & { node?: any }) => (
    <a {...props} target="_blank" rel="noopener noreferrer" className="underline font-medium">
      {props.children}
    </a>
  ),

  strong: ({ node: _node, ...props }: ComponentPropsWithoutRef<'strong'> & { node?: any }) => <strong {...props} className="font-bold" />,

  p: ({ node: _node, ...props }: ComponentPropsWithoutRef<'p'> & { node?: any }) => <p {...props} className="mb-2 last:mb-0" />
};

function MessageBubble({ message, isLast }: { readonly message: any; readonly isLast: boolean }) {
  const isUser = message.role === 'user';

  // N8N a volte restituisce oggetti, assicuriamoci di mostrare testo
  let content = message.content;
  if (typeof content === 'object') {
    content = content.text || content.output || JSON.stringify(content);
  }

  // Regex per trovare l'immagine caricata
  const imageRegex = /\[UTENTE HA CARICATO UNA FOTO: (https?:\/\/[^\]]+)\]/;
  const match = content.match(imageRegex);

  let imageUrl = null;
  let textContent = content;

  if (match) {
    imageUrl = match[1];
    textContent = content.replace(match[0], '').trim();
  }

  return (
    <div
      className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''} ${isLast ? 'message-enter' : ''}`}
    >
      {isUser ? (
        <Avatar fallback="Tu" size="sm" />
      ) : (
        <NikiBotAvatar size="sm" />
      )}

      <div
        className={`max-w-[85%] sm:max-w-[70%] ${isUser ? 'chat-bubble-user' : 'chat-bubble-assistant'
          } px-4 py-3 space-y-2 overflow-hidden`}
      >
        {imageUrl && (
          <div className="relative w-full h-48 sm:h-56 mb-2 rounded-lg overflow-hidden border border-white/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Uploaded"
              className="object-cover w-full h-full"
            />
          </div>
        )}

        {textContent && (
          <div className={`text-sm sm:text-base leading-relaxed break-words markdown-content ${isUser ? 'text-white' : 'text-foreground'}`}>
            <ReactMarkdown components={MARKDOWN_COMPONENTS}>
              {textContent}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}