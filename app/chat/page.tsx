import ChatInterface from '@/components/chat/ChatInterface';

export default function ChatPage() {
  // --- PUNTO DI CONTROLLO CENTRALE ---
  // Qui decidiamo quale assistente caricare.
  // In futuro, questo ID potrebbe essere letto dall'URL o da una configurazione.
  const idAssistenteDaCaricare = 'ristorante-la-perla';

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24 bg-gray-100">
      <div className="w-full max-w-2xl h-[70vh] bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Passiamo l'ID scelto all'interfaccia della chat */}
        <ChatInterface tenantId={idAssistenteDaCaricare} />
      </div>
    </main>
  );
}