import { createServerClient } from '@/lib/supabase-server'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

import { Phone, MapPin, CheckCircle, ArrowLeft, Navigation } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { completeJob, addJobNote } from '@/app/actions/technician-actions'

export default async function JobOperationalPage({ params }: { params: Promise<{ id: string }> }) {
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

    return (
        <div className="min-h-screen bg-[#121212] text-white font-sans pb-24">
            {/* Top Bar */}
            <div className="sticky top-0 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-[#333] p-4 flex items-center gap-4 z-50">
                <Link href="/technician/jobs" className="p-2 -ml-2 text-gray-400 hover:text-white">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <div>
                    <h1 className="font-bold text-lg leading-none">Intervento in Corso</h1>
                    <span className="text-xs text-emerald-400">Assigned</span>
                </div>
            </div>

            <div className="p-4 space-y-6">
                {/* Customer Card */}
                <section className="bg-[#1a1a1a] rounded-xl p-5 border border-[#333]">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Cliente</h2>
                            <p className="text-xl font-semibold">{ticket.customer_name || 'Cliente Guest'}</p>
                        </div>
                        <Button size="icon" className="rounded-full bg-emerald-600 hover:bg-emerald-700" asChild>
                            <a href={`tel:${ticket.contact_phone || ''}`}>
                                <Phone className="w-5 h-5" />
                            </a>
                        </Button>
                    </div>

                    <div className="flex items-start gap-3 bg-[#121212] p-3 rounded-lg border border-[#333/50]">
                        <MapPin className="w-5 h-5 text-gray-500 mt-1" />
                        <div className="flex-1">
                            <p className="text-sm text-gray-200">{ticket.address}, {ticket.city || ''}</p>
                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((ticket.address || '') + ' ' + (ticket.city || ''))}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-emerald-400 font-medium mt-1 inline-flex items-center gap-1 hover:underline"
                            >
                                <Navigation className="w-3 h-3" /> Apri Mappe
                            </a>
                        </div>
                    </div>
                </section>

                {/* Problem Detail */}
                <section>
                    <h2 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Dettaglio Problema</h2>
                    <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#333]">
                        <p className="text-gray-200 leading-relaxed">{ticket.description}</p>
                        {ticket.photo_url && (
                            <div className="mt-4 rounded-lg overflow-hidden border border-[#333]">
                                <img src={ticket.photo_url} alt="Foto guasto" className="w-full h-auto" />
                            </div>
                        )}
                    </div>
                </section>

                {/* Internal Notes */}
                <section>
                    <h2 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Note Tecniche</h2>
                    <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#333] space-y-4">
                        <form action={async (formData) => {
                            'use server'
                            const note = formData.get('note') as string
                            if (note) await addJobNote(id, note)
                        }}>
                            <Textarea
                                name="note"
                                placeholder="Aggiungi una nota interna..."
                                className="bg-[#121212] border-[#333] text-white focus:border-emerald-500 mb-2"
                            />
                            <Button type="submit" variant="secondary" size="sm" className="w-full bg-[#333] hover:bg-[#444] text-white text-xs">
                                Salva Nota
                            </Button>
                        </form>

                        <div className="space-y-3 pt-2">
                            {notes?.map((note) => (
                                <div key={note.id} className="text-sm bg-[#121212] p-3 rounded border border-[#333/50]">
                                    <p className="text-gray-300">{note.content}</p>
                                    <span className="text-[10px] text-gray-600 block mt-1 text-right">
                                        {new Date(note.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>

            {/* Sticky Bottom Action */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0a0a0a]/95 border-t border-[#333] backdrop-blur z-50">
                <form action={async () => {
                    'use server'
                    await completeJob(id)
                }}>
                    <Button type="submit" size="lg" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-14 text-lg shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                        <CheckCircle className="w-6 h-6 mr-2" /> LAVORO COMPLETATO
                    </Button>
                </form>
            </div>
        </div>
    )
}
