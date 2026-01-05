"use client"

import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FormType } from "@/lib/ai-structures"
import { PhotoUpload } from "./PhotoUpload" // IMPORTATO

const formSchema = z.object({
  issue_description: z.string().min(10, {
    message: "La descrizione deve essere di almeno 10 caratteri.",
  }),
  urgency: z.enum(["Bassa", "Media", "Alta"]),
  photo: z.string().optional(), // AGGIUNTO
})

interface PlumbingFormProps {
  formDefinition: FormType;
  onSubmit: (data: z.infer<typeof formSchema>) => Promise<void>;
}

export function PlumbingForm({ formDefinition, onSubmit }: PlumbingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      issue_description: "",
      urgency: "Media",
    },
  })

  const handleFormSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
            <CardTitle>Segnalazione Problema Idraulico</CardTitle>
            <CardDescription>
                Per favore, compila i campi qui sotto e aggiungi una foto per aiutarci a fornire una stima più precisa.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
                <FormField
                control={form.control}
                name="issue_description"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Descrizione del Problema</FormLabel>
                    <FormControl>
                        <Textarea
                        placeholder="Es. C'è una perdita d'acqua dal tubo sotto il lavandino della cucina..."
                        {...field}
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />

                <FormField
                control={form.control}
                name="urgency"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Livello di Urgenza</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Seleziona l'urgenza" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        <SelectItem value="Bassa">Bassa - Nessun rischio immediato</SelectItem>
                        <SelectItem value="Media">Media - Impatta l'uso quotidiano</SelectItem>
                        <SelectItem value="Alta">Alta - Rischio di danni alla proprietà</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
                
                <FormField
                  control={form.control}
                  name="photo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Foto del Problema</FormLabel>
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
