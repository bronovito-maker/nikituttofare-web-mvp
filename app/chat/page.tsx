// app/chat/page.tsx
import { auth } from '@/auth';
import ChatInterface from '@/components/chat/ChatInterface';
import { redirect } from 'next/navigation';
import Balancer from 'react-wrap-balancer';
import { getAssistantConfig } from '@/lib/prompt-builder';
import type { AssistantConfig } from '@/lib/types';

export default async function ChatPage() {
  const session = await auth();

  if (!session?.user?.tenantId) {
    redirect('/login');
  }

  let assistantConfig: AssistantConfig | null = null;
  try {
    assistantConfig = await getAssistantConfig(session.user.tenantId);
  } catch (error) {
    console.error('Errore nel recuperare la configurazione dell\'assistente:', error);
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-100 via-white to-cyan-100 p-4">
      <div className="w-full max-w-2xl h-[80vh] min-h-[500px] flex flex-col">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
          <Balancer>{assistantConfig?.name || 'Assistente Virtuale'}</Balancer>
        </h1>
        <div className="flex-grow overflow-hidden border bg-white rounded-lg shadow-xl">
          <ChatInterface
            assistantConfig={assistantConfig}
            widgetColor={assistantConfig?.widget_color}
          />
        </div>
      </div>
    </div>
  );
}
