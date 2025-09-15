// app/profilo/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { User, Lock, AlertTriangle, LoaderCircle } from 'lucide-react';

// Componente per lo stato di caricamento
const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <LoaderCircle className="w-8 h-8 animate-spin text-primary" />
  </div>
);

// Componente per una sezione della pagina
const ProfileSection = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <div className="bg-card border border-border rounded-lg p-6">
    <h2 className="text-xl font-semibold flex items-center text-foreground">
      {icon}
      <span className="ml-2">{title}</span>
    </h2>
    <div className="mt-4">{children}</div>
  </div>
);

// Componente principale della pagina
export default function ProfilePage() {
  const { data: session, status } = useSession({ required: true });

  if (status === 'loading') {
    return (
        <main className="flex-grow container mx-auto px-4 py-8 sm:py-12">
            <LoadingSpinner />
        </main>
    );
  }

  return (
    <main className="flex-grow container mx-auto px-4 py-8 sm:py-12">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Il Mio Profilo</h1>
            <p className="mt-2 text-muted-foreground">Gestisci i tuoi dati personali e le impostazioni di sicurezza.</p>
        </div>

        <div className="space-y-8">
            {/* Sezione Dati Personali */}
            <ProfileSection title="Dati Personali" icon={<User size={22} />}>
              <div className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground">Nome</label>
                  <p className="text-foreground">{session?.user?.name || 'Non specificato'}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground">Email</label>
                  <p className="text-foreground">{session?.user?.email || 'Non specificato'}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground">Telefono</label>
                  <p className="italic text-muted-foreground/80">(Funzionalità in sviluppo)</p>
                </div>
              </div>
              <button disabled className="mt-6 w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-secondary text-secondary-foreground text-sm font-medium rounded-md disabled:opacity-50 cursor-not-allowed">
                Modifica Dati (presto disponibile)
              </button>
            </ProfileSection>

            {/* Sezione Sicurezza */}
            <ProfileSection title="Sicurezza" icon={<Lock size={22} />}>
                <p className="text-sm text-muted-foreground">Per una maggiore sicurezza, ti consigliamo di cambiare la password periodicamente.</p>
                <button disabled className="mt-4 w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-secondary text-secondary-foreground text-sm font-medium rounded-md disabled:opacity-50 cursor-not-allowed">
                    Cambia Password (presto disponibile)
                </button>
            </ProfileSection>

            {/* Sezione Zona Pericolo */}
            <div className="border-destructive/50 border bg-destructive/5 p-6 rounded-lg">
                <h2 className="text-xl font-semibold flex items-center text-destructive">
                    <AlertTriangle size={22} />
                    <span className="ml-2">Zona Pericolo</span>
                </h2>
                <div className="mt-4">
                    <p className="text-sm text-destructive/80">L'eliminazione del tuo account è un'azione permanente e non può essere annullata. Tutti i tuoi dati e le tue richieste verranno cancellati per sempre.</p>
                    <button disabled className="mt-4 w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-destructive text-destructive-foreground text-sm font-medium rounded-md disabled:opacity-50 cursor-not-allowed">
                        Elimina il mio account (presto disponibile)
                    </button>
                </div>
            </div>
        </div>
      </div>
    </main>
  );
}