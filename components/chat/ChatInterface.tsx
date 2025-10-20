'use client';

import { useChat } from '@/hooks/useChat';
import { ChatIntroScreen } from './ChatIntroScreen';
import MessageInput from './MessageInput';
import Typing from '../Typing';
import ChatBubble from '../ChatBubble';
import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import type { AssistantConfig } from '@/lib/types';

const CHECKLIST_STEPS = [
  { key: 'nome', label: 'Nome cliente' },
  { key: 'telefono', label: 'Numero di telefono' },
  { key: 'data', label: 'Data' },
  { key: 'orario', label: 'Orario' },
  { key: 'persone', label: 'Numero di persone' },
  { key: 'allergeni', label: 'Allergie o richieste' },
  { key: 'riepilogo', label: 'Riepilogo & conferma' },
] as const;

type ChecklistKey = typeof CHECKLIST_STEPS[number]['key'];
const STEP_LABEL_MAP: Record<ChecklistKey, string> = {
  nome: 'Nome',
  telefono: 'Numero di telefono',
  data: 'Data',
  orario: 'Orario',
  persone: 'Numero di persone',
  allergeni: 'Allergie o richieste',
  riepilogo: 'Riepilogo',
};

type SummaryData = {
  nome: string;
  telefono: string;
  partySize: number;
  allergeni: string;
  bookingDateTime: string;
  dateDisplay?: string;
  timeDisplay?: string;
};

type ChatInterfaceProps = {
  assistantConfig?: AssistantConfig | null;
};

export default function ChatInterface({ assistantConfig = null }: ChatInterfaceProps) {
  const {
    messages = [],
    isLoading,
    sendMessage,
    parsedData,
    bookingData,
    currentStep,
    missingSteps,
    summaryReady,
    summaryData,
    confirmBooking,
    isConfirming,
    bookingSaved,
    error,
    confirmationError,
    resetConfirmationError,
  } = useChat();

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = (override?: string) => {
    const messageToSend = override ?? input;
    if (!messageToSend.trim()) {
      return;
    }
    resetConfirmationError();
    sendMessage(messageToSend.trim());
    setInput('');
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (confirmationError) {
      resetConfirmationError();
    }
    setInput(event.target.value);
  };

  const checklist = useMemo(() => {
    return CHECKLIST_STEPS.map(({ key, label }, index) => {
      if (currentStep === 'completato') {
        return { key, label, completed: true, active: false, index };
      }
      const isCompleted =
        key === 'riepilogo'
          ? bookingSaved
          : !missingSteps.includes(key as ChecklistKey);
      const isActive =
        key === currentStep ||
        (key === 'riepilogo' && currentStep === 'riepilogo' && !bookingSaved);
      return { key, label, completed: isCompleted, active: isActive, index };
    });
  }, [bookingSaved, currentStep, missingSteps]);

  const bookingFlowActive =
    bookingSaved ||
    summaryReady ||
    (parsedData?.intent === 'prenotazione') ||
    Boolean(
      bookingData.nome ||
        bookingData.telefono ||
        bookingData.bookingDateTime ||
        bookingData.partySize
    );

  if (!Array.isArray(messages) || messages.length <= 1) {
    return (
      <ChatIntroScreen
        onSuggestionClick={handleSendMessage}
        businessName={assistantConfig?.name}
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {bookingFlowActive && !bookingSaved && (
        <div className="border-b border-gray-200 bg-white px-4 py-3">
          <BookingChecklist steps={checklist} currentStep={currentStep} />
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.slice(1).map((msg) => (
          <ChatBubble
            key={msg.id}
            role={msg.role}
            content={msg.content}
            menuUrl={assistantConfig?.menu_url ? String(assistantConfig.menu_url) : undefined}
          />
        ))}
        {bookingFlowActive && summaryReady && summaryData && (
          <BookingSummaryCard data={summaryData} />
        )}
        {isLoading && <Typing />}
        <div ref={messagesEndRef} />
      </div>
      <div className="border-t border-gray-200 bg-white p-4 space-y-3">
        {(error || confirmationError) && (
          <p className="text-sm text-red-600">
            {confirmationError || error}
          </p>
        )}
        {bookingFlowActive && !summaryReady && missingSteps.length > 0 && (
          <p className="text-xs text-gray-500">
            Dati mancanti: {missingSteps.map((step) => STEP_LABEL_MAP[step as ChecklistKey]).join(', ')}
          </p>
        )}
        {bookingSaved && (
          <p className="text-sm text-green-600">
            Richiesta inviata con successo. Il ristorante ti contatterà a breve!
          </p>
        )}
        {bookingFlowActive && (
          <button
            type="button"
            className="w-full rounded-md bg-indigo-600 px-4 py-2 text-white font-semibold shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-300"
            onClick={confirmBooking}
            disabled={!summaryReady || bookingSaved || isConfirming}
          >
            {bookingSaved
              ? 'Prenotazione inviata'
              : isConfirming
              ? 'Invio in corso...'
              : 'Conferma prenotazione'}
          </button>
        )}
      </div>
      <MessageInput
        input={input}
        handleInputChange={handleInputChange}
        handleSend={handleSendMessage}
        isLoading={isLoading || isConfirming}
      />
    </div>
  );
}

type ChecklistItem = {
  key: ChecklistKey;
  label: string;
  completed: boolean;
  active: boolean;
  index: number;
};

function BookingChecklist({ steps, currentStep }: { steps: ChecklistItem[]; currentStep: string }) {
  const completedCount = steps.filter((step) => step.completed).length;
  const progressPercent = Math.min(100, Math.round((completedCount / steps.length) * 100));

  return (
    <div className="space-y-2">
      <div className="h-2 w-full rounded-full bg-gray-200">
        <div
          className="h-2 rounded-full bg-indigo-500 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      {currentStep === 'completato' && (
        <span className="text-xs font-semibold text-green-600">
          Tutti i passaggi completati
        </span>
      )}
    </div>
  );
}

function BookingSummaryCard({ data }: { data: SummaryData }) {
  const isoDate = data.bookingDateTime ? new Date(data.bookingDateTime) : null;
  const validDate = isoDate && !Number.isNaN(isoDate.getTime()) ? isoDate : null;
  const dateLabel =
    data.dateDisplay ||
    (validDate ? validDate.toLocaleDateString('it-IT') : '—');
  const timeLabel =
    data.timeDisplay ||
    (validDate
      ? validDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
      : '—');

  return (
    <div className="rounded-lg border border-indigo-200 bg-white p-4 text-sm text-gray-900 shadow-sm">
      <h3 className="text-sm font-semibold mb-3">Riepilogo prenotazione</h3>
      <dl className="space-y-2">
        <SummaryRow label="Nome" value={data.nome} />
        <SummaryRow label="Telefono" value={data.telefono} />
        <SummaryRow label="Data" value={dateLabel} />
        <SummaryRow label="Orario" value={timeLabel} />
        <SummaryRow label="Persone" value={`${data.partySize}`} />
        <SummaryRow label="Allergie/Richieste" value={data.allergeni || 'Nessuna'} />
      </dl>
      <p className="mt-3 text-xs text-indigo-700">
        Controlla attentamente i dettagli. Premi «Conferma prenotazione» solo se tutte le informazioni
        sono corrette.
      </p>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="font-medium">{label}</dt>
      <dd className="text-right text-sm text-gray-700 max-w-[60%]">{value}</dd>
    </div>
  );
}
