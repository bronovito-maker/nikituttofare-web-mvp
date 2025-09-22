// File: app/chat/page.tsx

'use client';

import ChatInterface from "@/components/chat/ChatInterface";
import { useChat } from "@/hooks/useChat";

export default function ChatPage() {
  const chat = useChat();

  return (
    <div className="h-screen flex flex-col">
      <ChatInterface
        input={chat.input}
        handleInputChange={chat.handleInputChange}
        handleSend={chat.handleSend}
        fileToUpload={chat.fileToUpload}
        setFileToUpload={chat.setFileToUpload}
        removeFile={chat.removeFile}
        previewUrl={chat.previewUrl}
        step={chat.step}
        messages={chat.messages}
        isLoading={chat.isLoading}
        formSummary={chat.formSummary}
        startChat={chat.startChat}
        finalTicketId={chat.finalTicketId}
        resetChat={chat.resetChat}
      />
    </div>
  );
}