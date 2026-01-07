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
  CheckCircle2,
  Clock,
  Shield,
  Plus,
  MapPin,
  FileText,
  AlertCircle
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

// Quick action categories (Tuttofare/generic nascosto dalla grid per estetica mobile)
const QUICK_ACTIONS = [
  {
    id: 'plumbing',
    label: 'Idraulico',
    icon: Wrench,
    color: 'from-blue-600 to-blue-500',
    shadowColor: 'shadow-blue-500/25',
    message: 'Vorrei un preventivo per un intervento idraulico'
  },
  {
    id: 'electric',
    label: 'Elettricista',
    icon: Zap,
    color: 'from-yellow-500 to-orange-500',
    shadowColor: 'shadow-orange-500/25',
    message: 'Vorrei un preventivo per un intervento elettrico'
  },
  {
    id: 'locksmith',
    label: 'Fabbro',
    icon: Key,
    color: 'from-slate-700 to-slate-600',
    shadowColor: 'shadow-slate-500/25',
    message: 'Vorrei un preventivo per un intervento da fabbro'
  },
  {
    id: 'climate',
    label: 'Clima',
    icon: Thermometer,
    color: 'from-cyan-500 to-blue-500',
    shadowColor: 'shadow-cyan-500/25',
    message: 'Vorrei un preventivo per un intervento di climatizzazione'
  },
  // Tuttofare rimosso dalla grid ma la categoria 'generic' rimane gestita dal backend
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
    setCurrentTicketId,
    clearChat,
    collectedSlots,
    missingSlots,
    updateSlots
  } = useChatStore();
  
  const [input, setInput] = useState('');
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [showMagicLinkModal, setShowMagicLinkModal] = useState(false);
  
  // User auth state
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userInitials, setUserInitials] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showConfirmationSuccess, setShowConfirmationSuccess] = useState(false);
  const [confirmedTicketId, setConfirmedTicketId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Check auth status and handle Magic Link redirect
  useEffect(() => {
    const supabase = createBrowserClient();
    
    // Check current session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setIsAuthenticated(true);
        setUserEmail(session.user.email || null);
        // Generate initials from email
        const email = session.user.email || '';
        const name = session.user.user_metadata?.full_name || email.split('@')[0];
        const initials = name.split(' ')
          .map((n: string) => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase();
        setUserInitials(initials || email[0]?.toUpperCase() || 'U');
      }
    };
    
    checkSession();
    
    // Check if we have auth params in URL (from Magic Link redirect)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const queryParams = new URLSearchParams(window.location.search);
    
    // Check for confirmation success (from email link click)
    const isConfirmed = queryParams.get('confirmed') === 'true';
    const ticketId = queryParams.get('ticket');
    
    if (isConfirmed && ticketId) {
      setShowConfirmationSuccess(true);
      setConfirmedTicketId(ticketId);
      // Clean up URL
      window.history.replaceState({}, '', '/chat');
    }
    
    const accessToken = hashParams.get('access_token');
    const code = queryParams.get('code');
    
    if (accessToken || code) {
      // Let Supabase handle the session exchange
      supabase.auth.getSession().then(({ data, error }) => {
        if (error) {
          console.error('Auth session error:', error);
        } else if (data.session) {
          console.log('✅ Session established:', data.session.user.email);
          setIsAuthenticated(true);
          setUserEmail(data.session.user.email || null);
          const email = data.session.user.email || '';
          const name = data.session.user.user_metadata?.full_name || email.split('@')[0];
          const initials = name.split(' ')
            .map((n: string) => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
          setUserInitials(initials || email[0]?.toUpperCase() || 'U');
          // Clean up URL
          window.history.replaceState({}, '', '/chat');
        }
      });
    }

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setIsAuthenticated(true);
        setUserEmail(session.user.email || null);
        const email = session.user.email || '';
        const name = session.user.user_metadata?.full_name || email.split('@')[0];
        const initials = name.split(' ')
          .map((n: string) => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase();
        setUserInitials(initials || email[0]?.toUpperCase() || 'U');
      } else {
        setIsAuthenticated(false);
        setUserEmail(null);
        setUserInitials(null);
      }
    });

    return () => subscription.unsubscribe();
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
      // NON creare ticket qui - lascia che sia l'API /api/assist a gestire
      // il ticket creation SOLO quando tutti i dati sono raccolti
      const ticketId = currentTicketId;

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

      const responseData = await res.json();
      
      // Estrai la risposta AI e i dati di debug
      const aiResponse: AIResponseType = {
        type: responseData.type,
        content: responseData.content
      };
      
      // Aggiorna lo stato degli slot se presente nei dati di debug
      if (responseData._debug) {
        const { slotsCollected, missingSlots: newMissing, ticketId: newTicketId, ticketCreated } = responseData._debug;
        
        // Aggiorna gli slot raccolti in base ai booleani dal server
        if (slotsCollected) {
          updateSlots({
            phoneNumber: slotsCollected.phone ? 'collected' : undefined,
            serviceAddress: slotsCollected.address ? 'collected' : undefined,
            problemCategory: slotsCollected.category ? 'plumbing' : undefined, // placeholder, actual category from server
            problemDetails: slotsCollected.details ? 'collected' : undefined,
          }, newMissing || []);
        }
        
        // Aggiorna ticket ID se creato
        if (ticketCreated && newTicketId && !ticketId) {
          setCurrentTicketId(newTicketId);
        }
      }

      // Add AI response to store
      addMessage({
        role: 'assistant',
        content: aiResponse,
      });

      // Check if confirmation is needed (recap type)
      if (aiResponse.type === 'recap') {
        setConfirmationPending(true);
      }

      // Handle direct confirmation (utente già autenticato - ticket confermato immediatamente)
      if (aiResponse.type === 'confirmation') {
        // Ticket già confermato, aggiorna l'ID se presente
        const ticketId = responseData._debug?.ticketId;
        if (ticketId && !currentTicketId) {
          setCurrentTicketId(ticketId);
        }
        setConfirmationPending(false);
        // Non fare redirect, mostra il messaggio di conferma
        return;
      }

      // Handle authentication required (utente NON autenticato - richiedi Magic Link)
      if (aiResponse.type === 'auth_required') {
        // Aggiorna ticket ID se presente
        const ticketId = responseData._debug?.ticketId;
        if (ticketId && !currentTicketId) {
          setCurrentTicketId(ticketId);
        }
        // Mostra il modal Magic Link invece di redirect immediato
        setShowMagicLinkModal(true);
        return;
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setLoading(false);
    }
  }, [messages, isLoading, currentTicketId, addMessage, setLoading, setError, setCurrentTicketId, setConfirmationPending, updateSlots]);

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

  const handleMagicLinkSuccess = async (email: string) => {
    // DO NOT confirm the ticket here - user must click email link first!
    // Just show a "waiting for email confirmation" message
    
    addMessage({
      role: 'assistant',
      content: {
        type: 'text',
        content: `⚠️ **Richiesta in Attesa!**\n\nTi ho inviato una mail a **${email}**.\n\n🚨 **IMPORTANTE:** Devi cliccare il link nella mail per attivare la richiesta e inviarla ai tecnici.\n\nSenza questo passaggio, il tuo ticket **non sarà inviato** e nessun tecnico ti contatterà.\n\n📩 Controlla la tua casella email (anche la cartella SPAM).`,
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

          {/* Right - User Avatar + New Chat + Emergency Call */}
          <div className="flex items-center gap-2">
            {/* User Avatar - show when logged in */}
            {isAuthenticated && userInitials && (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 group"
                title={userEmail || 'Il tuo profilo'}
              >
                <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform">
                  {userInitials}
                  {/* Online indicator */}
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                </div>
                <span className="hidden lg:block text-xs text-slate-600 max-w-[100px] truncate">
                  {userEmail?.split('@')[0]}
                </span>
              </Link>
            )}

            {/* New Chat Button - only show if there are messages */}
            {messages.length > 0 && (
              <button
                onClick={() => {
                  clearChat();
                  setShowQuickActions(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
                title="Nuova conversazione"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Nuova</span>
              </button>
            )}
            
            <Button
              asChild
              size="sm"
              className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white rounded-full px-4 py-2 shadow-lg shadow-orange-200/50 font-semibold text-sm"
            >
              <a href="tel:+393461027447" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span className="hidden sm:inline">Emergenza</span>
              </a>
            </Button>
          </div>
        </div>
      </header>

      {/* Progress Indicator - shows when collecting data */}
      {messages.length > 0 && missingSlots.length > 0 && !currentTicketId && (
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-200/50 px-4 py-3">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-2 text-sm font-medium text-blue-800">
                <div className="relative">
                  <AlertCircle className="w-4 h-4" />
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-500 rounded-full animate-ping" />
                </div>
                <span>Raccolta informazioni</span>
                <span className="text-blue-600/70">
                  ({4 - missingSlots.length}/4)
                </span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <SlotIndicator 
                  icon={<Phone className="w-3.5 h-3.5" />}
                  label="Telefono"
                  filled={!missingSlots.includes('numero di telefono')}
                />
                <SlotIndicator 
                  icon={<MapPin className="w-3.5 h-3.5" />}
                  label="Indirizzo"
                  filled={!missingSlots.includes("indirizzo dell'intervento")}
                />
                <SlotIndicator 
                  icon={<Wrench className="w-3.5 h-3.5" />}
                  label="Tipo"
                  filled={!missingSlots.includes('tipo di problema')}
                />
                <SlotIndicator 
                  icon={<FileText className="w-3.5 h-3.5" />}
                  label="Dettagli"
                  filled={!missingSlots.includes('descrizione del problema')}
                />
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* All data collected indicator */}
      {messages.length > 0 && missingSlots.length === 0 && !currentTicketId && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200/50 px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              Tutti i dati raccolti! Conferma per procedere con la richiesta.
            </span>
          </div>
        </div>
      )}

      {/* EMAIL CONFIRMATION SUCCESS BANNER - Shows only after email link click */}
      {showConfirmationSuccess && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 border-b border-green-600 px-4 py-6 text-white">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-white/20 rounded-xl flex-shrink-0">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-1">
                  ✅ Preventivo Confermato!
                </h3>
                <p className="text-green-100 text-sm">
                  La tua richiesta è stata inviata ai tecnici. Un tecnico ti <strong>chiamerà entro 30-60 minuti</strong> per confermare l&apos;appuntamento.
                </p>
                {confirmedTicketId && (
                  <p className="text-green-200 text-xs mt-2">
                    Ticket #{confirmedTicketId.toUpperCase()}
                  </p>
                )}
              </div>
              <button 
                onClick={() => setShowConfirmationSuccess(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
              >
                <span className="sr-only">Chiudi</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Created Success Banner */}
      {currentTicketId && !showConfirmationSuccess && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200/50 px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              Ticket #{currentTicketId.slice(-8).toUpperCase()} creato! Un tecnico ti contatterà a breve.
            </span>
          </div>
        </div>
      )}

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
                    <span>Chiamata in 60 min</span>
                  </div>
                </div>

              </div>
            </ClientAnimationWrapper>
          )}

          {/* Quick Actions */}
          {showQuickActions && messages.length === 0 && (
            <ClientAnimationWrapper delay={0.3} duration={0.5}>
              <div className="space-y-4">
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
                
                {/* Hint per altri servizi */}
                <div className="text-center pt-4">
                  <p className="text-sm text-slate-500 italic flex items-center justify-center gap-2">
                    <span>Per altri servizi o richieste specifiche, scrivi direttamente qui sotto</span>
                    <span className="text-lg">👇</span>
                  </p>
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
              onAcceptQuote={index === messages.length - 1 ? () => sendMessage('Sì, accetto il preventivo. Procediamo!') : undefined}
              onRejectQuote={index === messages.length - 1 ? () => sendMessage('No grazie, il preventivo non mi va bene.') : undefined}
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

      {/* Input Area - Mobile Optimized with safe-area-inset */}
      <div className="sticky bottom-0 w-full bg-white border-t border-slate-200 shadow-lg shadow-slate-200/20 pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          
          {/* Image Preview - shown when image is uploaded */}
          {uploadedImageUrl && (
            <div className="mb-3">
              <ImagePreview 
                url={uploadedImageUrl} 
                onRemove={() => setUploadedImageUrl(null)} 
              />
            </div>
          )}

          {/* Upload in progress indicator */}
          {isUploading && (
            <div className="mb-2 flex items-center gap-2 text-sm text-blue-600">
              <LoadingSpinner size="sm" />
              <span>Caricamento foto...</span>
            </div>
          )}

          {/* Input Row - Thumb-zone optimized */}
          <div className="flex items-end gap-2 sm:gap-3">
            
            {/* Image Upload Button - Larger tap target on mobile */}
            <div className="flex-shrink-0">
              <ImageUpload
                onUploadComplete={handleImageUploaded}
                onUploadStart={handleUploadStart}
                onError={handleUploadError}
                disabled={isLoading}
              />
            </div>

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
                className="w-full px-4 py-3.5 pr-14 bg-slate-100 border-0 rounded-2xl text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all resize-none min-h-[52px] max-h-[120px]"
                style={{ fontSize: '16px' }} // Prevents zoom on iOS
              />
              
              {/* Send Button - Larger tap target (44x44 min for mobile) */}
              <button
                onClick={handleSend}
                disabled={(!input.trim() && !uploadedImageUrl) || isLoading || isUploading}
                className="absolute right-1.5 bottom-1.5 w-11 h-11 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg shadow-blue-500/25 active:scale-95"
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" className="text-white" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Helper Text - hidden on mobile for cleaner UX */}
          <p className="hidden sm:block text-xs text-slate-400 text-center mt-3">
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
  onFormSubmit,
  onAcceptQuote,
  onRejectQuote
}: { 
  message: ChatMessage; 
  isLast: boolean;
  onConfirm?: () => void;
  onFormSubmit?: (data: Record<string, string>) => void;
  onAcceptQuote?: () => void;
  onRejectQuote?: () => void;
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
          // eslint-disable-next-line @next/next/no-img-element
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
            onAcceptQuote={onAcceptQuote}
            onRejectQuote={onRejectQuote}
          />
        )}
      </div>
    </div>
  );
}

// Slot Indicator Component for progress display
function SlotIndicator({ 
  icon, 
  label, 
  filled 
}: { 
  icon: React.ReactNode; 
  label: string; 
  filled: boolean;
}) {
  return (
    <div 
      className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
        filled 
          ? 'bg-green-100 text-green-700 border border-green-200' 
          : 'bg-slate-100 text-slate-400 border border-slate-200'
      }`}
      title={filled ? `${label}: ✓` : `${label}: da raccogliere`}
    >
      {filled ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
      ) : (
        icon
      )}
      <span className="hidden sm:inline">{label}</span>
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
