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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PhotoUpload } from "./PhotoUpload"
import { toast } from "sonner"

const formSchema = z.object({
  cooling_heating_issue: z.enum(["Non raffredda", "Non scalda", "Entrambi", "Nessun problema"]),
  water_leak: z.enum(["Sì", "No"]),
  error_code: z.string().optional(),
  description: z.string().min(10, {
    message: "La descrizione deve essere di almeno 10 caratteri.",
  }),
  photo: z.string().optional(),
})

interface ClimateFormProps {
  onSubmit: (data: Record<string, any>) => Promise<void>;
}

export function ClimateForm({ onSubmit }: ClimateFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cooling_heating_issue: "Nessun problema",
      water_leak: "No",
      error_code: "",
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
            <CardTitle>Segnalazione Condizionatori/Caldaie</CardTitle>
            <CardDescription>
                Compila i campi per aiutarci a capire il problema.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
                
                <FormField
                control={form.control}
                name="cooling_heating_issue"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Il dispositivo non raffredda o non scalda?</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        <SelectItem value="Non raffredda">Non raffredda (condizionatore)</SelectItem>
                        <SelectItem value="Non scalda">Non scalda (caldaia/pompa di calore)</SelectItem>
                        <SelectItem value="Entrambi">Problemi sia in freddo che in caldo</SelectItem>
                        <SelectItem value="Nessun problema">Nessuno di questi</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />

                <FormField
                control={form.control}
                name="water_leak"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Perde acqua?</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        <SelectItem value="Sì">Sì</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />

                <FormField
                control={form.control}
                name="error_code"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Codice di errore sul display (se presente)</FormLabel>
                    <FormControl>
                        <Input placeholder="Es. E01, F22..." {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />

                <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Descrizione dettagliata</FormLabel>
                    <FormControl>
                        <Textarea
                        placeholder="Es. Il condizionatore fa un rumore strano..."
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
                      <FormLabel>Foto del Problema (Opzionale)</FormLabel>
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
