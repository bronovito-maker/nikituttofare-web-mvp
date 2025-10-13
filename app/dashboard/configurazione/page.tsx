import ConfigForm from './ConfigForm';

export default function ConfigurazionePage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Configurazione Assistente</h1>
      <p className="text-muted-foreground mb-8">
        Personalizza comportamento, tono e informazioni del tuo receptionist virtuale.
      </p>
      <ConfigForm />
    </div>
  );
}
