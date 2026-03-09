// components/technician/AssistantChat.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { MarkdownRenderer } from '../ui/markdown-renderer';
import { App } from '@capacitor/app';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import { Keyboard } from '@capacitor/keyboard';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    isHidden?: boolean;
}

interface AssistantChatProps {
    ticketId: string;
}

export default function AssistantChat({ ticketId }: AssistantChatProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const hasInitialized = useRef(false);
    const isRecordingRef = useRef(false);
    const autoStopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const speechListenersRef = useRef<Array<{ remove: () => Promise<void> }>>([]);

    const setRecordingState = (next: boolean) => {
        isRecordingRef.current = next;
        setIsRecording(next);
    };

    const cleanupSpeechListeners = async () => {
        for (const listener of speechListenersRef.current) {
            try {
                await listener.remove();
            } catch {
                // no-op
            }
        }
        speechListenersRef.current = [];
    };

    const clearAutoStopTimeout = () => {
        if (autoStopTimeoutRef.current) {
            clearTimeout(autoStopTimeoutRef.current);
            autoStopTimeoutRef.current = null;
        }
    };

    useEffect(() => {
        if (!hasInitialized.current) {
            hasInitialized.current = true;
            const initMsg = "[SYSTEM_INIT] Analizza il lavoro e l'inventario. Deduci logicaemente se per questo tipo di intervento servono materiali di consumo che al momento risultano assenti (quantità a 0) nel mio inventario. Se mancano, usa IMMEDIATAMENTE il tool 'cerca_materiale_tecnomat' per cercarne disponibilità e prezzi, poi scrivi un messaggio al tecnico per salutarlo, informarlo della mancanza, e dirgli a quale corsia di Tecnomat può trovare il pezzo e a che prezzo. Se non manca nulla o non sai, saluta semplicemente mettendoti a disposizione.";
            sendMessage(initMsg, undefined, true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    useEffect(() => {
        return () => {
            clearAutoStopTimeout();
            cleanupSpeechListeners();
        };
    }, []);

    // Body scroll lock, Keyboard & Capacitor Back Button
    useEffect(() => {
        if (isExpanded) {
            document.body.style.overflow = 'hidden';

            // Listen for Capacitor back button
            const backListener = App.addListener('backButton', () => {
                setIsExpanded(false);
            });

            // Handle Keyboard for layout stability
            const kShowListener = Keyboard.addListener('keyboardWillShow', (info: any) => {
                setKeyboardHeight(info.keyboardHeight);
            });
            const kHideListener = Keyboard.addListener('keyboardWillHide', () => {
                setKeyboardHeight(0);
            });

            return () => {
                document.body.style.overflow = 'unset';
                backListener.then(l => l.remove());
                kShowListener.then(l => l.remove());
                kHideListener.then(l => l.remove());
            };
        } else {
            document.body.style.overflow = 'unset';
            setKeyboardHeight(0);
        }
    }, [isExpanded]);

    const sendMessage = async (message: string, image?: string, isHidden: boolean = false) => {
        if (!message && !image) return;

        const userMsg: Message = { role: 'user', content: message || 'Inviata una foto per analisi', isHidden };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);
        setIsTyping(true);

        try {
            const res = await fetch('/api/technician/assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ticketId,
                    message: message,
                    image,
                    history: messages.slice(-5)
                })
            });

            const data = await res.json();
            if (data.content) {
                setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
            }
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: 'Spiacente, si è verificato un errore di connessione con Niki AI.' }]);
        } finally {
            setLoading(false);
            setIsTyping(false);
        }
    };

    const stopVoiceInput = async () => {
        clearAutoStopTimeout();
        try {
            await SpeechRecognition.stop();
        } catch (e) {
            console.error('Stop failed:', e);
        } finally {
            await cleanupSpeechListeners();
            setRecordingState(false);
        }
    };

    const startVoiceInput = async () => {
        if (isRecordingRef.current) {
            await stopVoiceInput();
            return;
        }

        try {
            const hasPermission = await SpeechRecognition.checkPermissions();
            if (hasPermission.speechRecognition !== 'granted') {
                const requested = await SpeechRecognition.requestPermissions();
                if (requested.speechRecognition !== 'granted') {
                    alert("Permesso microfono negato. Controlla le impostazioni dell'app.");
                    return;
                }
            }

            const isAvailable = await SpeechRecognition.available();
            if (!isAvailable) {
                alert("Il riconoscimento vocale non è disponibile su questo dispositivo.");
                return;
            }

            // Cleanup any existing listeners before starting (defensive)
            try {
                await (SpeechRecognition as any).removeAllListeners();
            } catch (e) { }
            await cleanupSpeechListeners();

            // Add listeners for robust state management
            const partialListener = await (SpeechRecognition as any).addListener('partialResults', (data: any) => {
                if (data.matches && data.matches.length > 0) {
                    setInput(data.matches[0]);
                }
            });
            speechListenersRef.current.push(partialListener);

            const listeningStateListener = await (SpeechRecognition as any).addListener('listeningState', (data: any) => {
                if (data.status === 'started' || data.status === 'listening') {
                    setRecordingState(true);
                    return;
                }
                if (data.status === 'stopped' || data.status === 'inactive') {
                    clearAutoStopTimeout();
                    setRecordingState(false);
                }
            });
            speechListenersRef.current.push(listeningStateListener);

            const errorListener = await (SpeechRecognition as any).addListener('error', (err: any) => {
                console.error('SpeechRecognition error event:', err);
                clearAutoStopTimeout();
                setRecordingState(false);
            });
            speechListenersRef.current.push(errorListener);

            setRecordingState(true);

            await SpeechRecognition.start({
                language: 'it-IT',
                partialResults: true,
                popup: false,
            });

            // Auto-stop safety timeout
            clearAutoStopTimeout();
            autoStopTimeoutRef.current = setTimeout(async () => {
                if (isRecordingRef.current) {
                    await stopVoiceInput();
                }
            }, 15000);

        } catch (error) {
            console.error('Voice input failed:', error);
            clearAutoStopTimeout();
            await cleanupSpeechListeners();
            setRecordingState(false);
            alert("Errore nell'avvio del microfono. Riprova.");
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                sendMessage('', base64String);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className={cn(
            "flex flex-col transition-all duration-500 ease-in-out bg-background border border-white/10 overflow-hidden shadow-2xl",
            isExpanded
                ? 'fixed inset-0 z-[10002] rounded-none pt-[env(safe-area-inset-top,20px)] pb-[env(safe-area-inset-bottom,20px)]'
                : 'h-[500px] rounded-[2.5rem] relative'
        )}>

            {/* Header */}
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

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
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
            </div>

            {/* Messages Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide bg-gradient-to-b from-accent/5 to-transparent pt-8 overscroll-contain"
            >
                {messages.filter(m => !m.isHidden).length === 0 && !isTyping && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8">
                        <div className="text-4xl mb-4 opacity-50">🛠️</div>
                        <p className="text-slate-400 text-sm">Ciao tecnico! Sono Niki. Sto controllando il tuo inventario per questo intervento...</p>
                    </div>
                )}

                {messages.map((m, i) => {
                    if (m.isHidden) return null;
                    return (
                        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[90%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${m.role === 'user'
                                ? 'bg-blue-600 text-white rounded-tr-none'
                                : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                                }`}>
                                {m.role === 'assistant' ? (
                                    <MarkdownRenderer content={m.content} />
                                ) : (
                                    m.content
                                )}
                            </div>
                        </div>
                    );
                })}

                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-slate-800 p-4 rounded-2xl rounded-tl-none border border-slate-700 flex gap-1 items-center">
                            <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div
                className="p-4 bg-slate-800/30 border-t border-slate-800 pb-safe shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.5)]"
                style={{ paddingBottom: isExpanded ? `${keyboardHeight}px` : undefined }}
            >
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-3 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors text-slate-400 hover:text-white"
                        title="Carica Foto"
                    >
                        📸
                    </button>
                    <button
                        onClick={startVoiceInput}
                        className={`p-3 rounded-xl transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                        title="Dettato Vocale"
                    >
                        {isRecording ? '🔴' : '🎙️'}
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/*"
                        className="hidden"
                    />
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
                        placeholder="Chiedi a Niki..."
                        className="flex-1 bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white"
                    />
                    <button
                        onClick={() => sendMessage(input)}
                        disabled={!input || loading}
                        className={`p-3 rounded-xl font-bold transition-all ${!input || loading ? 'bg-slate-800 text-slate-600' : 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 active:scale-95'
                            }`}
                    >
                        🚀
                    </button>
                </div>
            </div>
        </div>
    );
}
