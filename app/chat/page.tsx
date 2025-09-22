import ChatInterface from "@/components/chat/ChatInterface"; // Rimuovi le {} da qui

export default function ChatPage() {
  return (
    <div className="h-screen flex flex-col">
      <ChatInterface />
    </div>
  );
}