import ChatInterface from '@/components/chat/ChatInterface';
import { auth } from '@/auth';

type ChatPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ChatPage({ searchParams }: ChatPageProps) {
  const params = await searchParams;
  const session = await auth();
  const queryTenant = params?.t;
  const tenantId =
    (typeof queryTenant === 'string' && queryTenant.trim()) ||
    session?.user?.tenantId ||
    null;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24 bg-gray-100">
      <div className="w-full max-w-2xl h-[70vh] bg-white rounded-2xl shadow-xl overflow-hidden">
        <ChatInterface tenantId={tenantId} />
      </div>
    </main>
  );
}
