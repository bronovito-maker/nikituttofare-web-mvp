// components/chat/ProgressBar.tsx
import clsx from 'clsx';

interface ProgressBarProps {
  currentStep: number;
  stepLabels: string[];
}

export function ProgressBar({ currentStep, stepLabels }: ProgressBarProps) {
  return (
    <div className="p-4 pt-3 pb-4 border-b border-border bg-card/80 backdrop-blur-sm">
      <div className="w-full max-w-sm mx-auto">
        {/* Barre di Progressione */}
        <div className="flex w-full gap-1.5 h-1.5 mb-2">
          {stepLabels.map((_, index) => {
            const stepNumber = index + 1;
            // La barra è attiva se il passo corrente è uguale o maggiore
            const isActive = stepNumber <= currentStep;
            return (
              <div
                key={index}
                className={clsx(
                  "flex-1 h-full rounded-full transition-colors duration-500 ease-out",
                  isActive ? "bg-primary" : "bg-secondary"
                )}
              />
            );
          })}
        </div>

        {/* Etichette degli Step */}
        <div className="flex justify-between w-full">
          {stepLabels.map((label, index) => {
            const stepNumber = index + 1;
            const isActive = stepNumber === currentStep;
            const isCompleted = stepNumber < currentStep;
            return (
              <p
                key={label}
                className={clsx(
                  "text-xs font-medium transition-colors duration-300",
                  {
                    "text-foreground font-bold": isActive, // Fase attuale
                    "text-muted-foreground": !isActive && !isCompleted, // Fasi future
                    "text-primary": isCompleted, // Fasi completate
                  }
                )}
              >
                {label}
              </p>
            );
          })}
        </div>
      </div>
    </div>
  );
}