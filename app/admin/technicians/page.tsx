import { SidebarNav } from '@/components/admin/sidebar-nav';

export default function AdminTechniciansPage() {
    return (
        <div className="flex h-screen w-full bg-[#121212] font-sans">
            <aside className="w-16 flex-none bg-[#0a0a0a] border-r border-[#333] z-50">
                <SidebarNav />
            </aside>
            <main className="flex-1 overflow-y-auto bg-[#121212] flex items-center justify-center p-8 text-center text-slate-400">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-2">Sezione in Aggiornamento</h1>
                    <p>La gestione tecnici è in fase di migrazione dopo l'aggiornamento del database.</p>
                </div>
            </main>
        </div>
    );
}
