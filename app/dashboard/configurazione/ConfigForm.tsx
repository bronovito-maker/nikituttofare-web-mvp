'use client';

import { useState, useEffect } from 'react';
import { Tenant } from '@/lib/types';

type FormData = Partial<
  Pick<
    Tenant,
    | 'name'
    | 'phone_number'
    | 'address'
    | 'notification_email'
    | 'system_prompt'
    | 'extra_info'
    | 'opening_hours_json'
  >
>;

export default function ConfigForm() {
  const [formData, setFormData] = useState<FormData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/assistente');
        if (!res.ok) {
          throw new Error(`Errore: ${res.statusText}`);
        }
        const data: Tenant = await res.json();
        setFormData({
          name: data.name || '',
          phone_number: data.phone_number || '',
          address: data.address || '',
          notification_email: data.notification_email || '',
          system_prompt: data.system_prompt || '',
          extra_info: data.extra_info || '',
          opening_hours_json: data.opening_hours_json || '',
        });
      } catch (err) {
        console.error('Errore nel caricamento della configurazione:', err);
        setError(err instanceof Error ? err.message : 'Errore sconosciuto');
      }
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch('/api/assistente', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        throw new Error(`Salvataggio fallito: ${res.statusText}`);
      }
      setSuccess('Configurazione salvata con successo!');
    } catch (err) {
      console.error('Errore nel salvataggio:', err);
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return <div>Caricamento configurazione...</div>;
  }

  if (error && !isSaving) {
    return <div className="text-red-500">Errore nel caricamento: {error}</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {error && <div className="text-red-500 p-2 rounded bg-red-100">{error}</div>}
      {success && <div className="text-green-500 p-2 rounded bg-green-100">{success}</div>}

      <div className="space-y-2">
        <label className="block text-sm font-medium" htmlFor="name">
          Nome Attività
        </label>
        <input
          id="name"
          name="name"
          value={formData.name || ''}
          onChange={handleChange}
          className="w-full rounded border border-gray-300 p-2"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium" htmlFor="phone_number">
          Telefono Principale
        </label>
        <input
          id="phone_number"
          name="phone_number"
          value={formData.phone_number || ''}
          onChange={handleChange}
          className="w-full rounded border border-gray-300 p-2"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium" htmlFor="address">
          Indirizzo
        </label>
        <input
          id="address"
          name="address"
          value={formData.address || ''}
          onChange={handleChange}
          className="w-full rounded border border-gray-300 p-2"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium" htmlFor="notification_email">
          Email per Notifiche
        </label>
        <input
          id="notification_email"
          name="notification_email"
          type="email"
          value={formData.notification_email || ''}
          onChange={handleChange}
          className="w-full rounded border border-gray-300 p-2"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium" htmlFor="system_prompt">
          Istruzioni AI (System Prompt)
        </label>
        <p className="text-sm text-gray-500">
          Le istruzioni fondamentali per l&apos;AI. Definisci il suo ruolo, tono e compiti principali.
        </p>
        <textarea
          id="system_prompt"
          name="system_prompt"
          value={formData.system_prompt || ''}
          onChange={handleChange}
          rows={12}
          className="w-full rounded border border-gray-300 p-2"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium" htmlFor="extra_info">
          Informazioni Aggiuntive
        </label>
        <p className="text-sm text-gray-500">
          Dettagli specifici: policy di prenotazione, info parcheggio, menu testuale, ecc.
        </p>
        <textarea
          id="extra_info"
          name="extra_info"
          value={formData.extra_info || ''}
          onChange={handleChange}
          rows={8}
          className="w-full rounded border border-gray-300 p-2"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium" htmlFor="opening_hours_json">
          Orari di Apertura (Formato JSON)
        </label>
        <p className="text-sm text-gray-500">
          Inserisci gli orari in formato JSON. Es: {'{"lun": "18-23", "mar": "Chiuso"}'}
        </p>
        <textarea
          id="opening_hours_json"
          name="opening_hours_json"
          value={formData.opening_hours_json || ''}
          onChange={handleChange}
          rows={5}
          className="w-full rounded border border-gray-300 p-2 font-mono"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={isSaving}
        className="rounded bg-primary px-4 py-2 text-white disabled:opacity-70"
      >
        {isSaving ? 'Salvataggio in corso...' : 'Salva Configurazione'}
      </button>
    </div>
  );
}
