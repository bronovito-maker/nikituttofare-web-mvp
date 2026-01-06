'use client';

import { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Phone, 
  Mail,
  AlertTriangle,
  Wrench,
  Zap,
  Key,
  Thermometer,
  Calendar,
  CreditCard,
  Shield,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AIResponseType, FormType } from '@/lib/ai-structures';

// ============================================
// GENERATIVE UI COMPONENTS
// Renderizza componenti React basati su JSON AI
// ============================================

interface GenerativeUIProps {
  response: AIResponseType;
  onFormSubmit?: (data: Record<string, string>) => void;
  onConfirm?: () => void;
}

export function GenerativeUI({ response, onFormSubmit, onConfirm }: GenerativeUIProps) {
  switch (response.type) {
    case 'text':
      return <TextResponse content={response.content as string} />;
    
    case 'form':
      return <FormResponse form={response.content as FormType} onSubmit={onFormSubmit} />;
    
    case 'recap':
      return <RecapResponse content={response.content} onConfirm={onConfirm} />;
    
    case 'booking_summary':
      return <BookingSummaryResponse content={response.content as Record<string, unknown>} />;
    
    case 'confirmation':
      return <ConfirmationResponse content={response.content} />;
    
    default:
      return <TextResponse content={typeof response.content === 'string' ? response.content : JSON.stringify(response.content)} />;
  }
}

// ============================================
// TEXT RESPONSE
// ============================================
function TextResponse({ content }: { content: string }) {
  return (
    <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
      {content}
    </p>
  );
}

