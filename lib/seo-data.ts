export interface City {
    name: string;
    slug: string;
    province: string;
    priority: number; // 0.1 to 1.0
    neighborhoods: string[];
}

export interface Service {
    name: string;
    slug: string;
    priority: number;
    examples: string;
    variants: string[];
    schemaType: string;
}

// Phase 1: Core Cities (Romagna)
export const SEO_CITIES: City[] = [
    { name: 'Rimini', slug: 'rimini', province: 'RN', priority: 0.9, neighborhoods: ['Marina Centro', 'Viserba', 'Marebello', 'San Giuliano', 'Gros Rimini'] },
    { name: 'Riccione', slug: 'riccione', province: 'RN', priority: 0.9, neighborhoods: ['Viale Ceccarini', 'Abissinia', 'Alba', 'San Lorenzo', 'Fontanelle'] },
    { name: 'Cattolica', slug: 'cattolica', province: 'RN', priority: 0.8, neighborhoods: ['Porto', 'Via Dante', 'Torconca'] },
    { name: 'Misano Adriatico', slug: 'misano-adriatico', province: 'RN', priority: 0.8, neighborhoods: ['Misano Monte', 'Porto Verde', 'Brasile'] },
    { name: 'Santarcangelo di Romagna', slug: 'santarcangelo', province: 'RN', priority: 0.8, neighborhoods: ['Centro Storico', 'San Vito', 'Stazione'] },
    { name: 'Bellaria-Igea Marina', slug: 'bellaria', province: 'RN', priority: 0.8, neighborhoods: ['Igea Marina', 'Cagnona', 'Bordonchio'] },
    { name: 'San Marino', slug: 'san-marino', province: 'RSM', priority: 0.8, neighborhoods: ['Dogana', 'Serravalle', 'Borgo Maggiore'] },
    { name: 'Coriano', slug: 'coriano', province: 'RN', priority: 0.6, neighborhoods: ['Ospedaletto', 'Passano', 'Cerasolo'] },
    { name: 'Verucchio', slug: 'verucchio', province: 'RN', priority: 0.6, neighborhoods: ['Villa Verucchio', 'Ponte Verucchio'] },
    { name: 'Morciano di Romagna', slug: 'morciano', province: 'RN', priority: 0.6, neighborhoods: ['Centro', 'Zona Artigianale'] },
];

