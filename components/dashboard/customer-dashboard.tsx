'use client';

import { createBrowserClient } from '@supabase/ssr';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { type Database } from '@/lib/database.types';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { MobileNav } from '@/components/dashboard/mobile-nav';
import { DigitalPassportPreview } from '@/components/dashboard/digital-passport-preview';
import { HeroTile } from '@/components/dashboard/hero-tile';
import { ActionTile } from '@/components/dashboard/action-tile';
import { LoyaltyTile } from '@/components/dashboard/loyalty-tile';

interface CustomerDashboardProps {
    readonly initialTickets: any[]; // Using loose type for speed without blocking on complex DB types
    readonly userProfile?: any;
}

export function CustomerDashboard({ initialTickets, userProfile }: CustomerDashboardProps) {
    const router = useRouter();
    const [tickets, setTickets] = useState(initialTickets);
    // Find the most relevant active ticket (New > Assigned > In Progress)
    const activeTicket = tickets.find(t => ['new', 'assigned', 'in_progress'].includes(t.status));



    // Realtime Subscription
    useEffect(() => {
        const supabase = createBrowserClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const handleRealtimeUpdate = (payload: RealtimePostgresChangesPayload<any>) => {
            console.log('Realtime update:', payload);
            router.refresh();

            if (payload.eventType === 'UPDATE') {
                setTickets(prev => prev.map(t => t.id === payload.new.id ? { ...t, ...payload.new } : t));
            } else if (payload.eventType === 'INSERT') {
                setTickets(prev => [payload.new, ...prev]);
            }
        };

        const channel = supabase
            .channel('dashboard-tickets')
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to all events (INSERT, UPDATE)
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
    }, [userProfile, router]); // Re-subscribe if profile changes match



    return (
        <div className="min-h-screen bg-[#0f0f0f] text-slate-200 pb-24 md:pb-8 selection:bg-emerald-500/30">

            <DashboardHeader />

            {/* Main Content: Bento Grid */}
            <main className="container mx-auto max-w-5xl px-4 pt-24 space-y-6">

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 auto-rows-[minmax(180px,auto)]">
                    {/* Tile A: Hero (Spans full width on mobile, 8 cols on desktop) */}
                    <div className="md:col-span-8 md:row-span-2">
                        <HeroTile activeTicket={activeTicket} />
                    </div>

                    {/* Tile B: Action (Spans half on mobile, 4 cols on desktop) */}
                    <div className="md:col-span-4">
                        <ActionTile />
                    </div>

                    {/* Tile C: Loyalty (Spans half on mobile, 4 cols on desktop) */}
                    <div className="md:col-span-4">
                        <LoyaltyTile points={userProfile?.loyalty_points || 0} />
                    </div>
                </div>

                <DigitalPassportPreview />
            </main>

            <MobileNav />
        </div>
    );
}
