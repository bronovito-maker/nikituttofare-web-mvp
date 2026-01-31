'use client';

import { Sparkles } from 'lucide-react';

interface ChatSuggestionsProps {
    readonly suggestions: string[];
    readonly onSelect: (suggestion: string) => void;
    readonly disabled?: boolean;
}

export function ChatSuggestions({ suggestions, onSelect, disabled }: ChatSuggestionsProps) {
    if (!suggestions || suggestions.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-2 mt-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium w-full mb-1">
                <Sparkles className="w-3 h-3" />
                <span>Domande suggerite:</span>
            </div>
            {suggestions.map((suggestion, index) => (
                <button
                    key={index}
                    onClick={() => onSelect(suggestion)}
                    disabled={disabled}
                    className="px-3 py-2 text-sm bg-secondary hover:bg-accent border border-border rounded-xl text-foreground font-medium transition-all duration-200 hover:scale-[1.02] hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-left"
                >
                    {suggestion}
                </button>
            ))}
        </div>
    );
}

// Default suggestions based on conversation context
export const INITIAL_SUGGESTIONS = [
    'Ho un tubo che perde, è urgente?',
    'Quanto costa un intervento?',
    'Siete disponibili nel weekend?',
];

export const PROBLEM_FOLLOWUP_SUGGESTIONS = [
    'Puoi venire oggi?',
    'Qual è il costo stimato?',
    'Avete garanzia sul lavoro?',
];

export const LOCATION_FOLLOWUP_SUGGESTIONS = [
    'Qual è il tempo di arrivo?',
    'Il tecnico è già in zona?',
    'Posso pagare con carta?',
];
