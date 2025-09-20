// components/chat/ChatInterface.tsx
'use client';

import { useChat } from '@/hooks/useChat';
import { MessageInput } from './MessageInput';
import ChatBubble from '@/components/ChatBubble';
import Typing from '@/components/Typing';
import { ChatIntroScreen } from '@/components/chat/ChatIntroScreen';
import { useEffect, useRef } from 'react';
import { ProgressBar } from './ProgressBar'; // Importiamo il nuovo componente

export function ChatInterface() {
    // Aggiungiamo 'progressState' dalle proprietà restituite da useChat
    const { msgs, input, setInput, loading, handleSend, fileToUpload, previewUrl, handleFileSelect, removeFile, handleSuggestionClick, progressState } = useChat();
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [msgs]);

    return (
        <div className="w-full max-w-3xl mx-auto flex flex-col bg-background h-full shadow-lg border border-border rounded-t-xl">
            {/* Aggiungiamo la barra di progresso qui */}
            {msgs.length > 0 && (
                <ProgressBar
                    currentStep={progressState.current}
                    totalSteps={progressState.total}
                    stepLabels={progressState.labels}
                />
            )}
            
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {msgs.length === 0 ? (
                    <ChatIntroScreen onSuggestionClick={handleSuggestionClick} />
                ) : (
                    <>
                        {msgs.map(m => (
                            <ChatBubble key={m.id} role={m.role}>{m.content}</ChatBubble>
                        ))}
                    </>
                )}
                 {loading && msgs.length > 0 && (
                    <ChatBubble role="assistant"><Typing /></ChatBubble>
                )}
            </div>
            <MessageInput
                input={input}
                setInput={setInput}
                loading={loading}
                handleSend={handleSend}
                fileToUpload={fileToUpload}
                previewUrl={previewUrl}
                handleFileSelect={handleFileSelect}
                removeFile={removeFile}
            />
        </div>
    );
}