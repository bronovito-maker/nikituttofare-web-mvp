import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, Clock, Wrench, ArrowRight, Star } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-slate-900 font-sans">
      
      {/* HERO SECTION: Trust & Speed */}
      <section className="relative py-20 px-6 md:px-12 lg:px-24 bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium border border-blue-100">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
            </span>
            Servizio Attivo H24 a Rimini & Riccione
          </div>
          
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Manutenzione d'Emergenza <br/>
            <span className="text-blue-600">Semplice e Sicura.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">
            Idraulici, Elettricisti e Fabbri certificati pronti a intervenire.
            Ottieni una stima del prezzo garantita <strong>prima</strong> di prenotare.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            {/* IL TASTO ARANCIONE (FIXED) */}
            <Button asChild size="lg" className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-lg px-8 py-6 h-auto shadow-lg shadow-orange-100 transition-all hover:scale-105">
              <Link href="/chat">
                Richiedi Intervento Ora <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            
            <p className="text-sm text-slate-500 mt-2 sm:mt-0">
              <ShieldCheck className="inline w-4 h-4 mr-1 text-green-600"/> 
              Nessun pagamento anticipato richiesto.
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
