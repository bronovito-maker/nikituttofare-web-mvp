'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { claimTicket } from '@/lib/actions/ticket-actions';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

interface ClaimButtonProps {
    ticketId: string;
}

export function ClaimButton({ ticketId }: ClaimButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleClaim = async () => {
        setIsLoading(true);
        try {
            const result = await claimTicket(ticketId);

            if (result.error) {
                toast.error('Errore', {
                    description: result.error,
                    icon: <AlertCircle className="w-5 h-5 text-red-500" />,
                });
                // If already taken, refresh to show the updated state UI
                if (result.error.includes('already been claimed')) {
                    router.refresh();
                }
            } else {
                toast.success('Lavoro Accettato!', {
                    description: "Hai preso in carico questa richiesta. Buon lavoro!",
                    icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
                });
                // Redirect to dashboard after a short delay
                router.push('/technician/dashboard');
            }
        } catch (e) {
            toast.error('Errore di sistema', {
                description: "Riprova tra qualche istante.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            onClick={handleClaim}
            disabled={isLoading}
            size="lg"
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg px-8 shadow-lg transition-all hover:scale-105"
        >
            {isLoading ? (
                <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Elaborazione...
                </>
            ) : (
                <>
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    Accetta Lavoro
                </>
            )}
        </Button>
    );
}
