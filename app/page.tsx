import Link from 'next/link';
import { Bot, Settings, Users, Zap } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="bg-white text-gray-800">
      <section className="text-center py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
            <Bot className="h-4 w-4" />
            Receptionist AI multi-tenant
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight md:text-5xl">
            Il tuo assistente intelligente, attivo 24/7
          </h1>
          <p className="mt-4 text-lg text-gray-600 md:text-xl">
            Rispondi subito ai tuoi clienti, raccogli contatti qualificati e gestisci prenotazioni senza perdere tempo.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link
              href="/login"
              className="rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow hover:bg-blue-700 transition-colors"
            >
              Accedi alla dashboard
            </Link>
            <Link
              href="/chat"
              className="rounded-lg border border-blue-200 px-6 py-3 text-base font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
            >
              Guarda la demo
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold">Come funziona</h2>
          <p className="mt-2 text-gray-600">Configura, attiva, rilassati. Bastano pochi minuti.</p>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <Settings className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="mt-4 text-xl font-semibold">1. Configura</h3>
              <p className="mt-2 text-sm text-gray-600">
                Inserisci orari, servizi, tono di voce e tutte le informazioni che vuoi far conoscere ai tuoi clienti.
              </p>
            </div>
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="mt-4 text-xl font-semibold">2. Integra</h3>
              <p className="mt-2 text-sm text-gray-600">
                Incolla il widget sul tuo sito, collega WhatsApp o usa la pagina chat dedicata pronta all’uso.
              </p>
            </div>
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="mt-4 text-xl font-semibold">3. Cresci</h3>
              <p className="mt-2 text-sm text-gray-600">
                L’assistente risponde ai clienti, raccoglie contatti e prenotazioni che trovi subito nella dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold">Perfetto per ogni attività</h2>
          <p className="mt-2 text-gray-600">Personalizza il receptionist per qualsiasi settore.</p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {['Ristoranti & Bar', 'Negozi e eCommerce', 'Studi professionali', 'Beauty & Wellness'].map((item) => (
              <div key={item} className="rounded-xl bg-white p-6 text-left shadow-sm ring-1 ring-gray-100">
                <p className="text-lg font-semibold text-gray-800">{item}</p>
                <p className="mt-2 text-sm text-gray-600">
                  Risposte automatiche, promozioni, prenotazioni e raccolta contatti senza fatica.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold">Pronto a non perdere più clienti?</h2>
          <p className="mt-3 text-gray-600">
            Prova gratuitamente la piattaforma e attiva il tuo receptionist AI in pochi minuti.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              href="/login"
              className="rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow hover:bg-blue-700 transition-colors"
            >
              Inizia subito
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
