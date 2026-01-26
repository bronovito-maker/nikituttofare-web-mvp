import { SidebarNav } from '@/components/admin/sidebar-nav';

export default function AdminSettingsPage() {
    return (
        <div className="flex h-screen w-full bg-[#121212] font-sans">
            <aside className="w-16 flex-none bg-[#0a0a0a] border-r border-[#333] z-50">
                <SidebarNav />
            </aside>
            <main className="flex-1 flex items-center justify-center text-slate-500">
                Impostazioni - Work in Progress
            </main>
        </div>
    );
}
