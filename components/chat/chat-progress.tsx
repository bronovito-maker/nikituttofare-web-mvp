'use client';

interface ChatProgressProps {
    readonly step: number;
    readonly totalSteps?: number;
}

const STEPS = [
    { label: 'Problema', description: 'Descrivi cosa non va' },
    { label: 'Dettagli', description: 'Foto e informazioni' },
    { label: 'Contatto', description: 'Come raggiungerti' },
];

export function ChatProgress({ step, totalSteps = 3 }: ChatProgressProps) {
    const progress = Math.min((step / totalSteps) * 100, 100);

    return (
        <div className="w-full px-4 py-3 bg-card/50 border-b border-border">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground">
                        {step < totalSteps ? 'Stiamo raccogliendo le informazioni...' : 'Pronto per inviarti un tecnico!'}
                    </span>
                    <span className="text-xs font-bold text-foreground">{Math.round(progress)}%</span>
                </div>

                {/* Progress Bar */}
                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Steps */}
                <div className="flex justify-between mt-3">
                    {STEPS.map((s, index) => (
                        <div key={s.label} className="flex flex-col items-center">
                            <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${index < step
                                        ? 'bg-emerald-500 text-white'
                                        : index === step
                                            ? 'bg-blue-500 text-white animate-pulse'
                                            : 'bg-secondary text-muted-foreground'
                                    }`}
                            >
                                {index < step ? '✓' : index + 1}
                            </div>
                            <span className={`text-xs mt-1 hidden sm:block ${index <= step ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                                {s.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
