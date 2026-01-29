
import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase-browser';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

function updateTicket(tickets: any[], newTicket: any) {
    return tickets.map(t => t.id === newTicket.id ? { ...t, ...newTicket } : t);
}

function insertTicket(tickets: any[], newTicket: any) {
    return [newTicket, ...tickets];
}

export function useRealtimeTickets(initialTickets: any[], userProfile?: any) {
    const router = useRouter();
    const [tickets, setTickets] = useState(initialTickets);

    useEffect(() => {
        const supabase = createBrowserClient();

        const handleRealtimeUpdate = (payload: RealtimePostgresChangesPayload<any>) => {
            console.log('Realtime update:', payload);
            router.refresh();

            const isUpdate = payload.eventType === 'UPDATE';
            const isInsert = payload.eventType === 'INSERT';

            if (isUpdate) {
                setTickets(prev => updateTicket(prev, payload.new));
            }

            if (isInsert) {
                setTickets(prev => insertTicket(prev, payload.new));
            }
        };

        const channel = supabase
            .channel('dashboard-tickets')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'tickets',
                    filter: userProfile ? `user_id=eq.${userProfile.id}` : undefined,
                },
                handleRealtimeUpdate
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userProfile, router]);

    return { tickets };
}
