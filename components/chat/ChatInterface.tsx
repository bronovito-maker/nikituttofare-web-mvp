// components/chat/ChatInterface.tsx
'use client';

import { useChat } from '@/hooks/useChat';
import { MessageInput } from './MessageInput';
import ChatBubble from '@/components/ChatBubble';
import { ChatIntroScreen } from '@/components/chat/ChatIntroScreen';
import { useEffect, useRef } from 'react';
import { ProgressBar } from './ProgressBar';
import Typing from '../Typing'; // Corretto import, Typing è fuori dalla cartella chat

export function ChatInterface() {
    const { msgs, input, setInput, loading, handleSend, fileToUpload, previewUrl, handleFileSelect, removeFile, handleSuggestionClick, progressState } = useChat();
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [msgs, loading]);

    return (
        <div className="w-full max-w-3xl mx-auto flex flex-col bg-background h-full shadow-lg border-t sm:border-x border-border rounded-t-xl">
            {/* La ProgressBar ora viene chiamata senza la proprietà 'totalSteps' */}
            {msgs.length > 0 && (
                <ProgressBar
                    currentStep={progressState.current}
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
                 {/* L'indicatore di "sta scrivendo" ora appare correttamente dopo l'ultimo messaggio */}
                 {loading && msgs.length > 0 && msgs[msgs.length - 1].role === 'user' && (
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