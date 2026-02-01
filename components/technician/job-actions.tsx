'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { acceptJob } from '@/app/actions/technician-actions';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface TechnicianJobActionsProps {
    ticketId: string;
}

export function TechnicianJobActions({ ticketId }: TechnicianJobActionsProps) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleAccept = async () => {
        setLoading(true);
        try {
            const result = await acceptJob(ticketId);

            if (result.success) {
                toast.success(result.message || 'Incarico accettato con successo!');
                router.refresh();
            } else {
                // Fallback for unexpected structured response
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
                disabled={loading}
                size="lg"
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold h-12 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
            >
                {loading ? <Loader2 className="animate-spin mr-2" /> : null}
                ACCETTA INCARICO
            </Button>
            <p className="text-center text-xs text-gray-500 mt-2">
                Cliccando accetti di intervenire entro 2 ore.
            </p>
        </div>
    );
}
