'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; // Assuming shadcn path or adjusting
import { LeadsTable } from './table';
// import { Database } from '@/types/supabase'; // Types not yet generated for new table
import { Card } from '@/components/ui/card';

// Dynamically import Map to avoid SSR issues with Leaflet
const LeadsMap = dynamic(() => import('./map'), {
    ssr: false,
    loading: () => <div className="h-[600px] w-full bg-muted animate-pulse flex items-center justify-center">Caricamento Mappa...</div>
});

interface Lead {
    id: string;
    name: string;
    city: string | null;
    type: string | null;
    rating: number;
    address: string | null;
    phone: string | null;
    email: string | null;
    status_mail_sent: boolean;
    status_called: boolean;
    status_visited: boolean;
    status_confirmed: boolean;
    notes: string | null;
    coordinates: any; // Point type is tricky on client without parsing
    created_at: string;
}

interface LeadsClientProps {
    leads: Lead[];
}

export function LeadsClient({ leads }: LeadsClientProps) {
    const [activeTab, setActiveTab] = useState('list');

    return (
        <Tabs defaultValue="list" className="w-full" onValueChange={setActiveTab}>
            <div className="flex justify-start mb-4">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="list">📋 Lista</TabsTrigger>
                    <TabsTrigger value="map">🗺️ Mappa</TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="list" className="space-y-4">
                <Card className="p-4 border-none shadow-none bg-transparent">
                    <LeadsTable leads={leads} />
                </Card>
            </TabsContent>

            <TabsContent value="map" className="h-[calc(100vh-200px)] min-h-[500px] rounded-xl overflow-hidden border">
                {/* Only render map when tab is active to force resize/render correctly or just keep it mounting? 
            Sometimes Leaflet needs invalidatesize. Dynamic import usually handles mount. */}
                {activeTab === 'map' && <LeadsMap leads={leads} />}
            </TabsContent>
        </Tabs>
    );
}
