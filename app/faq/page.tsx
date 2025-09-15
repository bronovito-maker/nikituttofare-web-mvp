// app/faq/page.tsx
import { NextPage } from 'next';
import Link from 'next/link';

// Dati delle FAQ: le domande sono pensate per superare le obiezioni comuni.
const faqData = [
  {
    question: "Perché i vostri prezzi sembrano più alti di un artigiano 'classico'?",
    answer: "La nostra non è solo una stima per il lavoro, ma per un servizio completo e senza sorprese. Il prezzo che vedi include la chiamata, la manodopera specializzata, i materiali di consumo standard e la garanzia sul lavoro. Con noi hai una stima chiara e immediata, un intervento rapido e la sicurezza di un lavoro fatturato e garantito, evitando costi nascosti o attese interminabili."
  },
  {
    question: "Cosa succede se il problema è più complicato del previsto?",
    answer: "La trasparenza è la nostra priorità. Se il tecnico si accorge che il lavoro richiede più tempo o materiali, si ferma immediatamente. Ti spiegherà la situazione e ti fornirà un nuovo preventivo chiaro. Nessun lavoro extra verrà mai eseguito senza la tua piena approvazione. Il controllo è sempre nelle tue mani."
  },
  {
    question: "Il lavoro è garantito? Chi sono i vostri tecnici?",
    answer: "Assolutamente sì. Ogni intervento è coperto da garanzia e regolarmente fatturato. Collaboriamo solo con artigiani e professionisti qualificati di Livorno e provincia, selezionati per la loro esperienza e affidabilità, per assicurarti un lavoro eseguito a regola d'arte."
  },
  {
    question: "Come funziona il processo, dalla chat all'intervento?",
    answer: "Abbiamo reso tutto il più semplice possibile: 1) Chatta con il nostro assistente virtuale per descrivere il problema e ottenere una stima immediata. 2) Se la stima ti convince, un nostro specialista ti contatterà telefonicamente per confermare i dettagli. 3) Il tecnico arriva all'orario concordato e, prima di iniziare, conferma il prezzo finale. 4) Il lavoro viene eseguito e risolto."
  },
  {
    question: "In quanto tempo potete intervenire?",
    answer: "La nostra forza è la rapidità. Per problemi non urgenti, solitamente interveniamo entro 24/48 ore. Per le urgenze (come perdite d'acqua o problemi elettrici), facciamo il possibile per essere da te in poche ore, anche nei weekend, a seconda della disponibilità dei tecnici."
  },
];

const FAQPage: NextPage = () => {
  return (
    <main className="flex-grow container mx-auto px-4 py-10 sm:py-16">
      <div className="max-w-3xl mx-auto">
        {/* Intestazione della pagina */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Domande Frequenti
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Le risposte che cerchi per scegliere un servizio rapido, trasparente e garantito.
          </p>
        </div>
        
        {/* Lista di Domande e Risposte */}
        <div className="space-y-10">
          {faqData.map((item, index) => (
            <div key={index} className="border-l-4 border-primary pl-6">
              <h2 className="text-xl font-semibold text-foreground">{item.question}</h2>
              <p className="mt-2 text-muted-foreground leading-relaxed">{item.answer}</p>
            </div>
          ))}
        </div>

        {/* Sezione finale di invito all'azione */}
        <div className="mt-16 text-center border-t border-border pt-10">
          <h3 className="text-2xl font-semibold text-foreground">Pronto a risolvere il tuo problema?</h3>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            Il nostro assistente virtuale è pronto ad aiutarti a ottenere una stima chiara in meno di un minuto.
          </p>
          <Link
            href="/chat"
            className="mt-6 inline-block bg-primary text-primary-foreground font-semibold py-3 px-8 rounded-lg shadow-md hover:bg-primary/90 transition-transform hover:scale-105"
          >
            Inizia Ora
          </Link>
        </div>
      </div>
    </main>
  );
};

export default FAQPage;