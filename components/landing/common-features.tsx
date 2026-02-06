'use client';

import { ShieldCheck, Clock, Star } from 'lucide-react';
import { useUserType } from './user-type-context';

export function CommonFeatures() {
  const { userType } = useUserType();

  return (
    <section id="common-features" className="py-20 px-4 sm:px-6 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground">
            {userType === 'residential' ? "Siamo di qui, mica un call center." : "Il Tuo Partner Tecnologico e Locale."}
          </h2>
          <p className="text-lg text-muted-foreground font-light px-2">
            {userType === 'residential' ? (
              <>Conosciamo ogni via di Rimini e Riccione. Tecnologia per eliminare l&apos;ansia, artigiani per risolvere il problema.</>
            ) : (
              <>Uniamo l&apos;efficienza della tecnologia alla conoscenza profonda del territorio. <br />
                La soluzione ideale per la continuità operativa del tuo business in Romagna.</>
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-10">
          <PremiumFeatureCard
            icon={<Clock className="w-6 h-6 text-white" />}
            iconBg="from-blue-600 to-blue-500"
            number="01"
            title={userType === 'residential' ? "Da te in un attimo" : "Interventi Ultra-Rapidi H24"}
            desc={userType === 'residential' ? "I nostri tecnici sono già in zona. Non arriviamo da Bologna, siamo già qui." : "Minimizza i tempi di inattività. I nostri tecnici sono strategicamente posizionati per garantire risposte immediate in tutta la Riviera."}
            features={userType === 'residential' ? ["Rimini, Riccione, Santarcangelo", "Tracking GPS in tempo reale", "Priorità Emergenza"] : ["Disponibilità H24/7", "Tempo di Risposta Garantito", "Copertura Completa Riviera"]}
          />
          <PremiumFeatureCard
            icon={<Star className="w-6 h-6 text-white" />}
            iconBg="from-purple-600 to-purple-500"
            number="02"
            title={userType === 'residential' ? "Prezzi Chiari" : "Costi Trasparenti, Nessuna Sorpresa"}
            desc={userType === 'residential' ? "Niente 'faccio un prezzo a occhio'. Usiamo i listini ufficiali Emilia-Romagna. Quello che vedi è quello che paghi." : "Preventivi dettagliati basati su listini ufficiali, con piani di manutenzione programmata per una gestione budget chiara e prevedibile."}
            features={userType === 'residential' ? ["Stima Costi Immediata", "Listini Regionali", "Pagamento In-App"] : ["Preventivi Personalizzati", "Piani di Manutenzione", "Flessibilità di Pagamento"]}
          />
          <PremiumFeatureCard
            icon={<ShieldCheck className="w-6 h-6 text-white" />}
            iconBg="from-green-600 to-green-500"
            number="03"
            title={userType === 'residential' ? "Lavori Fatti Bene" : "Affidabilità e Garanzia Totale"}
            desc={userType === 'residential' ? "Siamo romagnoli: le cose o si fanno bene o non si fanno. E se sbagliamo, paghiamo noi." : "Standard qualitativi romagnoli: ogni intervento è coperto da assicurazione e garanzia, per la tua serenità operativa."}
            features={userType === 'residential' ? ["Assicurazione 1M€", "Rifacimento Gratuito", "Supporto h24"] : ["Assicurazione Aziendale 1M€", "Tecnici Certificati", "Report Post-Intervento Dettagliati"]}
          />
        </div>
      </div>
    </section>
  );
}

// Componente Card Premium "Apple Level"
function PremiumFeatureCard({
  icon,
  iconBg,
  number,
  title,
  desc,
  features
}: {
  readonly icon: React.ReactNode;
  readonly iconBg: string;
  readonly number: string;
  readonly title: string;
  readonly desc: string;
  readonly features: string[];
}) {
  return (
    <div className="group relative p-8 bg-card rounded-2xl border border-border transition-all duration-500 hover:shadow-2xl hover:shadow-slate-300/20 dark:hover:shadow-slate-900/30 hover:border-slate-300 dark:hover:border-slate-600 hover:-translate-y-2">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />

      <div className="mb-6 inline-flex">
        <span className="text-5xl font-black text-muted/50 group-hover:text-muted transition-colors">
          {number}
        </span>
      </div>

      <div className={`mb-8 inline-flex p-5 rounded-2xl bg-gradient-to-br ${iconBg} shadow-lg group-hover:shadow-xl transition-all duration-500`}>
        {icon}
      </div>

      <h3 className="text-2xl font-bold text-card-foreground mb-3 group-hover:text-primary transition-colors leading-tight">
        {title}
      </h3>
      <p className="text-muted-foreground leading-relaxed mb-6 group-hover:text-foreground transition-colors">
        {desc}
      </p>

      <div className="space-y-2 pt-6 border-t border-border group-hover:border-accent transition-colors">
        {features.map((feature) => (
          <div key={feature} className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground group-hover:bg-accent transition-colors flex-shrink-0" />
            {feature}
          </div>
        ))}
      </div>
    </div>
  );
}
