'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { submitContactForm } from '@/app/actions/contact-actions';

import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

const formSchema = z.object({
    name: z.string().min(2, {
        message: 'Il nome deve avere almeno 2 caratteri.',
    }),
    phone: z.string().min(10, {
        message: 'Inserisci un numero di telefono valido.',
    }),
    category: z.string({
        required_error: 'Seleziona una categoria.',
    }),
    message: z.string().min(10, {
        message: 'Il messaggio deve avere almeno 10 caratteri.',
    }),
});

export function ContactForm() {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            phone: '',
            category: '',
            message: '',
        },
    });


    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true);
        try {
            const result = await submitContactForm(values);

            if (result.success) {
                toast.success('Messaggio inviato con successo! Ti contatteremo al più presto.');
                form.reset();
            } else {
                toast.error(result.error || 'Errore durante l\'invio del messaggio.');
            }
        } catch (error) {
            toast.error('Errore durante l\'invio del messaggio. Riprova più tardi.');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="bg-card/30 backdrop-blur-xl border border-border/50 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden group">
            {/* Decorative gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 relative z-10">
                    <div className="grid sm:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-semibold text-slate-300">Nome Completo</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Mario Rossi"
                                            className="bg-background/50 border-border/50 focus:border-blue-500/50 transition-colors h-12"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-semibold text-slate-300">Telefono</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="+39 333 1234567"
                                            className="bg-background/50 border-border/50 focus:border-blue-500/50 transition-colors h-12"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-sm font-semibold text-slate-300">Tipo di Intervento</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="bg-background/50 border-border/50 focus:border-blue-500/50 transition-colors h-12">
                                            <SelectValue placeholder="Seleziona una categoria" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-slate-900 border-slate-800">
                                        <SelectItem value="idraulico">Idraulico</SelectItem>
                                        <SelectItem value="elettricista">Elettricista</SelectItem>
                                        <SelectItem value="climatizzazione">Climatizzazione</SelectItem>
                                        <SelectItem value="fabbro">Fabbro</SelectItem>
                                        <SelectItem value="altro">Altro</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-sm font-semibold text-slate-300">Descrizione dell&apos;Emergenza</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Descrivi brevemente di cosa hai bisogno..."
                                        className="bg-background/50 border-border/50 focus:border-blue-500/50 transition-colors min-h-[120px]"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-14 rounded-xl shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98]"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Invio in corso...
                            </>
                        ) : (
                            <>
                                <Send className="mr-2 h-5 w-5" />
                                Invia Richiesta
                            </>
                        )}
                    </Button>

                    <p className="text-center text-xs text-muted-foreground mt-4 italic">
                        Rispondiamo mediamente entro 15 minuti via WhatsApp o Telefono.
                    </p>
                </form>
            </Form>
        </div>
    );
}
