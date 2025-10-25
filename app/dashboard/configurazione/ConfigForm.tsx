'use client';

import { useEffect, useState } from 'react';
import { Tenant } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';

type FormDataState = Partial<
  Pick<
    Tenant,
    | 'name'
    | 'phone_number'
    | 'address'
    | 'notification_email'
    | 'system_prompt'
    | 'extra_info'
    | 'opening_hours_json'
    | 'menu_pdf_url'
    | 'menu_text'
    | 'ai_tone'
    | 'widget_color'
  >
>;

const DEFAULT_WIDGET_COLOR = '#4f46e5';

export default function ConfigForm() {
  const [formData, setFormData] = useState<FormDataState>({});
  const [tenantConfig, setTenantConfig] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
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
        setTenantConfig(data);
        setFormData({
          name: data.name || '',
          phone_number: data.phone_number || '',
          address: data.address || '',
          notification_email: data.notification_email || '',
          system_prompt: data.system_prompt || '',
          extra_info: data.extra_info || '',
          opening_hours_json: data.opening_hours_json || '',
          menu_pdf_url: data.menu_pdf_url || '',
          menu_text: data.menu_text || '',
          ai_tone: data.ai_tone || '',
          widget_color: data.widget_color || DEFAULT_WIDGET_COLOR,
        });
      } catch (err) {
        console.error('Errore nel caricamento della configurazione:', err);
        setError(err instanceof Error ? err.message : 'Errore sconosciuto');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMenuPdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!tenantConfig?.Id) {
      console.error('Tenant ID non trovato. Impossibile caricare.');
      setUploadMessage('Errore: ID Ristorante non trovato.');
      event.target.value = '';
      return;
    }

    if (file.type !== 'application/pdf') {
      setUploadMessage('Carica un file PDF valido.');
      event.target.value = '';
      return;
    }

    setSuccess(null);
    setUploadMessage('Caricamento e analisi PDF in corso...');
    setIsUploading(true);

    const form = new FormData();
    form.append('file', file);

    try {
      const res = await fetch(`/api/upload?tenantId=${tenantConfig.Id}`, {
        method: 'POST',
        body: form,
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(errorBody.error || 'Upload fallito');
      }

      const { url, extractedText } = (await res.json()) as {
        url: string;
        extractedText: string;
      };

      const cacheBustedUrl = `${url}?v=${Date.now()}`;

      setFormData((prev) => ({
        ...prev,
        menu_pdf_url: cacheBustedUrl,
        menu_text: extractedText ?? prev.menu_text ?? '',
      }));

      setUploadMessage('Menu PDF caricato e analizzato con successo!');
    } catch (err) {
      console.error('Errore in handleMenuPdfUpload:', err);
      const message = err instanceof Error ? err.message : 'Errore sconosciuto';
      setUploadMessage(`Errore: ${message}`);
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload: FormDataState = {
        ...formData,
      };
      if (!payload.widget_color) {
        payload.widget_color = DEFAULT_WIDGET_COLOR;
      }

      const res = await fetch('/api/assistente', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(`Salvataggio fallito: ${res.statusText}`);
      }
      setSuccess('Configurazione salvata con successo!');
    } catch (err) {
      console.error('Errore nel salvataggio:', err);
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div>Caricamento configurazione...</div>;
  }

  if (error && !isSaving) {
    return <div className="text-red-500">Errore nel caricamento: {error}</div>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {error && <div className="rounded bg-red-100 p-2 text-red-500">{error}</div>}
      {success && <div className="rounded bg-green-100 p-2 text-green-600">{success}</div>}

      <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Informazioni Generali</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-sm font-medium" htmlFor="name">
              Nome Attività
            </label>
            <Input
              id="name"
              name="name"
              value={formData.name || ''}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium" htmlFor="phone_number">
              Telefono Principale
            </label>
            <Input
              id="phone_number"
              name="phone_number"
              value={formData.phone_number || ''}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium" htmlFor="address">
              Indirizzo
            </label>
            <Input
              id="address"
              name="address"
              value={formData.address || ''}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium" htmlFor="notification_email">
              Email per Notifiche
            </label>
            <Input
              id="notification_email"
              name="notification_email"
              type="email"
              value={formData.notification_email || ''}
              onChange={handleChange}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Esperienza AI</h2>
        <div className="space-y-2">
          <label className="block text-sm font-medium" htmlFor="system_prompt">
            Istruzioni AI (System Prompt)
          </label>
          <p className="text-sm text-gray-500">
            Definisci il ruolo, il tono e gli obiettivi fondamentali dell&apos;assistente.
          </p>
          <Textarea
            id="system_prompt"
            name="system_prompt"
            value={formData.system_prompt || ''}
            onChange={handleChange}
            rows={12}
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium" htmlFor="ai_tone">
            Tono dell&apos;AI
          </label>
          <Select
            id="ai_tone"
            name="ai_tone"
            value={formData.ai_tone || ''}
            onChange={handleChange}
          >
            <option value="">Seleziona un tono</option>
            <option value="Professionale">Professionale</option>
            <option value="Amichevole">Amichevole</option>
            <option value="Formale">Formale</option>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium" htmlFor="extra_info">
            Informazioni Aggiuntive
          </label>
          <p className="text-sm text-gray-500">
            Policy di prenotazione, info parcheggio, note operative e altre istruzioni utili.
          </p>
          <Textarea
            id="extra_info"
            name="extra_info"
            value={formData.extra_info || ''}
            onChange={handleChange}
            rows={8}
          />
        </div>
      </section>

      <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Menu</h2>
        <div className="space-y-2">
          <label className="block text-sm font-medium" htmlFor="menu_text">
            Menu (Testo)
          </label>
          <p className="text-sm text-gray-500">
            Inserisci una versione testuale del menu. Verrà aggiunta al prompt per risposte precise.
          </p>
          <Textarea
            id="menu_text"
            name="menu_text"
            value={formData.menu_text || ''}
            onChange={handleChange}
            rows={10}
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium" htmlFor="menu_pdf">
            Menu (PDF)
          </label>
          <Input
            id="menu_pdf"
            name="menu_pdf"
            type="file"
            accept=".pdf"
            onChange={handleMenuPdfUpload}
            disabled={isUploading}
          />
          {uploadMessage && (
            <p
              className={`text-sm ${
                uploadMessage.toLowerCase().startsWith('errore')
                  ? 'text-red-600'
                  : 'text-gray-500'
              }`}
            >
              {uploadMessage}
            </p>
          )}
          {formData.menu_pdf_url ? (
            <p className="text-sm text-green-600">
              PDF attuale:{' '}
              <a
                className="underline"
                href={formData.menu_pdf_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Visualizza documento
              </a>
            </p>
          ) : (
            <p className="text-sm text-gray-500">
              Nessun PDF caricato. Caricane uno per condividerlo con i clienti.
            </p>
          )}
        </div>
      </section>

  <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Aspetto del Widget</h2>
        <div className="space-y-2">
          <label className="block text-sm font-medium" htmlFor="widget_color">
            Colore Primario
          </label>
          <p className="text-sm text-gray-500">
            Personalizza il colore principale del widget chat. Questo valore verrà applicato agli elementi principali dell&apos;interfaccia.
          </p>
          <div className="flex items-center gap-3">
            <Input
              id="widget_color"
              name="widget_color"
              type="color"
              value={formData.widget_color || DEFAULT_WIDGET_COLOR}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, widget_color: event.target.value }))
              }
              className="h-10 w-16 cursor-pointer p-1"
            />
            <Input
              value={formData.widget_color || DEFAULT_WIDGET_COLOR}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, widget_color: event.target.value }))
              }
              className="w-32 text-sm"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Orari</h2>
        <div className="space-y-2">
          <label className="block text-sm font-medium" htmlFor="opening_hours_json">
            Orari di Apertura (Formato JSON)
          </label>
          <p className="text-sm text-gray-500">
            Inserisci gli orari in formato JSON. Es: {'{"lun": "18-23", "mar": "Chiuso"}'}
          </p>
          <Textarea
            id="opening_hours_json"
            name="opening_hours_json"
            value={formData.opening_hours_json || ''}
            onChange={handleChange}
            rows={6}
            className="font-mono"
          />
        </div>
      </section>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="rounded bg-primary px-4 py-2 text-white transition hover:bg-primary/90 disabled:opacity-70"
        >
          {isSaving ? 'Salvataggio in corso...' : 'Salva Configurazione'}
        </button>
      </div>
    </div>
  );
}
