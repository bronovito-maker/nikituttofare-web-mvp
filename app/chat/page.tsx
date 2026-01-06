// app/chat/page.tsx
import { auth } from '@/auth';
import ChatInterface from '@/components/chat/ChatInterface';
import { redirect } from 'next/navigation';
import Balancer from 'react-wrap-balancer';
import { getAssistantConfig } from '@/lib/prompt-builder';
import type { AssistantConfig } from '@/lib/types';

export default async function ChatPage() {
  const session = await auth();

  // Controlla prima se l'utente è autenticato
  if (!session?.user) {
    redirect('/login');
  }

  // Usa tenantId dalla sessione o un default per sviluppo
  const tenantId = session.user.tenantId || '1';

  let assistantConfig: AssistantConfig | null = null;
  try {
    assistantConfig = await getAssistantConfig(tenantId);
  } catch (error) {
    console.error('Errore nel recuperare la configurazione dell\'assistente:', error);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] sm:h-[calc(100vh-5rem)] md:h-[calc(100vh-4rem)]">
      <div className="flex-grow overflow-hidden bg-white">
        <ChatInterface
          assistantConfig={assistantConfig}
          widgetColor={assistantConfig?.widget_color}
        />
      </div>
    </div>
  );
}
