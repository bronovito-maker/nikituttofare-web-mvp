// File: app/chat/page.tsx

'use client';

import ChatInterface from "@/components/chat/ChatInterface";
import { useChat } from "@/hooks/useChat";

export default function ChatPage() {
  const chat = useChat();

  return (
    <main className="flex-grow flex flex-col h-[calc(100dvh-4rem)]">
      <ChatInterface
        messages={chat.messages}
        input={chat.input}
        handleInputChange={chat.handleInputChange}
        handleSend={chat.handleSend}
        isLoading={chat.isLoading}
        step={chat.step}
        formState={chat.formState}
        startChat={chat.startChat}
        resetChat={chat.resetChat}
        isScriptedFlowActive={chat.isScriptedFlowActive}
        // Proprietà per il caricamento file
        fileToUpload={chat.fileToUpload}
        setFileToUpload={chat.setFileToUpload}
        removeFile={chat.removeFile}
        previewUrl={chat.previewUrl}
      />
    </main>
  );
}