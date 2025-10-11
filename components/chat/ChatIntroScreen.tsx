// components/chat/ChatIntroScreen.tsx
import { BookOpen, Clock, HelpCircle, MessageSquare } from 'lucide-react';
import Link from 'next/link';

interface ChatIntroScreenProps {
  // NOTA: La prop si chiama `onSuggestionClick` nel tuo componente. La manteniamo.
  onSuggestionClick: (text: string) => void;
  // Aggiungiamo il nome dell'attività per personalizzare il benvenuto
  businessName?: string; 
}

// Abbiamo aggiornato il componente per accettare il nuovo businessName
export function ChatIntroScreen({ onSuggestionClick, businessName = "Assistente Virtuale" }: ChatIntroScreenProps) {
  
  // Suggerimenti di conversazione più generici
  const suggestions = [
    { icon: <BookOpen size={24} />, text: "Posso vedere il menu?" },
    { icon: <Clock size={24} />, text: "Quali sono i vostri orari di apertura?" },
    { icon: <MessageSquare size={24} />, text: "Vorrei prenotare un tavolo" },
    { icon: <HelpCircle size={24} />, text: "Ho una richiesta particolare" },
  ];

  const handleClick = (text: string) => {
    onSuggestionClick(text);
  };

  return (
    <div className="flex-grow flex flex-col justify-center items-center p-4 h-full text-center">
        {/* Usiamo un'icona generica al posto del logo */}
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4">
            <MessageSquare size={32} />
        </div>
        
        {/* Titolo e sottotitolo aggiornati */}
        <h1 className="text-3xl font-bold text-foreground">
          {businessName}
        </h1>
        <p className="mt-2 text-muted-foreground max-w-md mx-auto">
            Sono qui per aiutarti. Seleziona un&apos;opzione o scrivi la tua richiesta.
        </p>
        
        {/* Griglia con i nuovi suggerimenti */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
            {suggestions.map(({ icon, text }) => (
                <button 
                  key={text} 
                  onClick={() => handleClick(text)} 
                  className="p-4 bg-card border border-border rounded-lg text-left flex items-center gap-4 transition-all duration-200 group hover:border-primary/50 hover:bg-secondary"
                >
                    <div className="text-primary">{icon}</div>
                    <span className="text-card-foreground group-hover:text-foreground">{text}</span>
                </button>
            ))}
        </div>
    </div>
  );
}
