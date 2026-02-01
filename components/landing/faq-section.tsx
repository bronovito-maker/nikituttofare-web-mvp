'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQ_ITEMS = [
    {
        question: 'Come funziona la chatbot Niki?',
        answer: 'Descrivi il tuo problema a Niki come se parlassi con un amico. L\'AI analizza la richiesta, identifica il tipo di intervento necessario e trova il tecnico disponibile più vicino a te. Garantiamo l\'intervento entro 2 ore.',
    },
    {
        question: 'Quanto costa un intervento?',
        answer: 'I prezzi sono calcolati in modo trasparente usando i listini ufficiali della Regione Emilia-Romagna. Ricevi una stima prima dell\'arrivo del tecnico, e il prezzo finale rispecchia esattamente il lavoro svolto. Nessuna sorpresa.',
    },
    {
        question: 'Come vengono selezionati i tecnici?',
        answer: 'Ogni tecnico della nostra rete è verificato, certificato e assicurato fino a 1.000.000€. Controlliamo le credenziali, le recensioni e monitoriamo la qualità di ogni intervento.',
    },
    {
        question: 'Quali zone coprite?',
        answer: 'Attualmente operiamo su Rimini, Riccione, Cattolica, Santarcangelo, Bellaria e tutta la Riviera Romagnola. Stiamo espandendo — contattaci se vuoi il servizio nella tua zona.',
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
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <section className="py-16 sm:py-24 bg-background">
            <div className="max-w-3xl mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground mb-4">
                        Domande Frequenti
                    </h2>
                    <p className="text-muted-foreground text-lg">
                        Tutto quello che devi sapere su NikiTuttoFare
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
