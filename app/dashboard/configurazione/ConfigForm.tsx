// app/dashboard/configurazione/ConfigForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { tonePresets, sectorOptions } from '@/lib/tone';
import { cn } from '@/lib/utils';

export default function ConfigForm() {
  const { data: session } = useSession();
  const [config, setConfig] = useState({
    nome_attivita: '',
    prompt_sistema: '',
    info_extra: '',
    orari: '',
    indirizzo: '',
    telefono: '',
    sector: 'generic',
    tone: 'professionale',
    notification_email: '',
    notification_slack_webhook: '',
    prompt_secondary: '',
    prompt_config: '',
    menu_text: '',
    menu_url: '',
  });
  const [saving, setSaving] = useState(false);
  const [uploadingMenu, setUploadingMenu] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!session?.user?.tenantId) return;

    fetch('/api/assistente', { cache: 'no-store' })
      .then(res => res.json())
      .then((data) => {
        setConfig(prev => ({
          ...prev,
          nome_attivita: data?.nome_attivita ?? '',
          prompt_sistema: data?.prompt_sistema ?? '',
          info_extra: data?.info_extra ?? '',
          sector: data?.sector ?? 'generic',
          tone: data?.tone ?? 'professionale',
          notification_email: data?.notification_email ?? '',
          notification_slack_webhook: data?.notification_slack_webhook ?? '',
          prompt_secondary: data?.prompt_secondary ?? '',
          prompt_config:
            data?.prompt_config && typeof data.prompt_config === 'object'
              ? JSON.stringify(data.prompt_config, null, 2)
              : typeof data?.prompt_config === 'string'
                ? data.prompt_config
                : '',
          menu_text: data?.menu_text ?? '',
          menu_url: data?.menu_url ?? '',
        }));
      })
      .catch((error) => {
        console.error('Impossibile caricare la configurazione assistente:', error);
      });
  }, [session]);

  useEffect(() => {
    if (typeof window !== 'undefined' && session?.user?.tenantId) {
      setShareLink(`${window.location.origin}/chat?t=${session.user.tenantId}`);
    }
  }, [session?.user?.tenantId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        ...config,
      };

      if (typeof payload.prompt_config === 'string' && payload.prompt_config.trim()) {
        try {
          payload.prompt_config = JSON.parse(payload.prompt_config);
        } catch (error) {
          alert('Il campo “prompt_config” non è un JSON valido.');
          setSaving(false);
          return;
        }
      } else {
        payload.prompt_config = null;
      }

      const response = await fetch('/api/assistente', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.error || 'Errore durante il salvataggio');
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      alert(error?.message ?? 'Errore imprevisto durante il salvataggio.');
    } finally {
      setSaving(false);
    }
  };

  const handleMenuUpload = async (file: File) => {
    if (!file) return;
    setUploadingMenu(true);
    try {
      const response = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
        method: 'POST',
        body: file,
      });
      if (!response.ok) {
        throw new Error('Upload fallito');
      }
      const data = await response.json();
      setConfig((prev) => ({
        ...prev,
        menu_url: data.url,
      }));
    } catch (error) {
      console.error('Errore durante l\'upload del menu:', error);
      alert('Impossibile caricare il file. Riprova.');
    } finally {
      setUploadingMenu(false);
    }
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

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-2">
              Settore
            </label>
            <select
              value={config.sector}
              onChange={(e) => setConfig({ ...config, sector: e.target.value })}
              className="w-full rounded border p-2"
            >
              {sectorOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Tono
            </label>
            <select
              value={config.tone}
              onChange={(e) => setConfig({ ...config, tone: e.target.value })}
              className="w-full rounded border p-2"
            >
              {tonePresets.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Personalità del Receptionist
            <span className="text-gray-500 text-xs ml-2">
              {`(Es: "Sei cordiale e professionale...")`}
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
            Prompt secondario (opzionale)
          </label>
          <textarea
            value={config.prompt_secondary}
            onChange={(e) => setConfig({ ...config, prompt_secondary: e.target.value })}
            rows={4}
            className="w-full p-2 border rounded"
            placeholder="Regole aggiuntive, script, disclaimers..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 flex items-center gap-2">
            Prompt config avanzato
            <span className="text-xs text-gray-500">(JSON)</span>
          </label>
          <textarea
            value={config.prompt_config}
            onChange={(e) => setConfig({ ...config, prompt_config: e.target.value })}
            rows={6}
            className={cn(
              'w-full p-2 border rounded font-mono text-xs',
            )}
            placeholder='{"required_fields":["nome","telefono","persone","orario"],"guidance":["Chiedi eventuali allergie"]}'
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-2">
              Email per notifiche lead
            </label>
            <input
              type="email"
              value={config.notification_email}
              onChange={(e) => setConfig({ ...config, notification_email: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="es. prenotazioni@tuo-ristorante.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Slack/Webhook URL
            </label>
            <input
              type="url"
              value={config.notification_slack_webhook}
              onChange={(e) => setConfig({ ...config, notification_slack_webhook: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="https://hooks.slack.com/services/..."
            />
          </div>
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

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-2">
              Menu / listino (testo)
            </label>
            <textarea
              value={config.menu_text}
              onChange={(e) => setConfig({ ...config, menu_text: e.target.value })}
              rows={6}
              className="w-full p-2 border rounded"
              placeholder="Inserisci il menu in formato testo semplice (opzionale)."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Menu / listino in PDF
            </label>
            <div className="space-y-3 rounded border bg-white p-4">
              <p className="text-sm text-gray-600">
                Carica un PDF con menu, listino prezzi o servizi. Verrà condiviso come link ai clienti.
              </p>
              <input
                type="file"
                accept="application/pdf"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) handleMenuUpload(file);
                }}
                disabled={uploadingMenu}
                className="w-full text-sm"
              />
              {config.menu_url ? (
                <div className="flex items-center justify-between rounded bg-gray-50 p-3 text-sm">
                  <a href={config.menu_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    Visualizza menu caricato
                  </a>
                  <button
                    type="button"
                    onClick={() => setConfig((prev) => ({ ...prev, menu_url: '' }))}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Rimuovi
                  </button>
                </div>
              ) : (
                <p className="text-xs text-gray-500">Nessun file caricato.</p>
              )}
              {uploadingMenu && <p className="text-xs text-gray-500">Caricamento in corso...</p>}
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded bg-blue-600 px-6 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Salvataggio...' : 'Salva Configurazione'}
        </button>
        {saveSuccess && (
          <span className="ml-3 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
            ✔ Salvato con successo
          </span>
        )}
      </div>

      <div className="mt-8 flex flex-col gap-6 rounded bg-gray-100 p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="font-semibold">Anteprima Chat</h3>
          <p className="text-sm text-gray-600">
            Condividi questo link per testare il tuo assistente:
          </p>
        </div>
        <code className="mt-2 block rounded bg-white p-2 text-sm md:mt-0">{shareLink || 'Caricamento link...'}</code>
      </div>
    </div>
  );
}
