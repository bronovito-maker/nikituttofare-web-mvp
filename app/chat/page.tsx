// app/chat/page.tsx
import { auth } from '@/auth'; // Adjust the import path as necessary
import ChatInterface from '@/components/chat/ChatInterface';
import { redirect } from 'next/navigation';
import Balancer from 'react-wrap-balancer';

// --- MODIFICATO: Rendi la funzione async ---
export default async function ChatPage() {
  // --- MODIFICATO: Usa await ---
  const session = await auth();

  // Se non c'è sessione, reindirizza al login
  if (!session) {
    redirect('/login');
  }

  // Se c'è la sessione, mostra l'interfaccia chat
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-100 via-white to-cyan-100 p-4">
       <div className="w-full max-w-2xl h-[70vh] min-h-[500px]">
         <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
           <Balancer>Assistente Virtuale</Balancer>
         </h1>
         <ChatInterface />
       </div>
     </div>
  );
}
