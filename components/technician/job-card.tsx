import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Clock, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { it } from 'date-fns/locale'

interface JobCardProps {
    ticket: any // Using specific type if available would be better, but 'any' for speed now as Types matches DB
}

export function JobCard({ ticket }: JobCardProps) {
    return (
        <div className="rounded-lg border border-[#333] bg-[#1a1a1a] p-4 text-white hover:border-emerald-500/50 transition-colors">
            <div className="flex justify-between items-start mb-3">
                <div className="flex gap-2">
                    <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 uppercase text-[10px] tracking-wider">
                        {ticket.category}
                    </Badge>
                    {ticket.priority === 'emergency' && (
                        <Badge variant="destructive" className="animate-pulse">URGENTE</Badge>
                    )}
                </div>
                <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true, locale: it })}
                </span>
            </div>

            <h3 className="font-semibold text-lg mb-2 line-clamp-1">{ticket.description}</h3>

            <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="truncate">{ticket.city || ticket.address || 'Posizione non specificata'}</span>
            </div>

            <div className="flex justify-between items-center mt-4 pt-4 border-t border-[#333]">
                <div className="text-xs text-gray-500">
                    ID: {ticket.id.slice(0, 8)}...
                </div>
                <Button asChild size="sm" className="bg-white text-black hover:bg-gray-200">
                    <Link href={`/technician/job/${ticket.id}`}>
                        Dettagli <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                </Button>
            </div>
        </div>
    )
}
