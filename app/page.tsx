
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Clock, Wrench, ArrowRight } from "lucide-react";
import { BlurText } from "@/components/react-bits/BlurText";
import { RetroGrid } from "@/components/react-bits/RetroGrid";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-slate-900 font-sans">
      
      {/* HERO SECTION: Trust & Speed - MODERNIZZATA */}
      <section className="relative py-24 px-6 md:px-12 lg:px-24 bg-white border-b border-slate-100 overflow-hidden">
        {/* Sfondo Tecnologico (RetroGrid) */}
        <RetroGrid className="absolute inset-0 z-0 h-full w-full" />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
          {/* Badge Animato */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50/80 backdrop-blur-sm text-blue-700 text-sm font-medium border border-blue-100 shadow-sm transition-all hover:bg-blue-100 cursor-default">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
            </span>
            Servizio Attivo H24 a Rimini & Riccione
          </div>

          {/* Titolo con Blur Reveal - Effetto Wow, ma leggibile */}
          <div className="space-y-2">
            <BlurText 
              text="Manutenzione d'Emergenza" 
              className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1]"
              delay={0.1}
            />
            <BlurText 
              text="Semplice e Sicura." 
              className="text-4xl md:text-6xl font-extrabold tracking-tight text-blue-600 leading-[1.1]"
              delay={0.3}
            />
          </div>

          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300 fill-mode-forwards opacity-0">
            Idraulici, Elettricisti e Fabbri certificati pronti a intervenire.
            Ottieni una stima del prezzo garantita <strong>prima</strong> di prenotare.
          </p>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-5 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-500 fill-mode-forwards opacity-0">
            {/* TASTO ARANCIONE POTENZIATO */}
            <Link href="/chat" className="relative overflow-hidden bg-orange-600 hover:bg-orange-700 text-white font-bold text-lg px-8 py-8 h-auto shadow-xl shadow-orange-200 transition-all hover:scale-105 hover:-translate-y-1 group inline-flex items-center">
              <span className="relative z-10 flex items-center">
                Richiedi Intervento Ora 
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </span>
              {/* Effetto luce interno al bottone (Shiny effect CSS puro) */}
              <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-0" />
            </Link>
            
            <p className="text-sm text-slate-500 font-medium flex items-center bg-white/60 backdrop-blur px-3 py-1 rounded-lg">
              <ShieldCheck className="inline w-4 h-4 mr-1.5 text-green-600"/> 
              Nessun pagamento anticipato.
            </p>
          </div>
        </div>
      </section>

      {/* TRUST SECTION: Why Us? */}
      <section className="py-16 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Clock className="w-10 h-10 text-blue-600" />}
              title="Intervento in 60 Minuti"
              desc="La nostra rete locale garantisce tempi di risposta immediati per le urgenze critiche."
            />
            <FeatureCard 
              icon={<Wrench className="w-10 h-10 text-blue-600" />}
              title="Prezzi Chiari"
              desc="L'Intelligenza Artificiale calcola un range di prezzo preciso basato sulla foto del danno. Niente sorprese."
            />
            <FeatureCard 
              icon={<ShieldCheck className="w-10 h-10 text-blue-600" />}
              title="Tecnici Verificati"
              desc="Ogni artigiano è certificato e valutato. Se qualcosa va storto, garantiamo noi."
            />
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF: Non siamo soli */}
      <section className="py-16 px-6 bg-white border-t border-slate-100">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-8">Già scelto da oltre 50 Hotel e B&B in Riviera</h2>
          <div className="flex flex-wrap justify-center gap-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
             {/* Placeholder loghi - In produzione mettere SVG reali */}
             <span className="text-xl font-bold text-slate-400">HOTEL SAVOIA</span>
             <span className="text-xl font-bold text-slate-400">RESIDENCE MARE</span>
             <span className="text-xl font-bold text-slate-400">B&B RIVIERA</span>
             <span className="text-xl font-bold text-slate-400">GRAND HOTEL</span>
          </div>
        </div>
      </section>

    </div>
  );
}

// Componente di supporto per le Card
function FeatureCard({ icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow bg-white">
      <CardHeader>
        <div className="mb-2 p-3 bg-blue-50 w-fit rounded-xl">{icon}</div>
        <CardTitle className="text-xl font-bold text-slate-900">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-slate-600 leading-relaxed">{desc}</p>
      </CardContent>
    </Card>
  );
}
