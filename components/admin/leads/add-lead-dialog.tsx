'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Loader2, MapPin } from 'lucide-react';
import { toast } from 'sonner';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { createLead } from '@/app/actions/leads-actions';

// Duplicate definition to avoid sharing issues, or export from actions if client-compatible
const formSchema = z.object({
    name: z.string().min(1, "Il nome è obbligatorio"),
    type: z.string().min(1, "Tipologia obbligatoria"),
    city: z.string().min(1, "La città è obbligatoria"),
    address: z.string().min(1, "L'indirizzo è obbligatorio"),
    phone: z.string().optional(),
    email: z.string().email("Email non valida").optional().or(z.literal("")),
    notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function AddLeadDialog() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            type: 'Ristorante',
            city: '',
            address: '',
            phone: '',
            email: '',
            notes: '',
        },
    });

    async function onSubmit(data: FormValues) {
        setLoading(true);
        try {
            const result = await createLead(data);
            if (result.error) {
                toast.error(result.error);
                return;
            }

            toast.success("Lead creato con successo! 📍");
            form.reset();
            setOpen(false);
        } catch (error) {
            toast.error("Si è verificato un errore imprevisto.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
                    <Plus className="w-4 h-4 mr-2" /> Aggiungi Lead
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Nuovo Lead Horeca</DialogTitle>
                    <DialogDescription>
                        Inserisci i dettagli. Le coordinate verranno calcolate automaticamente.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome Struttura</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Es. Hotel Bellavista" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tipologia</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleziona..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Hotel">Hotel</SelectItem>
                                                <SelectItem value="Ristorante">Ristorante</SelectItem>
                                                <SelectItem value="Bar">Bar</SelectItem>
                                                <SelectItem value="Altro">Altro</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="city"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Città</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Es. Rimini" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Indirizzo</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input className="pl-9" placeholder="Via Roma, 10" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Telefono</FormLabel>
                                        <FormControl>
                                            <Input placeholder="0541..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input placeholder="info@..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Note</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Note opzionali..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Annulla</Button>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {loading ? 'Creazione...' : 'Salva Lead'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
