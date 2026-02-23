'use client';

import { FAQAccordion, type FAQItem } from '@/components/ui/faq-accordion';

const FAQ_ITEMS: FAQItem[] = [
    {
        question: 'Come funziona la chatbot Niki?',
        answer: "Descrivi il tuo problema a Niki come se parlassi con un amico. L'AI analizza la richiesta, identifica il tipo di intervento e organizza il mio arrivo prioritario da te. Di solito sono lì in meno di 2 ore.",
    },
    {
        question: 'Quanto costa un intervento?',
        answer: 'I prezzi sono calcolati in modo trasparente usando i listini ufficiali della Regione Emilia-Romagna. Ricevi una stima prima dell\'arrivo del tecnico, e il prezzo finale rispecchia esattamente il lavoro svolto. Nessuna sorpresa.',
    },
    {
        question: 'Come vengono selezionati i tecnici?',
        answer: 'Sono io a intervenire personalmente. Sono un professionista certificato e assicurato. Metto la mia firma su ogni lavoro e ne garantisco la qualità totale.',
    },
    {
        question: 'Quali zone coprite?',
        answer: 'Attualmente intervengo personalmente su Rimini, Riccione, Cattolica, Santarcangelo, Bellaria e tutta la Riviera Romagnola.',
    },
    {
        question: 'Posso richiedere un preventivo senza impegno?',
        answer: 'Assolutamente sì. Chatta con Niki, descrivi il problema e riceverai una stima indicativa. Non sei obbligato a procedere. Decidi tu quando e se confermare l\'intervento.',
    },
    {
        question: 'Come funziona il Passaporto Digitale?',
        answer: 'Ogni asset (caldaia, condizionatore, impianto elettrico) ha un suo "passaporto" dove registriamo tutti gli interventi. Così sai sempre quando è stata fatta l\'ultima manutenzione e cosa è stato sostituito.',
    },
];

export function FAQSection() {
    return (
        <FAQAccordion
            items={FAQ_ITEMS}
            title="Domande Frequenti"
            subtitle="Tutto quello che devi sapere su NikiTuttoFare"
            sectionClassName="bg-background"
        />
    );
}
