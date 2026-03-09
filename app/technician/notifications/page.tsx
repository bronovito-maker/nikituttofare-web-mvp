'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase-browser';

export default function NotificationsPage() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createBrowserClient();

    useEffect(() => {
        const fetchNotifications = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            // In a real app, we'd have a notifications table. 
            // For now, we'll simulate by fetching low stock items as alerts.
            const { data: lowStock } = await (supabase as any)
                .from('inventory_items')
                .select('*')
                .lt('quantity_at_hand', 5);

            const alerts = ((lowStock as any[]) || []).map(item => ({
                id: item.id,
                title: 'Scorta in esaurimento',
                message: `L'articolo "${item.name}" sta per finire (${item.quantity_at_hand} ${item.unit_of_measure} rimanenti).`,
                type: 'inventory',
                created_at: new Date().toISOString(),
                is_read: false
            }));

            setNotifications(alerts);
            setLoading(false);
        };

        fetchNotifications();
    }, [supabase, router]);

    return (
        <div className="min-h-screen bg-[#0F172A] text-white">
            <div className="bg-slate-900 border-b border-slate-800 p-6 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto flex items-center gap-4">
                    <button onClick={() => router.back()} className="text-slate-400 p-2 hover:bg-slate-800 rounded-full transition-colors">
                        ←
                    </button>
                    <h1 className="text-xl font-bold">Centro Notifiche</h1>
                </div>
            </div>

            <main className="max-w-4xl mx-auto p-4 md:p-6 pb-24">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : notifications.length > 0 ? (
                    <div className="space-y-4">
                        {notifications.map((notif) => (
                            <div key={notif.id} className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl flex gap-4 backdrop-blur-xl transition-all hover:border-slate-700">
                                <div className="text-2xl p-3 bg-amber-500/10 rounded-xl h-fit">
                                    {notif.type === 'inventory' ? '📦' : '🔔'}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-1">
                                        <h2 className="font-bold text-slate-200">{notif.title}</h2>
                                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest bg-slate-800 px-2 py-0.5 rounded">
                                            {new Date(notif.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-400 leading-relaxed">
                                        {notif.message}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-24 text-slate-500">
                        <div className="text-4xl mb-4">📭</div>
                        <p>Al momento non ci sono notifiche.</p>
                        <p className="text-xs mt-2 opacity-50">Ti avviseremo quando ci saranno aggiornamenti importanti.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
