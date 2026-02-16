import { createServerClient } from '@/lib/supabase-server'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

import { Phone, MapPin, CheckCircle, ArrowLeft, Navigation, Banknote, CreditCard } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { completeJob, addJobNote } from '@/app/actions/technician-actions'
import { markTicketAsPaid, type PaymentMethod } from '@/app/actions/payment-actions'

// Payment Status Badge Component
function PaymentStatusBadge({ status }: { status: string | null }) {
    if (status === 'paid') {
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 border border-emerald-500/30">
                <Banknote className="w-3.5 h-3.5" />
                PAGATO
            </span>
        )
    }
    return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/30">
            <CreditCard className="w-3.5 h-3.5" />
            IN ATTESA DI PAGAMENTO
        </span>
    )
}

export default async function JobOperationalPage({ params }: { params: Promise<Readonly<{ id: string }>> }) {
    const supabase = await createServerClient()
    const { id } = await params

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return redirect('/login')

    const { data: ticket } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', id)
        .single()

    if (!ticket || ticket.assigned_technician_id !== user.id) {
        return redirect('/technician/jobs')
    }

    // Fetch previous notes (messages with specific metadata)
    const { data: notes } = await supabase
        .from('messages')
        .select('*')
        .eq('ticket_id', id)
        // @ts-ignore
        .contains('meta_data', { type: 'internal_note' })
        .order('created_at', { ascending: false })

    const isPaid = ticket.payment_status === 'paid'
    const isResolved = ticket.status === 'resolved'

    return (
        <div className="min-h-screen bg-background text-foreground font-sans pb-24">
            {/* Top Bar */}
            <div className="sticky top-0 bg-background/90 backdrop-blur-md border-b border-border p-4 flex items-center gap-4 z-50">
                <Link href="/technician/jobs" className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <div className="flex-1">
                    <h1 className="font-bold text-lg leading-none text-foreground">Intervento in Corso</h1>
                    <span className="text-xs text-emerald-500 dark:text-emerald-400">Assigned</span>
                </div>
                {/* Payment Status Badge */}
                <PaymentStatusBadge status={ticket.payment_status} />
            </div>

            <div className="p-4 space-y-6">
                {/* Customer Card */}
                <section className="bg-card rounded-xl p-5 border border-border">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-1">Cliente</h2>
                            <p className="text-xl font-semibold text-foreground">{ticket.customer_name || 'Cliente Guest'}</p>
                        </div>
                        <Button size="icon" className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white" asChild>
                            <a href={`tel:${ticket.contact_phone || ''}`}>
                                <Phone className="w-5 h-5" />
                            </a>
                        </Button>
                    </div>

                    <div className="flex items-start gap-3 bg-secondary/50 p-3 rounded-lg border border-border">
                        <MapPin className="w-5 h-5 text-muted-foreground mt-1" />
                        <div className="flex-1">
                            <p className="text-sm text-foreground">{ticket.address}, {ticket.city || ''}</p>
                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((ticket.address || '') + ' ' + (ticket.city || ''))}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-emerald-500 dark:text-emerald-400 font-medium mt-1 inline-flex items-center gap-1 hover:underline"
                            >
                                <Navigation className="w-3 h-3" /> Apri Mappe
                            </a>
                        </div>
                    </div>
                </section>

                {/* Problem Detail */}
                <section>
                    <h2 className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-2">Dettaglio Problema</h2>
                    <div className="bg-card rounded-xl p-4 border border-border">
                        <p className="text-foreground leading-relaxed">{ticket.description}</p>
                        {ticket.photo_url && (
                            <div className="mt-4 rounded-lg overflow-hidden border border-border relative aspect-video w-full">
                                <Image
                                    src={ticket.photo_url}
                                    alt="Foto guasto"
                                    fill
                                    className="object-contain"
                                    sizes="(max-width: 768px) 100vw, 800px"
                                />
                            </div>
                        )}
                    </div>
                </section>

                {/* Internal Notes */}
                <section>
                    <h2 className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-2">Note Tecniche</h2>
                    <div className="bg-card rounded-xl p-4 border border-border space-y-4">
                        <form action={async (formData) => {
                            'use server'
                            const note = formData.get('note') as string
                            if (note) await addJobNote(id, note)
                        }}>
                            <Textarea
                                name="note"
                                placeholder="Aggiungi una nota interna..."
                                className="bg-secondary/50 border-border text-foreground focus:border-emerald-500 mb-2"
                            />
                            <Button type="submit" variant="secondary" size="sm" className="w-full text-xs">
                                Salva Nota
                            </Button>
                        </form>

                        <div className="space-y-3 pt-2">
                            {notes?.map((note) => (
                                <div key={note.id} className="text-sm bg-secondary/50 p-3 rounded border border-border">
                                    <p className="text-foreground">{note.content}</p>
                                    <span className="text-[10px] text-muted-foreground block mt-1 text-right">
                                        {new Date(note.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>

            {/* Sticky Bottom Actions */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 border-t border-border backdrop-blur z-50 space-y-3">
                {/* Payment Action - Only show if not resolved */}
                {!isResolved && !isPaid && (
                    <div className="flex gap-3">
                        <form action={async (formData) => {
                            'use server'
                            const method = formData.get('method') as PaymentMethod
                            await markTicketAsPaid(id, method)
                        }} className="flex-1">
                            <input type="hidden" name="method" value="cash" />
                            <Button
                                type="submit"
                                variant="outline"
                                size="lg"
                                className="w-full border-amber-500/50 text-amber-500 dark:text-amber-400 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-300 h-12"
                            >
                                <Banknote className="w-5 h-5 mr-2" />
                                💵 Contanti
                            </Button>
                        </form>
                        <form action={async (formData) => {
                            'use server'
                            const method = formData.get('method') as PaymentMethod
                            await markTicketAsPaid(id, method)
                        }} className="flex-1">
                            <input type="hidden" name="method" value="card" />
                            <Button
                                type="submit"
                                variant="outline"
                                size="lg"
                                className="w-full border-blue-500/50 text-blue-500 dark:text-blue-400 hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-300 h-12"
                            >
                                <CreditCard className="w-5 h-5 mr-2" />
                                💳 POS
                            </Button>
                        </form>
                    </div>
                )}

                {/* Already Paid Indicator */}
                {isPaid && !isResolved && (
                    <div className="text-center py-2 px-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                        <p className="text-sm text-emerald-500 dark:text-emerald-400 font-medium">✓ Pagamento registrato</p>
                    </div>
                )}

                {/* Complete Job Button */}
                {!isResolved && (
                    <form action={async () => {
                        'use server'
                        await completeJob(id)
                    }}>
                        <Button
                            type="submit"
                            size="lg"
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-14 text-lg shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                        >
                            <CheckCircle className="w-6 h-6 mr-2" /> LAVORO COMPLETATO
                        </Button>
                    </form>
                )}

                {/* Resolved State */}
                {isResolved && (
                    <div className="text-center py-4">
                        <p className="text-emerald-500 dark:text-emerald-400 font-bold text-lg">✅ Lavoro Completato</p>
                        <p className="text-muted-foreground text-sm mt-1">
                            {isPaid ? 'Pagamento ricevuto' : 'In attesa di pagamento'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
