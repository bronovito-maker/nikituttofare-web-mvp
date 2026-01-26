'use client';

import { Building2, Home } from 'lucide-react';
import { motion } from 'framer-motion';

type UserType = 'residential' | 'business';

interface UserTypeToggleProps {
    readonly value: UserType;
    readonly onChange: (value: UserType) => void;
}

export function UserTypeToggle({ value, onChange }: UserTypeToggleProps) {
    return (
        <div className="relative flex items-center bg-muted/50 p-1 rounded-full border border-border">
            {/* Active Indicator Background */}
            <motion.div
                layout
                className="absolute inset-y-1 bg-background rounded-full shadow-sm border border-border/50"
                initial={false}
                animate={{
                    left: value === 'residential' ? 4 : '50%',
                    right: value === 'residential' ? '50%' : 4,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />

            {/* Residential Option */}
            <button
                onClick={() => onChange('residential')}
                className={`relative flex items-center justify-center gap-2 flex-1 px-4 py-1.5 text-xs sm:text-sm font-medium transition-colors z-10 ${value === 'residential' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/80'
                    }`}
            >
                <Home className="w-3.5 h-3.5" />
                <span>Privati</span>
            </button>

            {/* Business Option */}
            <button
                onClick={() => onChange('business')}
                className={`relative flex items-center justify-center gap-2 flex-1 px-4 py-1.5 text-xs sm:text-sm font-medium transition-colors z-10 ${value === 'business' ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground hover:text-foreground/80'
                    }`}
            >
                <Building2 className="w-3.5 h-3.5" />
                <span>Aziende</span>
            </button>
        </div>
    );
}
