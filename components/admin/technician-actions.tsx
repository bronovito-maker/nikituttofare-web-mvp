'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MoreHorizontal, Trash2, Ban, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { toggleTechnicianStatus, deleteTechnician } from '@/app/actions/admin-actions';
import { Database } from '@/lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface TechnicianActionsProps {
    technician: Profile;
}

export function TechnicianActions({ technician }: Readonly<TechnicianActionsProps>) {
    const [loading, setLoading] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    // Determines if technician is active.
    // Handles database boolean (is_active) or fallback to convention if null
    const isActive = technician.is_active !== false; // Default true unless explicitly false

    const handleToggleStatus = async () => {
        setLoading(true);
        try {
            const result = await toggleTechnicianStatus(technician.id, !isActive);
            if (result.success) {
                toast.success(result.message);
            } else {
                toast.error(result.message);
            }
        } catch {
            toast.error("Errore di connessione");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        setLoading(true);
        try {
            const result = await deleteTechnician(technician.id);
            if (result.success) {
                toast.success(result.message);
                setIsDeleteDialogOpen(false);
            } else {
                toast.error(result.message);
            }
        } catch {
            toast.error("Errore di connessione");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-secondary text-muted-foreground">
                        <span className="sr-only">Apri menu</span>
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <MoreHorizontal className="h-4 w-4" />
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-card border-border text-foreground">
                    <DropdownMenuItem
                        onClick={handleToggleStatus}
                        className="cursor-pointer focus:bg-secondary focus:text-foreground"
                    >
                        {isActive ? (
                            <>
                                <Ban className="mr-2 h-4 w-4 text-amber-500" />
                                <span>Disattiva</span>
                            </>
                        ) : (
                            <>
                                <CheckCircle className="mr-2 h-4 w-4 text-emerald-500" />
                                <span>Attiva</span>
                            </>
                        )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border" />
                    <DropdownMenuItem
                        onClick={() => setIsDeleteDialogOpen(true)}
                        className="text-red-500 cursor-pointer focus:bg-red-500/10 focus:text-red-500"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Elimina</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="bg-card border-border">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-foreground">Sei assolutamente sicuro?</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">
                            Questa azione non può essere annullata. Eliminerà permanentemente l&apos;account del tecnico{' '}
                            <span className="font-bold text-foreground ml-1">{technician.full_name}</span> dal database.
                            Se il tecnico ha degli interventi nello storico, l&apos;operazione verrà bloccata per sicurezza.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-transparent border-border text-foreground hover:bg-secondary hover:text-foreground">
                            Annulla
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e: React.MouseEvent) => {
                                e.preventDefault(); // Prevent auto-close to handle async
                                handleDelete();
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white border-none"
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Elimina Definitivamente
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
