'use client';

import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useChat } from '@/hooks/useChat';
import { ChatIntroScreen } from './ChatIntroScreen';
import MessageInput from './MessageInput';
import Typing from '../Typing';
import ChatBubble from '../ChatBubble';
import type { AssistantConfig } from '@/lib/types';
import type { BookingSlotKey } from '@/lib/chat-parser';

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

type SlotStatus = 'missing' | 'clarify' | 'complete';

type SlotConfig = {
  key: BookingSlotKey;
  label: string;
  editTemplate: { missing: string; clarify: string; complete: string };
};

const SLOT_CONFIG: SlotConfig[] = [
  {
    key: 'nome',
    label: 'Nome cliente',
    editTemplate: {
      missing: 'Il mio nome è ',
      clarify: 'Confermo il nome: ',
      complete: 'Aggiorno il nome: ',
    },
  },
  {
    key: 'telefono',
    label: 'Numero di telefono',
    editTemplate: {
      missing: 'Il mio numero di telefono è ',
      clarify: 'Confermo il numero di telefono: ',
      complete: 'Aggiorno il numero di telefono: ',
    },
  },
  {
    key: 'data',
    label: 'Data',
    editTemplate: {
      missing: 'Vorrei prenotare per il giorno ',
      clarify: 'Confermo la data: ',
      complete: 'Aggiorno la data della prenotazione a ',
    },
  },
  {
    key: 'orario',
    label: 'Orario',
    editTemplate: {
      missing: "L'orario che preferisco è ",
      clarify: "Confermo l'orario: ",
      complete: "Aggiorno l'orario a ",
    },
  },
  {
    key: 'persone',
    label: 'Numero di persone',
    editTemplate: {
      missing: 'Siamo in ',
      clarify: 'Confermo il numero di persone: ',
      complete: 'Aggiorno il numero di persone a ',
    },
  },
  {
    key: 'allergeni',
    label: 'Allergie o richieste',
    editTemplate: {
      missing: 'Note o allergie: ',
      clarify: 'Confermo le note/allergie: ',
      complete: 'Aggiorno le note/allergie: ',
    },
  },
];

const SLOT_STATUS_LABEL: Record<SlotStatus, { text: string; className: string }> = {
  complete: {
    text: 'Completo',
    className: 'bg-green-100 text-green-700',
  },
  clarify: {
    text: 'Da confermare',
    className: 'bg-amber-100 text-amber-700',
  },
  missing: {
    text: 'Mancante',
    className: 'bg-red-100 text-red-700',
  },
};

