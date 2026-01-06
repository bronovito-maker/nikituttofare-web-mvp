// components/chat/CategoryGuide.tsx
// Componente che guida l'utente nella descrizione del problema dopo aver selezionato una categoria

'use client';

import { useState } from 'react';
import { CheckCircle2, Camera, MapPin, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface CategoryGuideProps {
  category: 'plumbing' | 'electric' | 'locksmith' | 'climate';
  categoryName: string;
  onStartChat: (initialMessage: string) => void;
  onSkip: () => void;
}

const categoryQuestions = {
  plumbing: [
    'Dove si trova il problema? (cucina, bagno, esterno)',
    'Cosa sta succedendo esattamente? (perdita, tubo rotto, scarico intasato)',
    'Quanto è urgente? (perdita grave, gocciolamento, solo intasamento)',
  ],
  electric: [
    'Quale area è interessata? (cucina, camera, esterno)',
    'Cosa non funziona? (luce spenta, presa non funziona, interruttore rotto)',
    'C\'è pericolo immediato? (scintille, odore di bruciato, salvavita scattato)',
  ],
  locksmith: [
    'Quale tipo di problema? (chiave persa, serratura rotta, porta bloccata)',
    'Dove si trova? (porta principale, cancello, finestra)',
    'Hai bisogno di accesso immediato? (sei chiuso fuori?)',
  ],
  climate: [
    'Quale sistema? (condizionatore, caldaia, riscaldamento)',
    'Cosa non funziona? (non si accende, non riscalda/raffredda, fa rumore)',
    'Da quanto tempo? (oggi, da giorni, da settimane)',
  ],
};

export function CategoryGuide({ category, categoryName, onStartChat, onSkip }: CategoryGuideProps) {
  const [answers, setAnswers] = useState<string[]>(['', '', '']);
  const [currentStep, setCurrentStep] = useState(0);
  const [photoAdded, setPhotoAdded] = useState(false);

  const questions = categoryQuestions[category];
  const allAnswered = answers.every(a => a.trim().length > 0);

  const handleAnswer = (value: string) => {
    const newAnswers = [...answers];
    newAnswers[currentStep] = value;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStart = () => {
    const description = `Ho bisogno di un ${categoryName.toLowerCase()}.\n\n${questions.map((q, i) => `${q}\n${answers[i] || 'Non specificato'}`).join('\n\n')}`;
    onStartChat(description);
  };

  return (
    <div className="flex-grow flex flex-col items-center p-4 sm:p-6 h-full overflow-y-auto">
      <Card className="w-full max-w-2xl shadow-lg bg-white">
        <CardHeader className="text-center pb-4 bg-white">
          <CardTitle className="text-xl sm:text-2xl text-gray-900 font-bold">
            Descrivi il problema con {categoryName}
          </CardTitle>
          <CardDescription className="text-sm sm:text-base text-gray-600">
            Ti guideremo con alcune domande semplici
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4 sm:space-y-6">
          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {questions.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-8 sm:w-12 rounded-full transition-all ${
                  index <= currentStep
                    ? 'bg-blue-600'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          {/* Current question */}
          <div className="space-y-4">
            <label className="block text-sm sm:text-base font-semibold text-gray-900">
              {questions[currentStep]}
            </label>
            <textarea
              value={answers[currentStep]}
              onChange={(e) => handleAnswer(e.target.value)}
              placeholder="Scrivi qui la tua risposta..."
              className="w-full min-h-[100px] sm:min-h-[120px] px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm sm:text-base text-gray-900 bg-white placeholder:text-gray-400"
              autoFocus
            />
          </div>

          {/* Photo upload hint */}
          {currentStep === questions.length - 1 && !photoAdded && (
            <div className="flex items-center gap-2 text-sm text-gray-700 bg-blue-50 border border-blue-200 p-3 rounded-lg">
              <Camera className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <span className="text-gray-800">Puoi aggiungere una foto del problema nella barra di input in basso</span>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={currentStep > 0 ? handleBack : onSkip}
              className="flex-1 sm:flex-initial border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              {currentStep > 0 ? 'Indietro' : 'Salta guida'}
            </Button>
            
            {currentStep < questions.length - 1 ? (
              <Button
                onClick={handleNext}
                disabled={!answers[currentStep].trim()}
                className="flex-1 sm:flex-initial bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Avanti
              </Button>
            ) : (
              <Button
                onClick={handleStart}
                disabled={!allAnswered}
                className="flex-1 sm:flex-initial bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Invia richiesta
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
