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
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PhotoUpload } from "./PhotoUpload"
import { toast } from "sonner"

const formSchema = z.object({
  locked_out: z.enum(["Sì", "No"]),
  key_broken: z.enum(["Sì", "No"]),
  armored_door: z.enum(["Sì", "No", "Non so"]),
  description: z.string().min(10, {
    message: "La descrizione deve essere di almeno 10 caratteri.",
  }),
  photo: z.string().optional(),
})

interface LocksmithFormProps {
  onSubmit: (data: z.infer<typeof formSchema>) => Promise<void>;
}

export function LocksmithForm({ onSubmit }: LocksmithFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      locked_out: "No",
      key_broken: "No",
      armored_door: "No",
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
            <CardTitle>Segnalazione Fabbro/Serrature</CardTitle>
            <CardDescription>
                Compila i campi per aiutarci a capire il problema.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
                
                <FormField
                control={form.control}
                name="locked_out"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Sei rimasto chiuso fuori?</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        <SelectItem value="Sì">Sì, sono fuori casa/ufficio</SelectItem>
                        <SelectItem value="No">No, sono dentro</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />

                <FormField
                control={form.control}
                name="key_broken"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>La chiave è spezzata nella toppa?</FormLabel>
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
                name="armored_door"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>La porta è blindata?</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        <SelectItem value="Sì">Sì</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                        <SelectItem value="Non so">Non so</SelectItem>
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
                        placeholder="Es. La serratura gira a vuoto..."
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
