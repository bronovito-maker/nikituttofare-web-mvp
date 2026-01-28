'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Loader2 } from 'lucide-react';
import { addUserAsset } from '@/app/actions/assets-actions';
import { toast } from 'sonner';

export function AddAssetDialog() {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);
        const formData = new FormData(event.currentTarget);

        // Server Action
        const result = await addUserAsset({}, formData);

        if (result.success) {
            toast.success(result.message);
            setOpen(false);
        } else {
            toast.error(result.message || 'Errore');
        }
        setIsLoading(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Aggiungi Immobile
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Nuovo Immobile</DialogTitle>
                        <DialogDescription>
                            Aggiungi un nuovo indirizzo alla tua rubrica per velocizzare le richieste di intervento.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="address">Indirizzo completo</Label>
                            <Input
                                id="address"
                                name="address"
                                placeholder="Via Roma 123"
                                required
                                minLength={5}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="city">Città</Label>
                            <Input
                                id="city"
                                name="city"
                                placeholder="Rimini"
                                defaultValue="Rimini"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="notes">Note (opzionale)</Label>
                            <Textarea
                                id="notes"
                                name="notes"
                                placeholder="Es. Piano terra, citofono guasto..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Salva Indirizzo
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
