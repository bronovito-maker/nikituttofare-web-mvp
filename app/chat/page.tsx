// app/chat/page.tsx
import { ChatInterface } from "@/components/chat/ChatInterface";

export default function ChatPage() {
    return (
        <main className="flex-1 container mx-auto p-0 flex flex-col min-h-0">
            <ChatInterface />
        </main>
    );
}