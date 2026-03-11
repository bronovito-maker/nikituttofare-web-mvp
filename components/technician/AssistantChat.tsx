// components/technician/AssistantChat.tsx
'use client';

import { useState, useRef, useEffect, memo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { MarkdownRenderer } from '../ui/markdown-renderer';
import { X, Image as ImageIcon, Send, Mic, Trash2 } from 'lucide-react';
import { App } from '@capacitor/app';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import { Keyboard } from '@capacitor/keyboard';
import { getChatHistory } from '@/app/actions/technician-actions';
import Image from 'next/image';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    image_url?: string;
    isHidden?: boolean;
}

interface AssistantChatProps {
    ticketId: string;
}

// Memoized individual message component
const MessageItem = memo(({ message, onProductAdd }: { 
    message: Message, 
    onProductAdd: (p: any) => void 
}) => {
    if (message.isHidden) return null;
    
    return (
        <div className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[90%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                message.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                }`}>
                {message.image_url && (
                    <div className="relative w-full aspect-video mb-2 rounded-lg overflow-hidden bg-black/20">
                        <Image 
                            src={message.image_url} 
                            alt="Uploaded photo" 
                            fill 
                            className="object-cover"
                            unoptimized
                        />
                    </div>
                )}
                {message.role === 'assistant' ? (
                    <MarkdownRenderer 
                        content={message.content} 
                        onProductAdd={onProductAdd}
                    />
                ) : (
                    message.content
                )}
            </div>
        </div>
    );
});

MessageItem.displayName = 'MessageItem';

// Separate Header component to keep main render clean
const ChatHeader = memo(({ isExpanded, onToggleExpand }: { isExpanded: boolean, onToggleExpand: () => void }) => (
    <div className="sticky top-0 z-20 px-6 py-4 border-b border-white/5 bg-background/80 backdrop-blur-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-xl shadow-lg shadow-indigo-500/20">
                🤖
            </div>
            <div>
                <h3 className="font-bold text-sm tracking-tight">Niki Assistant</h3>
                <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">Active Now</span>
                </div>
            </div>
        </div>
        <button
            onClick={onToggleExpand}
            className={cn(
                "flex items-center justify-center h-10 w-10 transition-all rounded-xl border border-white/5",
                isExpanded ? "bg-red-500/10 text-red-500 hover:bg-red-500/20" : "bg-accent/5 hover:bg-accent/10 text-muted-foreground"
            )}
        >
            {isExpanded ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6" /><path d="M9 21H3v-6" /><path d="M21 3l-7 7" /><path d="M3 21l7-7" /></svg>
            )}
        </button>
    </div>
));
ChatHeader.displayName = 'ChatHeader';

// The Input area in a separate component to isolate its local state (input) from the expensive message list
const ChatInput = memo(({ onSend, isExpanded, loading }: { 
    onSend: (msg: string, img?: string) => void,
    isExpanded: boolean,
    loading: boolean
}) => {
    const [input, setInput] = useState('');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const isRecordingRef = useRef(false);

    useEffect(() => {
        if (!isExpanded) return;
        const isNative = typeof window !== 'undefined' && (window as any).Capacitor?.getPlatform() !== 'web';
        let kShowListener: any, kHideListener: any;
        if (isNative) {
            kShowListener = Keyboard.addListener('keyboardWillShow', (info) => setKeyboardHeight(info.keyboardHeight));
            kHideListener = Keyboard.addListener('keyboardWillHide', () => setKeyboardHeight(0));
        }
        return () => {
            if (kShowListener) kShowListener.then((l: any) => l.remove());
            if (kHideListener) kHideListener.then((l: any) => l.remove());
        };
    }, [isExpanded]);

    const handleSend = () => {
        if ((!input.trim() && !selectedImage) || loading) return;
        onSend(input, selectedImage || undefined);
        setInput('');
        setSelectedImage(null);
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
    };

    const startVoiceInput = async () => {
        if (isRecordingRef.current) {
            setIsRecording(false);
            isRecordingRef.current = false;
            // Native stop logic...
            return;
        }
        
        const isNative = typeof window !== 'undefined' && (window as any).Capacitor?.getPlatform() !== 'web';
        if (!isNative) {
            // Web Fallback
            const SpeechRecog = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
            if (!SpeechRecog) return;
            const rec = new SpeechRecog();
            rec.lang = 'it-IT';
            rec.onstart = () => { setIsRecording(true); isRecordingRef.current = true; };
            rec.onresult = (e: any) => setInput(e.results[0][0].transcript);
            rec.onend = () => { setIsRecording(false); isRecordingRef.current = false; };
            rec.start();
        } else {
            // Native logic simplified for brevity here, normally we call SpeechRecognition plugin
            setIsRecording(true); isRecordingRef.current = true;
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setSelectedImage(reader.result as string);
            reader.readAsDataURL(file);
        }
        // Reset file input to allow picking same image again if needed
        e.target.value = '';
    };

    return (
        <div className="p-4 bg-slate-800/30 border-t border-slate-800 pb-safe shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.5)]"
             style={{ paddingBottom: isExpanded ? `${keyboardHeight}px` : undefined }}>
            
            {/* Image Preview Area */}
            {selectedImage && (
                <div className="mb-3 relative inline-block group">
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-blue-500 shadow-lg">
                        <Image src={selectedImage} alt="Preview" fill className="object-cover" unoptimized />
                    </div>
                    <button 
                        onClick={() => setSelectedImage(null)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600 transition-colors"
                    >
                        <Trash2 className="w-3 h-3" />
                    </button>
                </div>
            )}

            <div className="flex items-center gap-2">
                <button 
                    onClick={() => fileInputRef.current?.click()} 
                    className={cn(
                        "p-3 rounded-xl transition-all",
                        selectedImage ? "bg-blue-600/20 text-blue-400" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                    )}
                >
                    <ImageIcon className="w-5 h-5" />
                </button>
                <button 
                    onClick={startVoiceInput} 
                    className={cn(
                        "p-3 rounded-xl transition-all",
                        isRecording ? "bg-red-500 text-white animate-pulse" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                    )}
                >
                    <Mic className="w-5 h-5" />
                </button>
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => {
                        setInput(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = `${e.target.scrollHeight}px`;
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder={selectedImage ? "Aggiungi una descrizione..." : "Chiedi a Niki..."}
                    rows={1}
                    className="flex-1 bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white resize-none max-h-32 overflow-y-auto"
                />
                <button
                    onClick={handleSend}
                    disabled={(!input.trim() && !selectedImage) || loading}
                    className={cn(
                        "p-3 rounded-xl font-bold transition-all self-end",
                        (!input.trim() && !selectedImage) || loading 
                            ? "bg-slate-800 text-slate-600" 
                            : "bg-blue-600 text-white shadow-lg shadow-blue-500/20 active:scale-95 hover:bg-blue-500"
                    )}
                >
                    <Send className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
});
ChatInput.displayName = 'ChatInput';

export default function AssistantChat({ ticketId }: AssistantChatProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const hasInitialized = useRef(false);

    useEffect(() => {
        const initChat = async () => {
            if (hasInitialized.current) return;
            hasInitialized.current = true;
            try {
                const history = await getChatHistory(ticketId);
                if (history && history.length > 0) {
                    setMessages(history.map(m => ({ 
                        role: m.role as 'user' | 'assistant', 
                        content: m.content,
                        image_url: (m as any).image_url // Ensure persisted images are loaded if available in schema
                    })));
                } else {
                    sendMessage("[SYSTEM_INIT] Analizza il lavoro e l'inventario...", undefined, true);
                }
            } catch (err) { console.error('Initial history load failed:', err); }
        };
        initChat();
    }, [ticketId]);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages, isTyping]);

    const sendMessage = useCallback(async (message: string, image?: string, isHidden: boolean = false) => {
        if (!message && !image) return;
        const userMsg: Message = { 
            role: 'user', 
            content: message || 'Inviata una foto', 
            image_url: image,
            isHidden 
        };
        setMessages(prev => [...prev, userMsg]);
        
        setLoading(true);
        setIsTyping(true);

        try {
            const res = await fetch('/api/technician/assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ticketId,
                    message,
                    image,
                    history: messages.filter(m => !m.isHidden).slice(-10)
                })
            });
            const data = await res.json();
            if (data.content) {
                setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
            } else if (data.error) {
                setMessages(prev => [...prev, { 
                    role: 'assistant', 
                    content: `⚠️ Errore assistente: ${data.error}. Per favore riprova.` 
                }]);
            } else {
                setMessages(prev => [...prev, { 
                    role: 'assistant', 
                    content: "⚠️ Non ho ricevuto una risposta valida. Potrebbe esserci un sovraccarico, riprova tra poco." 
                }]);
            }
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: '❌ Errore di connessione. Verifica la rete e riprova.' 
            }]);
        } finally {
            setLoading(false);
            setIsTyping(false);
        }
    }, [ticketId, messages]);

    const handleProductAdd = useCallback((product: any) => {
        const msg = `Aggiungi questo prodotto: ${product.nome} (SKU: ${product.sku || 'N/A'})`;
        sendMessage(msg); 
    }, [sendMessage]);

    useEffect(() => {
        if (isExpanded) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isExpanded]);

    return (
        <div className={cn(
            "flex flex-col transition-all duration-500 bg-background border border-white/10 overflow-hidden shadow-2xl",
            isExpanded ? 'fixed inset-0 z-[10002] rounded-none' : 'h-[500px] rounded-[2.5rem] relative'
        )}>
            <ChatHeader isExpanded={isExpanded} onToggleExpand={() => setIsExpanded(!isExpanded)} />
            
            <div 
                ref={scrollRef} 
                className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide bg-gradient-to-b from-accent/5 to-transparent overscroll-contain"
            >
                {messages.filter(m => !m.isHidden).length === 0 && !isTyping && (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-50"><p>Ciao tecnico! Sto analizzando...</p></div>
                )}
                {messages.map((m, i) => (
                    <MessageItem key={`${i}-${m.role}`} message={m} onProductAdd={handleProductAdd} />
                ))}

                {isTyping && (
                    <div className="flex justify-start animate-in fade-in slide-in-from-left-4 duration-300">
                        <div className="bg-slate-800 border border-slate-700 p-4 rounded-2xl rounded-tl-none flex gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce"></span>
                        </div>
                    </div>
                )}
            </div>

            <ChatInput onSend={sendMessage} isExpanded={isExpanded} loading={loading} />
        </div>
    );
}
