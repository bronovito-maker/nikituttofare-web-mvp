// app/dashboard/configurazione/ConfigForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function ConfigForm() {
  const { data: session } = useSession();
  const [config, setConfig] = useState({
    nome_attivita: '',
    prompt_sistema: '',
    info_extra: '',
    orari: '',
    indirizzo: '',
    telefono: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Carica la configurazione esistente
    fetch(`/api/assistente/config?tenant_id=${session?.user?.email}`)
      .then(res => res.json())
      .then(data => setConfig(data));
  }, [session]);

  const handleSave = async () => {
    setSaving(true);
    await fetch('/api/assistente/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenant_id: session?.user?.email,
        ...config
      })
    });
    setSaving(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Configura il tuo Receptionist AI</h2>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            Nome Attività
          </label>
          <input
            type="text"
            value={config.nome_attivita}
            onChange={(e) => setConfig({...config, nome_attivita: e.target.value})}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Personalità del Receptionist
            <span className="text-gray-500 text-xs ml-2">
              (Es: "Sei cordiale e professionale...")
            </span>
          </label>
          <textarea
            value={config.prompt_sistema}
            onChange={(e) => setConfig({...config, prompt_sistema: e.target.value})}
            rows={4}
            className="w-full p-2 border rounded"
            placeholder="Descrivi come dovrebbe comportarsi il tuo assistente..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Informazioni sulla tua Attività
          </label>
          <textarea
            value={config.info_extra}
            onChange={(e) => setConfig({...config, info_extra: e.target.value})}
            rows={6}
            className="w-full p-2 border rounded"
            placeholder="Orari, servizi, prezzi, specialità..."
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {saving ? 'Salvataggio...' : 'Salva Configurazione'}
        </button>
      </div>

      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h3 className="font-semibold mb-2">Anteprima Chat</h3>
        <p className="text-sm text-gray-600">
          Condividi questo link per testare il tuo assistente:
        </p>
        <code className="block mt-2 p-2 bg-white rounded">
          {`${window.location.origin}/chat?t=${session?.user?.email}`}
        </code>
      </div>
    </div>
  );
}