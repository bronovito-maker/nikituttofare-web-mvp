'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { acceptJob } from '@/app/actions/technician-actions';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TechnicianJobActionsProps {
    ticketId: string;
    status?: 'available' | 'assigned';
}

export function TechnicianJobActions({ ticketId, status = 'available' }: TechnicianJobActionsProps) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const isAssigned = status === 'assigned';

    const handleAccept = async () => {
        if (isAssigned) return;
        setLoading(true);
        try {
            const result = await acceptJob(ticketId);

            if (result.success) {
                toast.success(result.message || 'Incarico accettato con successo!');
                router.refresh();
            } else {
                toast.error('Impossibile accettare l\'incarico.');
            }
        } catch (err: unknown) {
            console.error(err);
            const message = err instanceof Error ? err.message : 'Errore durante l\'accettazione del lavoro.';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full">
            <Button
                onClick={handleAccept}
                disabled={loading || isAssigned}
                size="lg"
                className={cn(
                    "w-full font-bold h-12 transition-all duration-300",
                    isAssigned
                        ? "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border-none shadow-none"
                        : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.2)] active:scale-[0.98]"
                )}
            >
                {loading ? <Loader2 className="animate-spin mr-2" /> : null}
                {isAssigned ? 'GIÀ ASSEGNATO' : 'ACCETTA INCARICO'}
            </Button>
            {!isAssigned && (
                <p className="text-center text-[10px] text-gray-500 mt-2 uppercase tracking-widest font-bold opacity-60">
                    Accettando ti impegni a intervenire H24
                </p>
            )}
        </div>
    );
}
