'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import { Phone, Mail, Navigation } from 'lucide-react';

// Fix for default marker icons in Next.js
// We use custom DivIcon so this might be less critical but good to have if we fallback
/*
 delete (L.Icon.Default.prototype as any)._getIconUrl;
 L.Icon.Default.mergeOptions({
   iconRetinaUrl: '/marker-icon-2x.png',
   iconUrl: '/marker-icon.png',
   shadowUrl: '/marker-shadow.png',
 });
*/

interface LeadsMapProps {
    leads: any[];
}

// Parse Postgres POINT(x y)
const parsePoint = (pointStr: any) => {
    if (!pointStr || typeof pointStr !== 'string') return null;
    // Format is usually (lon,lat) e.g. (12.492,41.890) from point type
    // Or sometimes POINT(12.492 41.890) if coming from geometry
    // Let's handle (lon,lat) as inserted by our script
    const content = pointStr.replace(/[()]/g, '');
    const parts = content.split(',');
    if (parts.length === 2) {
        return { lat: parseFloat(parts[1]), lng: parseFloat(parts[0]) };
    }
    return null;
};

const createCustomIcon = (status: string) => {
    let colorClass = 'bg-gray-500';
    if (status === 'confirmed') colorClass = 'bg-green-500 hover:bg-green-600';
    else if (status === 'visited') colorClass = 'bg-blue-500 hover:bg-blue-600';
    else if (status === 'mail_sent') colorClass = 'bg-yellow-500 hover:bg-yellow-600';
    else if (status === 'to_contact') colorClass = 'bg-red-500 hover:bg-red-600';

    return L.divIcon({
        html: `<div class="${colorClass} w-4 h-4 rounded-full border-2 border-white shadow-lg transform transition-transform hover:scale-125"></div>`,
        className: 'bg-transparent', // Remove default square background
        iconSize: [16, 16],
        iconAnchor: [8, 8],
        popupAnchor: [0, -10]
    });
};

export default function LeadsMap({ leads }: LeadsMapProps) {
    // Filter leads with coordinates
    const markers = leads
        .map(l => {
            const coords = l.coordinates ? parsePoint(l.coordinates) : null;
            if (!coords || isNaN(coords.lat)) return null;

            // Determine status for color
            let status = 'to_contact';
            if (l.status_confirmed) status = 'confirmed';
            else if (l.status_visited) status = 'visited';
            else if (l.status_mail_sent) status = 'mail_sent';

            return { ...l, lat: coords.lat, lng: coords.lng, status };
        })
        .filter(l => l !== null);

    // Default center (Italy roughly or first lead)
    const defaultCenter = markers.length > 0
        ? [markers[0].lat, markers[0].lng]
        : [41.9028, 12.4964] as [number, number];

    return (
        <div className="w-full h-full min-h-[500px] relative z-0">
            <MapContainer
                center={defaultCenter as L.LatLngExpression}
                zoom={markers.length > 0 ? 10 : 6}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {markers.map((lead: any) => (
                    <Marker
                        key={lead.id}
                        position={[lead.lat, lead.lng]}
                        icon={createCustomIcon(lead.status)}
                    >
                        <Popup className="min-w-[200px]">
                            <div className="space-y-2 p-1">
                                <h3 className="font-bold text-base">{lead.name}</h3>
                                <p className="text-xs text-stone-500">{lead.address}</p>
                                <div className="flex gap-2 mt-2">
                                    {lead.phone && (
                                        <Button size="sm" variant="outline" className="h-7 px-2" asChild>
                                            <a href={`tel:${lead.phone}`}><Phone className="w-3 h-3 mr-1" /> Chiama</a>
                                        </Button>
                                    )}
                                    <Button size="sm" variant="default" className="h-7 px-2" asChild>
                                        <a href={`https://www.google.com/maps/dir/?api=1&destination=${lead.lat},${lead.lng}`} target="_blank" rel="noopener noreferrer">
                                            <Navigation className="w-3 h-3 mr-1" /> Vai
                                        </a>
                                    </Button>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
