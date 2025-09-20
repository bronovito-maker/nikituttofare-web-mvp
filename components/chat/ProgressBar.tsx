// components/chat/ProgressBar.tsx
import clsx from 'clsx';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
}

export function ProgressBar({ currentStep, totalSteps, stepLabels }: ProgressBarProps) {
  const progressPercentage = Math.max(0, (currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="p-4 pt-3 pb-2 border-b border-border bg-card/80 backdrop-blur-sm">
      <div className="relative h-2 w-full bg-secondary rounded-full">
        <div
          className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
      <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
        {stepLabels.map((label, index) => (
          <span
            key={label}
            className={clsx(
              'transition-colors duration-500',
              { 'text-primary font-semibold': index + 1 <= currentStep }
            )}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}