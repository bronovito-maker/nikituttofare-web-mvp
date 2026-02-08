'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { acceptJob, completeJob } from '@/app/actions/technician-actions';
import { toast } from 'sonner';
import { Loader2, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TechnicianJobActionsProps {
    ticketId: string;
    status?: 'available' | 'assigned' | 'mine' | 'resolved';
}

export function TechnicianJobActions({ ticketId, status = 'available' }: TechnicianJobActionsProps) {
    const [loading, setLoading] = useState(false);
    const [completing, setCompleting] = useState(false);
    const router = useRouter();

    const isAssigned = status === 'assigned';
    const isMine = status === 'mine';
    const isResolved = status === 'resolved';
    const isDisabled = loading || completing || isAssigned || isResolved;

    const handleAccept = async () => {
        if (isDisabled || isMine) return;
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

    const handleComplete = async () => {
        if (completing || !isMine) return;

        if (!confirm('Confermi di aver completato l\'intervento? Il cliente verrà notificato.')) {
            return;
        }

        setCompleting(true);
        try {
            const result = await completeJob(ticketId);
            if (result.success) {
                toast.success('Intervento segnato come completato!');
                router.refresh();
            } else {
                toast.error('Errore durante la chiusura dell\'intervento.');
            }
        } catch (err: unknown) {
            console.error(err);
            toast.error('Errore imprevisto nella chiusura del lavoro.');
        } finally {
            setCompleting(false);
        }
    };

    if (isResolved) {
        return (
            <div className="w-full">
                <Badge className="w-full justify-center py-3 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-sm font-bold uppercase">
                    <CheckCircle className="w-4 h-4 mr-2" /> Intervento Completato
                </Badge>
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col gap-3">
            <Button
                onClick={handleAccept}
                disabled={isDisabled || isMine}
                size="lg"
                className={cn(
                    "w-full font-bold h-12 transition-all duration-300",
                    isAssigned
                        ? "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border-none shadow-none"
                        : isMine
                            ? "bg-emerald-100 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 cursor-default shadow-none"
                            : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.2)] active:scale-[0.98]"
                )}
            >
                {loading ? <Loader2 className="animate-spin mr-2" /> : null}
                {isAssigned ? 'GIÀ ASSEGNATO' : isMine ? 'INCARICO ASSEGNATO A TE' : 'ACCETTA INCARICO'}
            </Button>

            {isMine && (
                <Button
                    onClick={handleComplete}
                    disabled={completing}
                    size="lg"
                    variant="default"
                    className="w-full font-bold h-14 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg animate-in fade-in slide-in-from-top-2"
                >
                    {completing ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle className="w-5 h-5 mr-2" />}
                    INTERVENTO COMPLETATO
                </Button>
            )}
            {status === 'available' && (
                <p className="text-center text-[10px] text-gray-500 mt-2 uppercase tracking-widest font-bold opacity-60">
                    Accettando ti impegni a intervenire H24
                </p>
            )}
        </div>
    );
}
