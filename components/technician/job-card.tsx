import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { it } from 'date-fns/locale'

interface JobCardProps {
    ticket: any // Using specific type if available would be better, but 'any' for speed now as Types matches DB
}

export function JobCard({ ticket }: Readonly<JobCardProps>) {
    return (
        <div className="rounded-lg border border-border bg-card p-4 text-card-foreground hover:border-orange-500/50 transition-colors shadow-sm">
            <div className="flex justify-between items-start mb-3">
                <div className="flex gap-2">
                    <Badge variant="outline" className="border-orange-500/30 text-orange-400 bg-orange-500/10 uppercase text-[10px] tracking-wider">
                        {ticket.category}
                    </Badge>
                    {ticket.priority === 'emergency' && (
                        <Badge variant="destructive" className="animate-pulse shadow-sm shadow-red-900/20">URGENTE</Badge>
                    )}
                </div>
                <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true, locale: it })}
                </span>
            </div>

            <h3 className="font-semibold text-lg mb-2 line-clamp-1 text-foreground">{ticket.description}</h3>

            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="truncate">{ticket.city || ticket.address || 'Posizione non specificata'}</span>
            </div>

            <div className="flex justify-between items-center mt-4 pt-4 border-t border-border">
                <div className="text-xs text-muted-foreground">
                    ID: {ticket.id.slice(0, 8)}...
                </div>
                <Button asChild size="sm" className="bg-orange-600 text-white hover:bg-orange-500 shadow-lg shadow-orange-900/10 border-0">
                    <Link href={`/technician/job/${ticket.id}`}>
                        Dettagli <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                </Button>
            </div>
        </div>
    )
}
