import { createServerClient } from '@/lib/supabase-server'
import { SidebarNav } from '@/components/admin/sidebar-nav'
import { AddTechnicianDialog } from '@/components/admin/add-technician-dialog'
import { Badge } from '@/components/ui/badge'

export default async function AdminTechniciansPage() {
    const supabase = await createServerClient()

    const { data: technicians } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'technician')
        .order('created_at', { ascending: false })

    return (
        <div className="flex h-screen w-full bg-[#121212] font-sans">
            <aside className="w-16 flex-none bg-[#0a0a0a] border-r border-[#333] z-50">
                <SidebarNav />
            </aside>
            <main className="flex-1 overflow-y-auto bg-[#121212] p-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-white mb-2">Gestione Tecnici</h1>
                        <p className="text-gray-400">Lista dei tecnici abilitati</p>
                    </div>
                    <AddTechnicianDialog />
                </div>

                <div className="rounded-md border border-[#333] bg-[#1a1a1a]">
                    <div className="p-4 border-b border-[#333] grid grid-cols-4 gap-4 font-medium text-gray-400 text-sm">
                        <div>NOME</div>
                        <div>TELEFONO</div>
                        <div>EMAIL (AUTO)</div>
                        <div>STATO</div>
                    </div>
                    <div className="divide-y divide-[#333]">
                        {technicians?.map((tech) => (
                            <div key={tech.id} className="p-4 grid grid-cols-4 gap-4 text-white text-sm items-center">
                                <div className="font-medium">{tech.full_name}</div>
                                <div>{tech.phone}</div>
                                <div className="text-gray-500 text-xs truncate">{tech.email}</div>
                                <div><Badge className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20">Attivo</Badge></div>
                            </div>
                        ))}
                        {(!technicians || technicians.length === 0) && (
                            <div className="p-8 text-center text-gray-500">
                                Nessun tecnico trovato
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}