export default function ChatInterface({ assistantConfig = null }: ChatInterfaceProps) {
  const {
    messages = [],
    isLoading,
    sendMessage,
    parsedData,
    bookingData,
    summaryReady,
    summaryData,
    confirmBooking,
    isConfirming,
    bookingSaved,
    error,
    confirmationError,
    resetConfirmationError,
    slotState,
    clarifications,
    recentlyUpdatedSlots,
  } = useChat();

  const [input, setInput] = useState('');
  const [inputSelection, setInputSelection] = useState<{ start: number; end: number } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

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
    setInputSelection(null);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (confirmationError) {
      resetConfirmationError();
    }
    if (inputSelection) {
      setInputSelection(null);
    }
    setInput(event.target.value);
  };

  const slotItems = useMemo(() => {
    const formatValue = (key: BookingSlotKey, raw: string | number | null) => {
      if (raw === null || raw === undefined || raw === '') return '';
      if (key === 'data' && typeof raw === 'string') {
        const date = new Date(raw);
        if (!Number.isNaN(date.getTime())) {
          return date.toLocaleDateString('it-IT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          });
        }
      }
      if (key === 'persone') {
        return String(raw);
      }
      return String(raw);
    };

    return SLOT_CONFIG.map(({ key, label, editTemplate }) => {
      const slot = slotState[key];
      const status: SlotStatus = slot.needsClarification
        ? 'clarify'
        : slot.isFilled
        ? 'complete'
        : 'missing';

      return {
        key,
        label,
        editTemplate,
        status,
        displayValue: formatValue(key, slot.value),
        helper: slot.needsClarification ? slot.clarificationReason ?? undefined : undefined,
        isRecent: recentlyUpdatedSlots.includes(key),
        hasValue: slot.value !== null && slot.value !== undefined && slot.value !== '',
      };
    });
  }, [slotState, recentlyUpdatedSlots]);

  const pendingSlots = useMemo(
    () => slotItems.filter((item) => item.status !== 'complete'),
    [slotItems]
  );

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

  const handleSlotClick = (slotKey: BookingSlotKey) => {
    const slot = slotItems.find((item) => item.key === slotKey);
    if (!slot || bookingSaved) return;

    resetConfirmationError();
    const baseTemplate =
      slot.status === 'missing'
        ? slot.editTemplate.missing
        : slot.status === 'clarify'
        ? slot.editTemplate.clarify
        : slot.editTemplate.complete;
    const placeholder = '...';
    const template = `${baseTemplate}${placeholder}`;

    setInput(template);
    setInputSelection({
      start: baseTemplate.length,
      end: baseTemplate.length + placeholder.length,
    });
    requestAnimationFrame(() => {
      messageInputRef.current?.focus();
    });
  };

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
      {bookingFlowActive && (
        <div className="border-b border-gray-200 bg-white px-4 py-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">
                Panoramica prenotazione
              </h2>
              {!bookingSaved && pendingSlots.length > 0 && (
                <span className="text-xs text-gray-400">
                  Clicca su un dato per aggiornarlo
                </span>
              )}
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {slotItems.map(({ key, label, status, displayValue, helper, isRecent, hasValue }) => {
                const statusStyles =
                  status === 'complete'
                    ? 'border-green-200 bg-green-50/70 hover:bg-green-100'
                    : status === 'clarify'
                    ? 'border-amber-200 bg-amber-50/70 hover:bg-amber-100'
                    : 'border-red-200 bg-red-50/70 hover:bg-red-100';

                const badge = SLOT_STATUS_LABEL[status];

                const className = [
                  'text-left rounded-lg border px-3 py-2 transition focus:outline-none focus:ring-2 focus:ring-indigo-500',
                  statusStyles,
                  isRecent ? 'ring-2 ring-indigo-300' : '',
                  bookingSaved ? 'cursor-default opacity-80 hover:bg-inherit focus:ring-0' : '',
                ]
                  .filter(Boolean)
                  .join(' ');

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleSlotClick(key)}
                    className={className}
                    disabled={bookingSaved}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        {label}
                      </p>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${badge.className}`}
                      >
                        {badge.text}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-900">
                      {displayValue ||
                        (status === 'missing'
                          ? 'Dato mancante'
                          : hasValue
                          ? 'Dato da confermare'
                          : 'Dato mancante')}
                    </p>
                    {helper && (
                      <p className="mt-1 text-xs text-amber-700">
                        {helper}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
            {clarifications.length > 0 && (
              <div className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
                Alcuni dati sono generici o ambigui: conferma {clarifications
                  .map(({ slot }) => SLOT_CONFIG.find((item) => item.key === slot)?.label ?? slot)
                  .join(', ')}.
              </div>
            )}
          </div>
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
        {bookingFlowActive && pendingSlots.length > 0 && !bookingSaved && (
          <p className="text-xs text-gray-500">
            Dati da completare o confermare: {pendingSlots.map((slot) => slot.label).join(', ')}
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
        inputRef={messageInputRef}
        selection={inputSelection}
        onSelectionHandled={() => setInputSelection(null)}
      />
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
      <h3 className="mb-3 text-sm font-semibold">Riepilogo prenotazione</h3>
      <dl className="space-y-2">
        <SummaryRow label="Nome" value={data.nome} />
        <SummaryRow label="Telefono" value={data.telefono} />
        <SummaryRow label="Data" value={dateLabel} />
        <SummaryRow label="Orario" value={timeLabel} />
        <SummaryRow label="Persone" value={`${data.partySize}`} />
        <SummaryRow label="Allergie/Richieste" value={data.allergeni || 'Nessuna'} />
      </dl>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-900 text-right">{value || '—'}</dd>
    </div>
  );
}
