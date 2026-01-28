import { createServerClient } from '@/lib/supabase-server'
import { SidebarNav } from '@/components/admin/sidebar-nav'
import { AddTechnicianDialog } from '@/components/admin/add-technician-dialog'
import { Badge } from '@/components/ui/badge'
import { TechnicianActions } from '@/components/admin/technician-actions'

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
                    <div className="p-4 border-b border-[#333] grid grid-cols-5 gap-4 font-medium text-gray-400 text-sm">
                        <div className="col-span-1">NOME</div>
                        <div className="col-span-1">TELEFONO</div>
                        <div className="col-span-1">EMAIL (AUTO)</div>
                        <div className="col-span-1">STATO</div>
                        <div className="col-span-1 text-right">AZIONI</div>
                    </div>
                    <div className="divide-y divide-[#333]">
                        {technicians?.map((tech) => {
                            const isActive = tech.is_active !== false;
                            return (
                                <div key={tech.id} className="p-4 grid grid-cols-5 gap-4 text-white text-sm items-center">
                                    <div className="font-medium col-span-1">{tech.full_name}</div>
                                    <div className="col-span-1">{tech.phone}</div>
                                    <div className="text-gray-500 text-xs truncate col-span-1">{tech.email}</div>
                                    <div className="col-span-1">
                                        <Badge
                                            className={`${isActive
                                                ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                                                : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'}`}
                                        >
                                            {isActive ? 'Attivo' : 'Disattivato'}
                                        </Badge>
                                    </div>
                                    <div className="col-span-1 flex justify-end">
                                        <TechnicianActions technician={tech} />
                                    </div>
                                </div>
                            );
                        })}
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
