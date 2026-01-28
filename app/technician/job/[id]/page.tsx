import { createServerClient } from '@/lib/supabase-server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { MapPin, ArrowLeft, Calendar, User, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { acceptJob } from '@/app/actions/technician-actions'
import { formatDistanceToNow } from 'date-fns'
import { it } from 'date-fns/locale'

export default async function JobDetailPage({ params }: { params: { id: string } }) {
    const supabase = await createServerClient()
    const { id } = params

    // 1. Auth Check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return redirect(`/login?next=/technician/job/${id}`)

    // 2. Fetch Job Details
    const { data: ticket, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', id)
        .single()

    if (error || !ticket) {
        return (
            <div className="min-h-screen bg-[#121212] text-white flex items-center justify-center p-4">
                <div className="text-center">
                    <h1 className="text-xl font-bold mb-2">Lavoro non trovato</h1>
                    <p className="text-gray-400 mb-4">Questo incarico potrebbe essere stato cancellato o rimosso.</p>
                    <Link href="/technician/claim" className="text-emerald-400 hover:underline">Torna alla lista</Link>
                </div>
            </div>
        )
    }

    // 3. Fetch Context Messages (optional, helps technician understand context)
    const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .eq('ticket_id', id)
        .order('created_at', { ascending: true })
        .limit(5)

    const isAssignedToMe = ticket.assigned_technician_id === user.id
    const isAvailable = !ticket.assigned_technician_id
    const isAssignedToOther = ticket.assigned_technician_id && !isAssignedToMe

    return (
        <div className="min-h-screen bg-[#121212] text-white font-sans">
            {/* Header Image or Map Placeholder */}
            <div className="h-48 bg-[#1a1a1a] border-b border-[#333] relative">
                {/* Back Button */}
                <Link href="/technician/claim" className="absolute top-4 left-4 bg-black/50 p-2 rounded-full hover:bg-black/80 transition z-10">
                    <ArrowLeft className="w-5 h-5" />
                </Link>

                {ticket.photo_url ? (
                    <img src={ticket.photo_url} alt="Problem" className="w-full h-full object-cover opacity-80" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600">
                        <span className="text-sm uppercase tracking-widest">Nessuna Immagine</span>
                    </div>
                )}

                <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-[#121212] to-transparent" />
            </div>

            <div className="px-4 -mt-6 relative z-10 pb-20">
                <div className="flex items-center justify-between mb-4">
                    <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-none text-xs px-3 py-1 uppercase tracking-wide">
                        {ticket.category}
                    </Badge>
                    <span className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true, locale: it })}
                    </span>
                </div>

                <h1 className="text-2xl font-bold mb-2 leading-tight">{ticket.description}</h1>

                <div className="flex items-start gap-2 text-gray-300 mb-6">
                    <MapPin className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{ticket.city || ticket.address || 'Indirizzo non presente'}</span>
                </div>

                {/* Status Actions */}
                <div className="mb-8">
                    {isAvailable && (
                        <form action={acceptJob.bind(null, id)}>
                            <Button type="submit" size="lg" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold h-12 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                                ACCETTA INCARICO
                            </Button>
                            <p className="text-center text-xs text-gray-500 mt-2">
                                Cliccando accetti di intervenire entro 2 ore.
                            </p>
                        </form>
                    )}

                    {isAssignedToMe && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 text-center">
                            <p className="text-emerald-400 font-medium mb-2">✅ Incarico Assegnato a Te</p>
                            <Button variant="outline" className="w-full border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
                                Vedi Contatti Cliente
                            </Button>
                        </div>
                    )}

                    {isAssignedToOther && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center">
                            <p className="text-red-400">⛔️ Assegnato ad altro tecnico</p>
                        </div>
                    )}
                </div>

                {/* Additional Info */}
                <div className="space-y-6">

                    {/* Customer (Hidden until accepted usually, but showing placeholder here) */}
                    <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#333]">
                        <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                            <User className="w-4 h-4" /> CLIENTE
                        </h3>
                        {isAssignedToMe ? (
                            <div>
                                <p className="font-semibold text-white">{ticket.customer_name || 'Cliente Guest'}</p>
                                <p className="text-emerald-400 text-sm mt-1">{ticket.contact_phone ? `+${ticket.contact_phone}` : 'Telefono non disponibile'}</p>
                            </div>
                        ) : (
                            <div className="blur-sm select-none opacity-50">
                                <p className="font-semibold">Mario Rossi</p>
                                <p className="text-sm">+39 333 **** ***</p>
                            </div>
                        )}
                    </div>

                    {/* Chat Context */}
                    {messages && messages.length > 0 && (
                        <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#333]">
                            <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                                <MessageCircle className="w-4 h-4" /> ESTRATTO CHAT
                            </h3>
                            <div className="space-y-3">
                                {messages.map((msg) => (
                                    <div key={msg.id} className={`p-2 rounded text-xs ${msg.role === 'assistant' ? 'bg-[#252525] text-gray-300' : 'bg-emerald-900/20 text-emerald-100'}`}>
                                        <span className="font-bold block mb-1 opacity-50 uppercase text-[10px]">{msg.role}</span>
                                        {msg.content}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