// Phase 1: Core Services
export const SEO_SERVICES: Service[] = [
    {
        name: 'Idraulico',
        slug: 'idraulico',
        priority: 0.9,
        examples: 'Sostituzione rubinetti, perdite scarichi, silicone doccia.',
        variants: [
            'Dalla perdita improvvisa al cambio della rubinetteria per dare un nuovo volto al bagno: intervengo con precisione e pulizia.',
            'Curo ogni dettaglio del tuo impianto: risolvo perdite, scarichi intasati e mi occupo della manutenzione che gli altri trascurano.',
            'Nessun lavoro è troppo piccolo. Sono a tua disposizione per quei lavoretti idraulici che richiedono tempo e passione.'
        ],
        schemaType: 'PlumbingService'
    },
    {
        name: 'Elettricista',
        slug: 'elettricista',
        priority: 0.9,
        examples: 'Cambio prese, installazione luci smart, quadri elettrici.',
        variants: [
            'Metto in sicurezza ogni punto luce e mi occupo della manutenzione elettrica con la cura di chi vuole una casa funzionale.',
            'Dalle emergenze ai piccoli interventi di domotica: curo l&apos;elettricità di casa tua con disponibilità e trasparenza.',
            'Hai una presa che non va o vuoi cambiare i lampadari? Mi occupo di quei lavori elettrici che gli altri considerano minori.'
        ],
        schemaType: 'Electrician'
    },
    {
        name: 'Fabbro',
        slug: 'fabbro',
        priority: 0.8,
        examples: 'Serrature bloccate, apertura porte, installazione defender.',
        variants: [
            'Garantisco la tua sicurezza con l&apos;installazione di defender e cilindri europei, curando ogni serratura come fosse la mia.',
            'Sblocco porte e riparo serrature con precisione artigianale. La cura degli infissi è la mia priorità.',
            'Disponibile per la regolazione di cardini e chiusure: quei piccoli aggiustamenti che rendono la casa sicura e silenziosa.'
        ],
        schemaType: 'Locksmith'
    },
    {
        name: 'Tapparellista',
        slug: 'tapparellista',
        priority: 0.7,
        examples: 'Cinghie rotte, rulli bloccati, motorizzazioni.',
        variants: [
            'Rimetto a nuovo le tue tapparelle con cinghie e rulli di qualità. Cura e velocità per il tuo comfort quotidiano.',
            'Motorizzazione e manutenzione: rendo i tuoi avvolgibili silenziosi e facili da usare con interventi curati nel dettaglio.',
            'Mi occupo della piccola manutenzione su ogni tipo di infisso. Se gli altri non hanno tempo per una cinghia, io ci sono.'
        ],
        schemaType: 'HandymanService'
    },
    {
        name: 'Montaggio',
        slug: 'montaggio',
        priority: 0.8,
        examples: 'Mobili IKEA, scaffalature, montaggio cucine, pensili.',
        variants: [
            'Monto i tuoi mobili con la cura di chi ama il legno e il lavoro ben fatto. Precisione millimetrica garantita.',
            'Dalla piccola mensola alla cucina completa: assemblo ogni pezzo con attenzione, assicurando stabilità e pulizia.',
            'Hai comprato un mobile e non hai tempo di montarlo? Lo faccio io per te, curando ogni vite e ogni allineamento.'
        ],
        schemaType: 'HandymanService'
    },
    {
        name: 'Condizionamento',
        slug: 'condizionamento',
        priority: 0.8,
        examples: 'Ricarica gas, pulizia filtri, installazione split.',
        variants: [
            'Curo il clima di casa tua con igienizzazzioni profonde e ricariche gas. Per un’aria sana e un comfort costante.',
            'Manutenzione preventiva e riparazioni rapide su condizionatori: allungo la vita del tuo impianto con cura professionale.',
            'Pulizia filtri e controllo fumi? Intervengo con piacere per quei lavori di routine che assicurano efficienza e risparmio.'
        ],
        schemaType: 'HVACBusiness'
    },
    {
        name: 'Caldaie',
        slug: 'caldaie',
        priority: 0.8,
        examples: 'Manutenzione annuale, analisi fumi, riparazione guasti.',
        variants: [
            'Assistenza e cura per la tua caldaia: dalla riparazione urgente alla manutenzione che ne garantisce la sicurezza nel tempo.',
            'Riduco i tuoi consumi ottimizzando la resa della caldaia con controlli meticolosi e pulizia bruciatori.',
            'Pronto per le verifiche annuali o per risolvere quei piccoli rumori fastidiosi che gli altri ignorano.'
        ],
        schemaType: 'HVACBusiness'
    },
    {
        name: 'Spurgo',
        slug: 'spurgo',
        priority: 0.7,
        examples: 'Pulizia fosse biologiche, stasatura scarichi cucina.',
        variants: [
            'Risolvo allagamenti e staso scarichi con attrezzature moderne, garantendo una pulizia finale impeccabile della zona.',
            'Prevenzione e cura degli scarichi: elimino cattivi odori e intoppi prima che diventino emergenze gravi.',
            'Nessuno scarico è troppo piccolo per me. Curo l&apos;efficienza idrica di casa tua con interventi rapidi e discreti.'
        ],
        schemaType: 'SepticTankService'
    },
    {
        name: 'Antennista',
        slug: 'antennista',
        priority: 0.6,
        examples: 'Puntamento parabola, ricezione canali TV, impianti WiFi.',
        variants: [
            'Rifaccio il puntamento e curo la ricezione del segnale per farti godere i tuoi canali preferiti senza disturbi.',
            'Configurazione smart TV e potenziamento segnale WiFi: curo la connessione di casa tua con precisione digitale.',
            'Se la TV non si vede o il WiFi è lento, intervengo anche per le piccole regolazioni che fanno la differenza.'
        ],
        schemaType: 'HandymanService'
    },
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
