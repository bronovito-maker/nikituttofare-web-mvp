import { createServerClient } from '@/lib/supabase-server'
import { JobCard } from '@/components/technician/job-card'
import { redirect } from 'next/navigation'

export default async function TechnicianClaimPage() {
  const supabase = await createServerClient()

  // 1. Check Auth & Role
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'technician') {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        Accesso riservato ai tecnici
      </div>
    )
  }

  // 2. Fetch Pending Jobs
  const { data: tickets } = await supabase
    .from('tickets')
    .select('*')
    .or('status.eq.pending_verification,status.eq.new') // Fetching potential jobs
    .is('assigned_technician_id', null)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-[#121212] text-white p-4 pb-20">
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">Lavori Disponibili</h1>
          <p className="text-gray-400 text-sm">Seleziona un incarico per accettarlo</p>
        </div>
        <div className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-mono border border-emerald-500/20">
          {tickets?.length || 0} ATTIVI
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tickets?.map((ticket) => (
          <JobCard key={ticket.id} ticket={ticket} />
        ))}

        {(!tickets || tickets.length === 0) && (
          <div className="col-span-full py-20 text-center text-gray-500 border border-dashed border-[#333] rounded-lg">
            <p>Nessun nuovo lavoro disponibile al momento.</p>
            <p className="text-xs mt-2">Riceverai una notifica quando ci saranno nuove richieste.</p>
          </div>
        )}
      </div>
    </div>
  )
}