// ============================================
// FORM RESPONSE - Invisible Form (Chat-First)
// ============================================
function FormResponse({ form, onSubmit }: { form: FormType; onSubmit?: (data: Record<string, string>) => void }) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!onSubmit) return;
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isComplete = form.fields.every(f => formData[f.name]?.trim());

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-slate-700">
        Per procedere, ho bisogno di alcune informazioni:
      </p>
      
      <div className="space-y-3 bg-slate-50 rounded-xl p-4 border border-slate-200">
        {form.fields.map((field) => (
          <div key={field.name} className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
              {field.label}
            </label>
            
            {field.type === 'textarea' ? (
              <textarea
                placeholder={`Inserisci ${field.label.toLowerCase()}...`}
                value={formData[field.name] || ''}
                onChange={(e) => handleChange(field.name, e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none transition-all"
                rows={3}
              />
            ) : field.type === 'select' ? (
              <select
                value={formData[field.name] || ''}
                onChange={(e) => handleChange(field.name, e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              >
                <option value="">Seleziona...</option>
                {field.options?.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <input
                type={field.name.includes('email') ? 'email' : field.name.includes('phone') ? 'tel' : 'text'}
                placeholder={`Inserisci ${field.label.toLowerCase()}...`}
                value={formData[field.name] || ''}
                onChange={(e) => handleChange(field.name, e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            )}
          </div>
        ))}
      </div>

      {onSubmit && (
        <Button
          onClick={handleSubmit}
          disabled={!isComplete || isSubmitting}
          className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Invio in corso...
            </>
          ) : (
            <>
              Conferma
              <ChevronRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      )}
    </div>
  );
}

// ============================================
// RECAP RESPONSE - Ticket Summary
// ============================================
function RecapResponse({ content, onConfirm }: { content: string | Record<string, unknown>; onConfirm?: () => void }) {
  const data = typeof content === 'string' ? { description: content } : content;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-blue-700 font-semibold">
        <Clock className="w-5 h-5" />
        <span>Riepilogo della richiesta</span>
      </div>
      
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200/50 space-y-3">
        {Object.entries(data).map(([key, value]) => {
          if (!value) return null;
          const label = formatLabel(key);
          const icon = getIconForField(key);
          
          return (
            <div key={key} className="flex items-start gap-3">
              <div className="mt-0.5 text-blue-600">{icon}</div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
                <p className="text-sm text-slate-900">{String(value as string | number | boolean)}</p>
              </div>
            </div>
          );
        })}
      </div>

      {onConfirm && (
        <Button
          onClick={onConfirm}
          className="w-full h-12 rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-bold shadow-lg shadow-orange-200/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          Conferma e Richiedi Intervento
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      )}
    </div>
  );
}

// ============================================
// BOOKING SUMMARY - Final Confirmation
// ============================================
function BookingSummaryResponse({ content }: { content: Record<string, unknown> }) {
  const CATEGORY_CONFIG: Record<string, { icon: typeof Wrench; color: string; label: string }> = {
    plumbing: { icon: Wrench, color: 'text-blue-600', label: 'Idraulico' },
    electric: { icon: Zap, color: 'text-yellow-600', label: 'Elettricista' },
    locksmith: { icon: Key, color: 'text-slate-600', label: 'Fabbro' },
    climate: { icon: Thermometer, color: 'text-cyan-600', label: 'Clima' },
    generic: { icon: Wrench, color: 'text-purple-600', label: 'Generico' },
  };

  const category = content.category as string || 'generic';
  const CategoryConfig = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.generic;
  const CategoryIcon = CategoryConfig.icon;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 font-semibold text-slate-900">
        <div className="p-2 rounded-lg bg-slate-100">
          <CategoryIcon className={`w-5 h-5 ${CategoryConfig.color}`} />
        </div>
        <span>Riepilogo Prenotazione</span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 space-y-3">
          {Boolean(content.description) && (
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-orange-500 mt-1 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-slate-500">Problema</p>
                <p className="text-sm text-slate-900">{String(content.description)}</p>
              </div>
            </div>
          )}
          
          {Boolean(content.address) && (
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-blue-500 mt-1 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-slate-500">Indirizzo</p>
                <p className="text-sm text-slate-900">{String(content.address)}</p>
              </div>
            </div>
          )}

          {Boolean(content.priority) && (
            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 text-purple-500 mt-1 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-slate-500">Priorità</p>
                <p className="text-sm text-slate-900 capitalize">{String(content.priority)}</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-slate-50 px-4 py-3 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Shield className="w-4 h-4 text-green-600" />
            <span>Preventivo gratuito • Nessun costo anticipato</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// CONFIRMATION RESPONSE - Success State
// ============================================
function ConfirmationResponse({ content }: { content: string | Record<string, unknown> }) {
  const message = typeof content === 'string' ? content : content.message as string || 'Richiesta confermata';
  const ticketId = typeof content === 'object' ? content.ticketId as string : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
        <div className="p-2 rounded-full bg-green-100">
          <CheckCircle2 className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <p className="font-bold text-green-800">Richiesta Confermata!</p>
          {ticketId && (
            <p className="text-sm text-green-700">Ticket #{ticketId.slice(-8)}</p>
          )}
        </div>
      </div>

      <div className="text-sm text-slate-700 space-y-2">
        <p>{message}</p>
        <div className="flex items-center gap-2 text-slate-500">
          <Clock className="w-4 h-4" />
          <span>Un tecnico ti contatterà entro 60 minuti</span>
        </div>
      </div>

      <div className="p-4 bg-blue-50 rounded-xl border border-blue-200/50">
        <p className="text-sm font-medium text-blue-800 mb-2">Prossimi passi:</p>
        <ul className="text-sm text-blue-700 space-y-1">
          <li className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center text-xs font-bold">1</span>
            Riceverai una conferma via email
          </li>
          <li className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center text-xs font-bold">2</span>
            Il tecnico ti chiamerà per confermare l&apos;orario
          </li>
          <li className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center text-xs font-bold">3</span>
            Intervento e pagamento a fine lavoro
          </li>
        </ul>
      </div>
    </div>
  );
}

// ============================================
// HELPER FUNCTIONS
// ============================================
function formatLabel(key: string): string {
  const labels: Record<string, string> = {
    category: 'Categoria',
    description: 'Descrizione',
    address: 'Indirizzo',
    priority: 'Priorità',
    phone: 'Telefono',
    email: 'Email',
    name: 'Nome',
    created_at: 'Data',
  };
  return labels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function getIconForField(key: string): React.ReactNode {
  const icons: Record<string, React.ReactNode> = {
    category: <Wrench className="w-4 h-4" />,
    description: <AlertTriangle className="w-4 h-4" />,
    address: <MapPin className="w-4 h-4" />,
    priority: <Clock className="w-4 h-4" />,
    phone: <Phone className="w-4 h-4" />,
    email: <Mail className="w-4 h-4" />,
    name: <CheckCircle2 className="w-4 h-4" />,
    created_at: <Calendar className="w-4 h-4" />,
    payment: <CreditCard className="w-4 h-4" />,
  };
  return icons[key] || <ChevronRight className="w-4 h-4" />;
}
