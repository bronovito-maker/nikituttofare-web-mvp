import { createServerClient } from '@/lib/supabase-server'
import { AddTechnicianDialog } from '@/components/admin/add-technician-dialog'
import { Badge } from '@/components/ui/badge'
import { TechnicianActions } from '@/components/admin/technician-actions'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function AdminTechniciansPage() {
    const supabase = await createServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    const isAdmin = user?.user_metadata?.role === 'admin' || user?.email === 'bronovito@gmail.com'

    if (error || !user || !isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center space-y-4">
                <h1 className="text-4xl font-bold text-red-600">403 Forbidden</h1>
                <Button asChild variant="outline">
                    <Link href="/">Torna alla Home</Link>
                </Button>
            </div>
        )
    }

    const { data: technicians } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'technician')
        .order('created_at', { ascending: false })

    return (
        <div className="flex h-screen w-full bg-background font-sans">
            {/* Sidebar removed (Handled by Layout) */}
            <div className="flex-1 overflow-y-auto bg-background p-4 md:p-8 pt-16 md:pt-8 h-full"> {/* Added pt-16 for mobile menu space */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground mb-1">Gestione Tecnici</h1>
                        <p className="text-muted-foreground text-sm">Lista dei tecnici abilitati</p>
                    </div>
                    <div className="w-full md:w-auto">
                        <AddTechnicianDialog />
                    </div>
                </div>

                <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xl">
                    {/* Desktop Headers */}
                    <div className="hidden md:grid p-4 border-b border-border grid-cols-5 gap-4 font-medium text-muted-foreground text-sm bg-secondary">
                        <div className="col-span-1">NOME</div>
                        <div className="col-span-1">TELEFONO</div>
                        <div className="col-span-1">EMAIL (AUTO)</div>
                        <div className="col-span-1">STATO</div>
                        <div className="col-span-1 text-right">AZIONI</div>
                    </div>

                    <div className="divide-y divide-border">
                        {technicians?.map((tech) => {
                            const isActive = tech.is_active !== false;
                            return (
                                <div key={tech.id} className="p-4 flex flex-col md:grid md:grid-cols-5 gap-3 md:gap-4 text-foreground text-sm relative group hover:bg-secondary/50 transition-colors">
                                    {/* Mobile: Label + Value Layout */}
                                    <div className="font-medium col-span-1 text-base md:text-sm flex justify-between items-center md:block">
                                        <span className="md:hidden text-muted-foreground font-normal">Nome:</span>
                                        {tech.full_name}
                                    </div>

                                    <div className="col-span-1 flex justify-between items-center md:block">
                                        <span className="md:hidden text-muted-foreground font-normal">Telefono:</span>
                                        {tech.phone}
                                    </div>

                                    <div className="text-muted-foreground text-xs md:truncate col-span-1 flex justify-between items-center md:block">
                                        <span className="md:hidden text-muted-foreground font-normal text-sm">Email:</span>
                                        {tech.email}
                                    </div>

                                    <div className="col-span-1 flex justify-between items-center md:block">
                                        <span className="md:hidden text-muted-foreground font-normal">Stato:</span>
                                        <Badge
                                            className={`${isActive
                                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                                                : 'bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20'}`}
                                        >
                                            {isActive ? 'Attivo' : 'Disattivato'}
                                        </Badge>
                                    </div>

                                    {/* Actions: Mobile (Absolute Bottom Right or Flex End) */}
                                    <div className="col-span-1 flex justify-end mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-0 border-border">
                                        <TechnicianActions technician={tech} />
                                    </div>
                                </div>
                            );
                        })}
                        {(!technicians || technicians.length === 0) && (
                            <div className="p-8 text-center text-muted-foreground">
                                Nessun tecnico trovato
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
