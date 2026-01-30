import { createServerClient } from '@/lib/supabase-server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'


export default async function TechnicianMyJobsPage() {
    const supabase = await createServerClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return redirect('/login')

    // Verify Role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'technician') return redirect('/')

    const { data: jobs } = await supabase
        .from('tickets')
        .select('*')
        .eq('assigned_technician_id', user.id)
        .eq('status', 'assigned')
        .order('assigned_at', { ascending: false })

    return (
        <div className="min-h-screen bg-background text-foreground p-4 pb-20 font-sans">
            <header className="mb-6">
                <h1 className="text-xl font-bold text-foreground">I Miei Lavori Attivi</h1>
                <p className="text-muted-foreground text-sm">Interventi in corso o programmati</p>
            </header>

            <div className="space-y-4">
                {jobs?.map((job) => (
                    <div key={job.id} className="bg-card border border-l-4 border-border border-l-emerald-500 rounded-lg p-4 relative">
                        <div className="flex justify-between items-start mb-2">
                            <Badge variant="outline" className="border-emerald-500/30 text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 text-[10px] uppercase">
                                {job.category}
                            </Badge>
                            {job.priority === 'emergency' && (
                                <span className="text-red-500 dark:text-red-400 text-[10px] font-bold animate-pulse px-2 bg-red-500/10 dark:bg-red-900/20 rounded">URGENTE</span>
                            )}
                        </div>

                        <h3 className="font-semibold text-lg leading-tight mb-2 pr-10 text-foreground">{job.description}</h3>

                        <div className="flex items-center text-sm text-muted-foreground mb-4">
                            <MapPin className="w-4 h-4 mr-1" />
                            <span className="truncate max-w-[200px]">{job.city || job.address}</span>
                        </div>

                        <Button asChild size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                            <Link href={`/technician/jobs/${job.id}`}>
                                Apri Intervento <ArrowRight className="w-4 h-4 ml-2" />
                            </Link>
                        </Button>
                    </div>
                ))}

                {(!jobs || jobs.length === 0) && (
                    <div className="text-center py-20 text-muted-foreground">
                        <p>Nessun lavoro attivo.</p>
                        <Button variant="link" className="text-emerald-500 dark:text-emerald-400 mt-2" asChild>
                            <Link href="/technician/claim">Cerca nuovi lavori</Link>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
