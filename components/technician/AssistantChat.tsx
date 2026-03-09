// components/technician/AssistantChat.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { MarkdownRenderer } from '../ui/markdown-renderer';

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
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const hasInitialized = useRef(false);

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

    const startVoiceInput = () => {
        // @ts-ignore
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Il tuo browser o dispositivo non supporta il riconoscimento vocale.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'it-IT';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setIsRecording(true);
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            if (transcript) {
                setInput(transcript);
            }
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            setIsRecording(false);
            if (event.error === 'not-allowed') {
                alert("Permesso microfono negato. Controlla le impostazioni dell'app.");
            }
        };

        recognition.onend = () => {
            setIsRecording(false);
        };

        try {
            recognition.start();
        } catch (e) {
            console.error('Speech recognition start failed:', e);
            setIsRecording(false);
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
        <div className={`flex flex-col transition-all duration-300 ease-in-out bg-slate-900/50 border border-slate-800 overflow-hidden backdrop-blur-xl
            ${isExpanded
                ? 'fixed inset-0 z-[100] rounded-none md:inset-4 md:rounded-3xl shadow-2xl'
                : 'h-[500px] rounded-3xl relative'
            }`}>

            {/* Header */}
            <div className="p-4 border-b border-slate-800 bg-slate-800/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-xl shadow-lg shadow-blue-500/20">
                        🤖
                    </div>
                    <div>
                        <h3 className="font-bold text-sm">Niki Assistant</h3>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Online</span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 group"
                    title={isExpanded ? "Rimpicciolisci" : "Tutto schermo"}
                >
                    {isExpanded ? (
                        <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-400">
                            Chiudi
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3" /><path d="M21 8h-3a2 2 0 0 1-2-2V3" /><path d="M3 16h3a2 2 0 0 1 2 2v3" /><path d="M16 21v-3a2 2 0 0 1 2-2h3" /></svg>
                        </span>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform"><path d="M15 3h6v6" /><path d="M9 21H3v-6" /><path d="M21 3l-7 7" /><path d="M3 21l7-7" /></svg>
                    )}
                </button>
            </div>

            {/* Messages Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide bg-gradient-to-b from-transparent to-slate-900/20"
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
            <div className="p-4 bg-slate-800/30 border-t border-slate-800 pb-safe shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.5)]">
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
