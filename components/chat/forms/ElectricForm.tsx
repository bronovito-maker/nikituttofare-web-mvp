"use client"

import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useState, useEffect } from "react"

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
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PhotoUpload } from "./PhotoUpload"
import { toast } from "sonner"

const formSchema = z.object({
  power_outage: z.enum(["Tutta la casa", "Una parte", "Nessuno"]),
  smell_of_burning: z.enum(["Sì", "No"]),
  problem_type: z.enum(["Prese", "Luci", "Quadro elettrico", "Altro"]),
  description: z.string().min(10, {
    message: "La descrizione deve essere di almeno 10 caratteri.",
  }),
  photo: z.string().optional(),
})

interface ElectricFormProps {
  onSubmit: (data: z.infer<typeof formSchema>) => Promise<void>;
}

export function ElectricForm({ onSubmit }: ElectricFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      power_outage: "Nessuno",
      smell_of_burning: "No",
      problem_type: "Altro",
      description: "",
    },
  })

  const smellOfBurning = form.watch("smell_of_burning");

  const handleFormSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    const urgency = smellOfBurning === "Sì" ? "Critica" : "Alta";
    try {
      await onSubmit({ ...data, urgency });
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
            <CardTitle>Segnalazione Problema Elettrico</CardTitle>
            <CardDescription>
                Compila i campi per aiutarci a capire il problema.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
                
                <FormField
                control={form.control}
                name="smell_of_burning"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>C'è puzza di bruciato?</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        <SelectItem value="No">No</SelectItem>
                        <SelectItem value="Sì">Sì</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />

                <FormField
                control={form.control}
                name="power_outage"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>È saltata la corrente?</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        <SelectItem value="Tutta la casa">Sì, in tutta la casa</SelectItem>
                        <SelectItem value="Una parte">Sì, solo in una parte</SelectItem>
                        <SelectItem value="Nessuno">No, la corrente c'è</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />

                <FormField
                control={form.control}
                name="problem_type"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Il problema riguarda prese, luci o altro?</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        <SelectItem value="Prese">Prese di corrente</SelectItem>
                        <SelectItem value="Luci">Punti luce</SelectItem>
                        <SelectItem value="Quadro elettrico">Quadro elettrico</SelectItem>
                        <SelectItem value="Altro">Altro / Non so</SelectItem>
                        </SelectContent>
                    </Select>
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
                        placeholder="Es. La presa della cucina non funziona più..."
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
