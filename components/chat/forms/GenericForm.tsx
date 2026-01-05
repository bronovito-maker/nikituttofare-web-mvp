"use client"

import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PhotoUpload } from "./PhotoUpload"
import { toast } from "sonner"

const formSchema = z.object({
  description: z.string().min(20, {
    message: "La descrizione deve essere di almeno 20 caratteri.",
  }),
  photo: z.string({
    required_error: "La foto è obbligatoria per capire meglio il lavoro da fare.",
  }).min(1, "La foto è obbligatoria."),
})

interface GenericFormProps {
  onSubmit: (data: z.infer<typeof formSchema>) => Promise<void>;
}

export function GenericForm({ onSubmit }: GenericFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
    },
  })

  const handleFormSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      toast.success("Segnalazione inviata con successo!");
    } catch (error) {
      toast.error("Errore nell'invio della segnalazione. Riprova.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
            <CardTitle>Segnalazione Generica / Altro</CardTitle>
            <CardDescription>
                Descrivi il tuo problema e carica una foto. Questo ci aiuterà a capire come possiamo aiutarti.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
                
                <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Descrivi il lavoro da fare</FormLabel>
                    <FormControl>
                        <Textarea
                        placeholder="Es. Devo montare un nuovo lampadario, ho bisogno di appendere dei quadri, la tapparella si è bloccata..."
                        rows={6}
                        {...field}
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                
                <FormField
                  control={form.control}
                  name="photo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Foto del problema/lavoro</FormLabel>
                      <FormControl>
                        <PhotoUpload onImageUpload={(base64) => field.onChange(base64)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Invio in corso...' : 'Invia Segnalazione'}</Button>
            </form>
            </Form>
        </CardContent>
    </Card>
  )
}
