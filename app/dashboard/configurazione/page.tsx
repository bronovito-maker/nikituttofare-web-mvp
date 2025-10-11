// app/dashboard/configurazione/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { LoaderCircle, Save, CheckCircle } from 'lucide-react';

export default function ConfigurazionePage() {
  const { data: session, status } = useSession({ required: true });
  
  // Stati per gestire il form
  const [nomeAttivita, setNomeAttivita] = useState('');
  const [promptSistema, setPromptSistema] = useState('');
  const [infoExtra, setInfoExtra] = useState('');
  
  // Stati per gestire il caricamento e i messaggi all'utente
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // useEffect per caricare i dati dell'assistente all'avvio
  useEffect(() => {
    if (status === 'authenticated') {
      setIsLoading(true);
      fetch('/api/assistente')
        .then(res => {
          if (!res.ok) throw new Error('Dati non trovati o errore di autorizzazione.');
          return res.json();
        })
        .then(data => {
          setNomeAttivita(data.nome_attivita || '');
          setPromptSistema(data.prompt_sistema || '');
          setInfoExtra(data.info_extra || '');
          setError(null);
        })
        .catch(err => setError(err.message))
        .finally(() => setIsLoading(false));
    }
  }, [status]);

  // Funzione per gestire il salvataggio del form
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/assistente', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome_attivita: nomeAttivita,
          prompt_sistema: promptSistema,
          info_extra: infoExtra,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Errore durante il salvataggio.');
      }
      
      setSuccess('Configurazione salvata con successo!');
      setTimeout(() => setSuccess(null), 3000); // Nasconde il messaggio dopo 3 secondi

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoaderCircle className="w-8 h-8 animate-spin text-primary" />
        <p className="ml-2">Caricamento configurazione...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Configurazione Assistente</h1>
        <p className="text-muted-foreground mb-8">
          Personalizza il comportamento e le conoscenze del tuo receptionist virtuale.
        </p>

        {error && <div className="mb-4 p-3 bg-destructive/10 text-destructive border border-destructive/50 rounded-md">{error}</div>}

        <form onSubmit={handleSave} className="space-y-8">
          <div className="p-6 border rounded-lg bg-card">
            <h2 className="text-xl font-semibold">Nome Attività</h2>
            <p className="text-sm text-muted-foreground mt-1 mb-4">Il nome che l&apos;assistente userà per presentarsi.</p>
            <input
              type="text"
              value={nomeAttivita}
              onChange={(e) => setNomeAttivita(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Es. Ristorante La Perla"
            />
          </div>

          <div className="p-6 border rounded-lg bg-card">
            <h2 className="text-xl font-semibold">Personalità e Istruzioni (Prompt di Sistema)</h2>
            <p className="text-sm text-muted-foreground mt-1 mb-4">Definisci il tono di voce e le regole principali. Sii amichevole, formale, conciso, etc.</p>
            <textarea
              value={promptSistema}
              onChange={(e) => setPromptSistema(e.target.value)}
              rows={8}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Es. Sei un receptionist virtuale per un ristorante. Rispondi in modo gentile e amichevole. Il tuo obiettivo è prendere prenotazioni e rispondere a domande sugli orari..."
            />
          </div>

          <div className="p-6 border rounded-lg bg-card">
            <h2 className="text-xl font-semibold">Base di Conoscenza (Informazioni Extra)</h2>
            <p className="text-sm text-muted-foreground mt-1 mb-4">Inserisci qui tutte le informazioni specifiche che l&apos;AI deve conoscere: menu, orari, indirizzo, promozioni, regole particolari.</p>
            <textarea
              value={infoExtra}
              onChange={(e) => setInfoExtra(e.target.value)}
              rows={12}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Es. Orari: Lun-Ven 12-15, 19-23. Sabato e Domenica: 12-23. Menu: Specialità pesce. Indirizzo: Via Roma 1, Milano. Cani ammessi solo all'esterno..."
            />
          </div>

          <div className="flex items-center gap-4">
             <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md bg-primary text-sm font-medium text-primary-foreground h-10 px-6 disabled:opacity-50"
            >
              {isSaving ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5 mr-2" />}
              {isSaving ? 'Salvataggio...' : 'Salva Modifiche'}
            </button>
            {success && <div className="flex items-center text-green-600"><CheckCircle size={20} className="mr-2"/> {success}</div>}
          </div>
        </form>
      </div>
    </div>
  );
}
