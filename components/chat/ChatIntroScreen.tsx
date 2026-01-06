// components/chat/ChatIntroScreen.tsx
'use client';

import { Droplet, Zap, Key, Wind, Wrench, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface ChatIntroScreenProps {
  onCategorySelect: (category: 'plumbing' | 'electric' | 'locksmith' | 'climate') => void;
  businessName?: string;
}

interface EmergencyCategory {
  id: 'plumbing' | 'electric' | 'locksmith' | 'climate';
  name: string;
  icon: React.ReactNode;
  description: string;
  color: string;
  bgColor: string;
  hoverColor: string;
}

const categories: EmergencyCategory[] = [
  {
    id: 'plumbing',
    name: 'Idraulico',
    icon: <Droplet className="w-8 h-8" />,
    description: 'Perdite d\'acqua, tubi rotti, scarichi intasati',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    hoverColor: 'hover:bg-blue-100',
  },
  {
    id: 'electric',
    name: 'Elettricista',
    icon: <Zap className="w-8 h-8" />,
    description: 'Interruttori, prese, problemi elettrici',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    hoverColor: 'hover:bg-yellow-100',
  },
  {
    id: 'locksmith',
    name: 'Fabbro',
    icon: <Key className="w-8 h-8" />,
    description: 'Serrature, chiavi perse, porte bloccate',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    hoverColor: 'hover:bg-orange-100',
  },
  {
    id: 'climate',
    name: 'Clima',
    icon: <Wind className="w-8 h-8" />,
    description: 'Condizionatori, caldaie, riscaldamento',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    hoverColor: 'hover:bg-cyan-100',
  },
];

export function ChatIntroScreen({ onCategorySelect, businessName = "NikiTuttoFare" }: ChatIntroScreenProps) {
  return (
    <div className="flex-grow flex flex-col items-center p-4 sm:p-6 md:p-8 h-full overflow-y-auto text-center">
      <div className="w-full max-w-4xl">
        {/* Logo/Icona */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 shadow-lg mx-auto">
          <Wrench className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
        </div>
        
        {/* Titolo e sottotitolo */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 px-4">
          {businessName}
        </h1>
        <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-md mx-auto mb-6 sm:mb-8 px-4">
          Seleziona il tipo di emergenza per iniziare. Ti guideremo passo passo.
        </p>
        
        {/* Card di Primo Soccorso */}
        <div className="w-full">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">
            Quale tipo di assistenza ti serve?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
            {categories.map((category) => (
              <Card
                key={category.id}
                className={`${category.bgColor} ${category.hoverColor} border-2 border-transparent hover:border-gray-300 cursor-pointer transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-md`}
                onClick={() => onCategorySelect(category.id)}
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className={`${category.color} flex-shrink-0`}>
                      {category.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center justify-between">
                        <h3 className={`text-lg sm:text-xl font-bold ${category.color} mb-1 sm:mb-2`}>
                          {category.name}
                        </h3>
                        <ArrowRight className={`${category.color} w-5 h-5 flex-shrink-0`} />
                      </div>
                      <p className="text-xs sm:text-sm text-gray-700 font-medium">
                        {category.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Messaggio rassicurante */}
          <p className="mt-4 sm:mt-6 text-xs sm:text-sm text-gray-600 px-4 pb-4">
            💡 <strong>Suggerimento:</strong> Puoi anche descrivere il problema liberamente nella barra di input
          </p>
        </div>
      </div>
    </div>
  );
}
