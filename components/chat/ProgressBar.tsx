// components/chat/ProgressBar.tsx
import clsx from 'clsx';
import { Check } from 'lucide-react';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
}

const Step = ({ index, label, currentStep }: { index: number; label: string; currentStep: number; }) => {
  const stepNumber = index + 1;
  const isCompleted = stepNumber < currentStep;
  const isActive = stepNumber === currentStep;

  return (
    <div className="flex flex-col items-center text-center">
      <div
        className={clsx(
          "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300",
          {
            "bg-primary border-primary text-primary-foreground": isCompleted,
            "border-primary text-primary": isActive,
            "border-border bg-card text-muted-foreground": !isActive && !isCompleted,
          }
        )}
      >
        {isCompleted ? <Check size={16} /> : <span>{stepNumber}</span>}
      </div>
      <p
        className={clsx("mt-2 text-xs font-medium transition-colors duration-300", {
          "text-foreground": isActive || isCompleted,
          "text-muted-foreground": !isActive && !isCompleted,
        })}
      >
        {label}
      </p>
    </div>
  );
};

export function ProgressBar({ currentStep, totalSteps, stepLabels }: ProgressBarProps) {
  return (
    <div className="p-4 pt-3 pb-4 border-b border-border bg-card/80 backdrop-blur-sm">
      <div className="flex justify-between items-start w-full max-w-sm mx-auto">
        {stepLabels.map((label, index) => (
          <div key={label} className="flex-1 flex items-start justify-center">
            {/* Linea di connessione */}
            {index > 0 && (
              <div className="w-full h-0.5 mt-4 -ml-px bg-border relative -z-10">
                 <div
                    className={clsx(
                        'h-full bg-primary transition-all duration-500',
                        { 'w-full': index + 1 <= currentStep, 'w-0': index + 1 > currentStep }
                    )}
                 />
              </div>
            )}
            
            <Step index={index} label={label} currentStep={currentStep} />
            
            {/* Linea di connessione */}
            {index < totalSteps - 1 && (
                 <div className="w-full h-0.5 mt-4 -mr-px bg-border relative -z-10">
                    <div
                        className={clsx(
                            'h-full bg-primary transition-all duration-500',
                            { 'w-full': index + 2 <= currentStep, 'w-0': index + 2 > currentStep }
                        )}
                    />
                 </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}