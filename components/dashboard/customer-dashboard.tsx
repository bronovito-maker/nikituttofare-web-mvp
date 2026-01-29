'use client';

import { useRealtimeTickets } from '@/hooks/use-realtime-tickets';
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
    // Realtime Subscription
    const { tickets } = useRealtimeTickets(initialTickets, userProfile);

    // Find the most relevant active ticket (New > Assigned > In Progress)
    const activeTicket = tickets.find(t => ['new', 'assigned', 'in_progress'].includes(t.status));



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
