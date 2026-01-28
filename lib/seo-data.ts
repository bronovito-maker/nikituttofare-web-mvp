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
    { name: 'Idraulico', slug: 'idraulico', priority: 0.9 },
    { name: 'Elettricista', slug: 'elettricista', priority: 0.9 },
    { name: 'Fabbro', slug: 'fabbro', priority: 0.8 },
    { name: 'Tapparellista', slug: 'tapparellista', priority: 0.7 },
    { name: 'Condizionamento', slug: 'condizionamento', priority: 0.8 },
    { name: 'Caldaie', slug: 'caldaie', priority: 0.8 },
    { name: 'Spurgo', slug: 'spurgo', priority: 0.7 },
    { name: 'Antennista', slug: 'antennista', priority: 0.6 },
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
