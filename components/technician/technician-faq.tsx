'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQ_ITEMS = [
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
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <section className="py-16 sm:py-24 bg-slate-50 dark:bg-black/50">
            <div className="max-w-3xl mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground mb-4">
                        Domande Frequenti
                    </h2>
                    <p className="text-muted-foreground text-lg">
                        Tutto quello che devi sapere prima di candidarti
                    </p>
                </div>

                <div className="space-y-3">
                    {FAQ_ITEMS.map((item, index) => (
                        <div
                            key={index}
                            className="bg-card border border-border rounded-2xl overflow-hidden transition-all duration-300"
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/50 transition-colors"
                            >
                                <span className="font-semibold text-foreground pr-4">{item.question}</span>
                                <ChevronDown
                                    className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''
                                        }`}
                                />
                            </button>
                            <div
                                className={`overflow-hidden transition-all duration-300 ${openIndex === index ? 'max-h-96' : 'max-h-0'
                                    }`}
                            >
                                <div className="px-5 pb-5 text-muted-foreground leading-relaxed">
                                    {item.answer}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
