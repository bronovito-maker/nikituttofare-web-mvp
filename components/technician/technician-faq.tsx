'use client';

import { FAQAccordion, type FAQItem } from '@/components/ui/faq-accordion';

const FAQ_ITEMS: FAQItem[] = [
    {
        question: 'Quanto costa far parte di NikiTuttoFare?',
        answer: "Nessun costo di iscrizione. Tratteniamo una commissione sul lavoro completato per la gestione della piattaforma e l'acquisizione clienti. Discutiamo i dettagli in fase di colloquio.",
    },
    {
        question: 'Come vengono assegnati i lavori?',
        answer: 'In base alla tua disponibilità, specializzazione e vicinanza al cliente. Ricevi una notifica con tutti i dettagli e puoi accettare o rifiutare liberamente.',
    },
    {
        question: 'Quali specializzazioni cercate?',
        answer: 'Idraulica, Elettricità, Fabbro, Climatizzazione, Manutenzione generica, Edilizia. Siamo aperti a valutare altre competenze.',
    },
    {
        question: 'Come funziona il sistema di pagamento?',
        answer: 'Pagamenti automatici e garantiti dalla piattaforma a intervalli regolari, dopo il completamento e la conferma del cliente.',
    },
    {
        question: 'Posso stabilire le mie tariffe?',
        answer: 'Lavoriamo con listini standard della Regione Emilia-Romagna per garantire trasparenza. Discutiamo le condizioni specifiche in fase di colloquio.',
    },
    {
        question: 'Devo essere sempre disponibile H24?',
        answer: 'No, puoi impostare la tua disponibilità come preferisci. Offriamo un servizio H24, ma ogni tecnico gestisce la propria agenda.',
    },
];

export function TechnicianFAQ() {
    return (
        <FAQAccordion
            items={FAQ_ITEMS}
            title="Domande Frequenti"
            subtitle="Tutto quello che devi sapere prima di candidarti"
            sectionClassName="bg-slate-50 dark:bg-black/50"
        />
    );
}
