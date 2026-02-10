export interface City {
    name: string;
    slug: string;
    province: string;
    priority: number; // 0.1 to 1.0
}

export interface Service {
    name: string;
    slug: string;
    priority: number;
    examples: string;
}

// Phase 1: Core Cities (Romagna)
export const SEO_CITIES: City[] = [
    { name: 'Rimini', slug: 'rimini', province: 'RN', priority: 0.9 },
    { name: 'Riccione', slug: 'riccione', province: 'RN', priority: 0.9 },
    { name: 'Cattolica', slug: 'cattolica', province: 'RN', priority: 0.8 },
    { name: 'Misano Adriatico', slug: 'misano-adriatico', province: 'RN', priority: 0.8 },
    { name: 'Santarcangelo di Romagna', slug: 'santarcangelo', province: 'RN', priority: 0.8 },
    { name: 'Bellaria-Igea Marina', slug: 'bellaria', province: 'RN', priority: 0.8 },
    { name: 'San Marino', slug: 'san-marino', province: 'RSM', priority: 0.8 },
    { name: 'Coriano', slug: 'coriano', province: 'RN', priority: 0.6 },
    { name: 'Verucchio', slug: 'verucchio', province: 'RN', priority: 0.6 },
    { name: 'Morciano di Romagna', slug: 'morciano', province: 'RN', priority: 0.6 },
];

// Phase 1: Core Services
export const SEO_SERVICES: Service[] = [
    { name: 'Idraulico', slug: 'idraulico', priority: 0.9, examples: 'Sostituzione rubinetti, perdite scarichi, silicone doccia.' },
    { name: 'Elettricista', slug: 'elettricista', priority: 0.9, examples: 'Cambio prese, installazione luci smart, quadri elettrici.' },
    { name: 'Fabbro', slug: 'fabbro', priority: 0.8, examples: 'Serrature bloccate, apertura porte, installazione defender.' },
    { name: 'Tapparellista', slug: 'tapparellista', priority: 0.7, examples: 'Cinghie rotte, rulli bloccati, motorizzazioni.' },
    { name: 'Condizionamento', slug: 'condizionamento', priority: 0.8, examples: 'Ricarica gas, pulizia filtri, installazione split.' },
    { name: 'Caldaie', slug: 'caldaie', priority: 0.8, examples: 'Manutenzione annuale, analisi fumi, riparazione guasti.' },
    { name: 'Spurgo', slug: 'spurgo', priority: 0.7, examples: 'Pulizia fosse biologiche, stasatura scarichi cucina.' },
    { name: 'Antennista', slug: 'antennista', priority: 0.6, examples: 'Puntamento parabola, ricezione canali TV, impianti WiFi.' },
];

// Simulation of DB Fetch
export async function fetchSeoData() {
    // In Phase 2, this will be replaced by:
    // const { data } = await supabase.from('cities').select('*');
    return {
        cities: SEO_CITIES,
        services: SEO_SERVICES
    };
}
