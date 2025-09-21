// components/chat/ChatIntroScreen.tsx
import { Wrench, Lightbulb, Droplets, MoveRight, HelpCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface ChatIntroScreenProps {
  onSuggestionClick: (text: string) => void;
}

export function ChatIntroScreen({ onSuggestionClick }: ChatIntroScreenProps) {
  const suggestions = [
    { icon: <Droplets size={24} />, text: "Il rubinetto della cucina perde acqua" },
    { icon: <Lightbulb size={24} />, text: "Ho bisogno di installare un lampadario" },
    { icon: <Wrench size={24} />, text: "La tapparella si è bloccata" },
    { icon: <MoveRight size={24} />, text: "Devo spostare un mobile pesante" },
  ];

  const handleClick = (text: string) => {
    onSuggestionClick(text);
  };

  return (
    <div className="flex-grow flex flex-col justify-center items-center p-4 h-full">
        <div className="text-center">
            <Image src="/logo_ntf.png" alt="NikiTuttoFare Logo" width={64} height={64} className="rounded-xl mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-foreground">Come posso aiutarti?</h1>
            {/* --- SOTTOTITOLO MIGLIORATO --- */}
            <p className="mt-2 text-muted-foreground max-w-md mx-auto">
                Rispondi a poche domande per ricevere una stima gratuita e senza impegno in meno di un minuto.
            </p>
        </div>
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
        {/* --- LINK ALLE FAQ IN EVIDENZA --- */}
        <div className="mt-10 text-center">
            <Link href="/faq" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                <HelpCircle size={16} />
                <span>Domande Frequenti e Garanzie</span>
            </Link>
        </div>
    </div>
  );
}