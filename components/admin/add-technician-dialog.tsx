'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { registerTechnician } from '@/app/actions/admin-actions'

export function AddTechnicianDialog() {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData(e.currentTarget)

        try {
            const result = await registerTechnician(formData)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Tecnico registrato con successo')
                setOpen(false)
            }
        } catch (error) {
            toast.error('Errore di connessione')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    + Aggiungi Tecnico
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card border-border text-foreground">
                <DialogHeader>
                    <DialogTitle>Registra Nuovo Tecnico</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="fullName" className="text-right text-muted-foreground">
                            Nome
                        </Label>
                        <Input
                            id="fullName"
                            name="fullName"
                            placeholder="Mario Rossi"
                            className="col-span-3 bg-background border-border text-foreground focus:border-emerald-500"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="phone" className="text-right text-muted-foreground">
                            Telefono
                        </Label>
                        <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            placeholder="+39 333 1234567"
                            className="col-span-3 bg-background border-border text-foreground focus:border-emerald-500"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="pin" className="text-right text-muted-foreground">
                            PIN (6 cifre)
                        </Label>
                        <Input
                            id="pin"
                            name="pin"
                            type="text"
                            placeholder="123456"
                            maxLength={6}
                            pattern="\d{6}"
                            title="Inserisci 6 cifre"
                            className="col-span-3 bg-background border-border text-foreground focus:border-emerald-500 font-mono tracking-widest"
                            required
                        />
                    </div>
                    <div className="flex justify-end pt-4">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            {loading ? 'Registrazione...' : 'Conferma'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
