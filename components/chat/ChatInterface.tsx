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

const DAY_IN_MS = 1000 * 60 * 60 * 24;

const getDayKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;

const formatDayDividerLabel = (date: Date) => {
  const startOfDay = (value: Date) => {
    const normalized = new Date(value);
    normalized.setHours(0, 0, 0, 0);
    return normalized.getTime();
  };

  const today = new Date();
  const diffInDays = Math.round((startOfDay(today) - startOfDay(date)) / DAY_IN_MS);

  if (diffInDays === 0) return 'Oggi';
  if (diffInDays === 1) return 'Ieri';

  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
  };

  if (today.getFullYear() !== date.getFullYear()) {
    options.year = 'numeric';
  }

  const formatted = date.toLocaleDateString('it-IT', options);
  return formatted ? formatted.charAt(0).toUpperCase() + formatted.slice(1) : '';
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
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [activeSlotKey, setActiveSlotKey] = useState<BookingSlotKey | null>(null);
  const slotFlashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isConfirmTooltipVisible, setIsConfirmTooltipVisible] = useState(false);
  const confirmTooltipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const prefersExpandedSummary = window.innerWidth >= 768;
    setIsSummaryOpen(prefersExpandedSummary);
  }, []);

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

  const confirmButtonDisabled = !summaryReady || bookingSaved || isConfirming;
  const shouldShowConfirmTooltip =
    !bookingSaved && !isConfirming && !summaryReady && pendingSlots.length > 0;
  const confirmTooltipContent = shouldShowConfirmTooltip
    ? `Completa i dati mancanti: ${pendingSlots.map((slot) => slot.label).join(', ')}`
    : '';
  const confirmTooltipId = 'confirm-booking-tooltip';

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

    if (slotFlashTimeoutRef.current) {
      clearTimeout(slotFlashTimeoutRef.current);
    }
    setActiveSlotKey(slotKey);
    slotFlashTimeoutRef.current = setTimeout(() => {
      setActiveSlotKey(null);
      slotFlashTimeoutRef.current = null;
    }, 300);
  };

  const showConfirmTooltip = () => {
    if (!shouldShowConfirmTooltip) return;
    if (confirmTooltipTimeoutRef.current) {
      clearTimeout(confirmTooltipTimeoutRef.current);
    }
    setIsConfirmTooltipVisible(true);
  };

  const hideConfirmTooltip = (delay = 0) => {
    if (confirmTooltipTimeoutRef.current) {
      clearTimeout(confirmTooltipTimeoutRef.current);
    }
    if (delay > 0) {
      confirmTooltipTimeoutRef.current = setTimeout(() => {
        setIsConfirmTooltipVisible(false);
        confirmTooltipTimeoutRef.current = null;
      }, delay);
      return;
    }
    setIsConfirmTooltipVisible(false);
    confirmTooltipTimeoutRef.current = null;
  };

  useEffect(() => {
    if (!shouldShowConfirmTooltip) {
      setIsConfirmTooltipVisible(false);
      if (confirmTooltipTimeoutRef.current) {
        clearTimeout(confirmTooltipTimeoutRef.current);
        confirmTooltipTimeoutRef.current = null;
      }
    }
  }, [shouldShowConfirmTooltip]);

  useEffect(() => {
    return () => {
      if (slotFlashTimeoutRef.current) {
        clearTimeout(slotFlashTimeoutRef.current);
      }
      if (confirmTooltipTimeoutRef.current) {
        clearTimeout(confirmTooltipTimeoutRef.current);
      }
    };
  }, []);

  const chatMessagesWithMeta = useMemo(() => {
    if (!Array.isArray(messages)) return [];
    const allowedRoles = new Set(['user', 'assistant', 'system']);
    const baseMessages = messages.slice(1).filter((msg) => allowedRoles.has(msg.role));
    type ChatMessage = (typeof baseMessages)[number];
    const mapped: Array<{
      message: ChatMessage;
      dividerLabel?: string;
      date?: Date;
    }> = [];

    let lastDateKey: string | null = null;

    baseMessages.forEach((msg) => {
      let messageDate: Date | undefined;
      if (msg.createdAt) {
        const parsed = new Date(msg.createdAt);
        if (!Number.isNaN(parsed.getTime())) {
          messageDate = parsed;
        }
      }

      const dateKey = messageDate ? getDayKey(messageDate) : null;
      let dividerLabel: string | undefined;

      if (messageDate && dateKey !== lastDateKey) {
        dividerLabel = formatDayDividerLabel(messageDate);
        lastDateKey = dateKey;
      }

      mapped.push({
        message: msg,
        dividerLabel,
        date: messageDate,
      });
    });

    return mapped;
  }, [messages]);

  if (!Array.isArray(messages) || messages.length <= 1) {
    return (
      <ChatIntroScreen
        onSuggestionClick={handleSendMessage}
        businessName={assistantConfig?.name}
      />
    );
  }

  return (
    <>
      <div className="relative flex h-full min-h-full flex-col bg-gray-50">
        {bookingFlowActive && (
          <div className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1">
                <h2 className="text-sm font-semibold text-gray-700">
                  Panoramica prenotazione
                </h2>
                {!bookingSaved && pendingSlots.length > 0 && (
                  <p className="text-xs text-gray-500">
                    Clicca su un dato per aggiornarlo
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsSummaryOpen((prev) => !prev)}
                className="text-xs font-semibold text-indigo-600 underline-offset-4 transition hover:underline"
                aria-expanded={isSummaryOpen}
              >
                {isSummaryOpen ? 'Nascondi' : 'Vedi riepilogo'}
              </button>
            </div>
            {isSummaryOpen && (
              <div className="mt-3 space-y-3">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 md:grid-cols-3">
                  {slotItems.map(
                    ({ key, label, status, displayValue, helper, isRecent, hasValue }) => {
                      const statusStyles =
                        status === 'complete'
                          ? 'border-green-200 bg-green-50/70 hover:bg-green-100'
                          : status === 'clarify'
                          ? 'border-amber-200 bg-amber-50/70 hover:bg-amber-100'
                          : 'border-red-200 bg-red-50/70 hover:bg-red-100';

                      const badge = SLOT_STATUS_LABEL[status];
                      const highlightClass =
                        activeSlotKey === key
                          ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-white'
                          : isRecent
                          ? 'ring-2 ring-indigo-300'
                          : '';

                      const className = [
                        'text-left rounded-lg border px-2 py-1.5 text-xs transition focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:px-3 sm:py-2 sm:text-sm',
                        statusStyles,
                        highlightClass,
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
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 sm:text-xs">
                              {label}
                            </p>
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold sm:text-xs ${badge.className}`}
                            >
                              {badge.text}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-gray-900 sm:text-sm">
                            {displayValue ||
                              (status === 'missing'
                                ? 'Dato mancante'
                                : hasValue
                                ? 'Dato da confermare'
                                : 'Dato mancante')}
                          </p>
                          {helper && (
                            <p className="mt-1 text-[11px] text-amber-700 sm:text-xs">
                              {helper}
                            </p>
                          )}
                        </button>
                      );
                    }
                  )}
                </div>
                {clarifications.length > 0 && (
                  <div className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
                    Alcuni dati sono generici o ambigui: conferma{' '}
                    {clarifications
                      .map(
                        ({ slot }) => SLOT_CONFIG.find((item) => item.key === slot)?.label ?? slot
                      )
                      .join(', ')}
                    .
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-4 pb-28 pt-4 space-y-4">
          {chatMessagesWithMeta.map(({ message: msg, dividerLabel, date }) => (
            <div key={msg.id} className="space-y-2">
              {dividerLabel && (
                <div className="flex justify-center">
                  <span className="rounded-full bg-gray-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                    {dividerLabel}
                  </span>
                </div>
              )}
              <ChatBubble
                role={msg.role}
                content={msg.content}
                menuUrl={assistantConfig?.menu_url ? String(assistantConfig.menu_url) : undefined}
                createdAt={date}
              />
            </div>
          ))}
          {bookingFlowActive && summaryReady && summaryData && (
            <BookingSummaryCard data={summaryData} />
          )}
          {isLoading && <Typing />}
          <div ref={messagesEndRef} />
        </div>
        <div className="border-t border-gray-200 bg-white px-4 pb-6 pt-4 space-y-3 shadow-sm">
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
            <div
              className="relative w-full"
              onMouseEnter={showConfirmTooltip}
              onMouseLeave={() => hideConfirmTooltip()}
              onFocus={showConfirmTooltip}
              onBlur={() => hideConfirmTooltip()}
              onTouchStart={() => {
                showConfirmTooltip();
                hideConfirmTooltip(2500);
              }}
              onTouchEnd={() => hideConfirmTooltip(1200)}
              role="group"
              tabIndex={shouldShowConfirmTooltip ? 0 : -1}
              aria-describedby={shouldShowConfirmTooltip ? confirmTooltipId : undefined}
            >
              <button
                type="button"
                className="w-full rounded-md bg-indigo-600 px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-300"
                onClick={confirmBooking}
                disabled={confirmButtonDisabled}
                aria-describedby={shouldShowConfirmTooltip ? confirmTooltipId : undefined}
              >
                {bookingSaved
                  ? 'Prenotazione inviata'
                  : isConfirming
                  ? 'Invio in corso...'
                  : 'Conferma prenotazione'}
              </button>
              {shouldShowConfirmTooltip && isConfirmTooltipVisible && (
                <div
                  id={confirmTooltipId}
                  role="tooltip"
                  className="pointer-events-none absolute bottom-full left-1/2 z-30 w-max max-w-[min(280px,90vw)] -translate-x-1/2 -translate-y-2 rounded-md bg-gray-900 px-3 py-2 text-xs font-medium text-white shadow-lg"
                >
                  {confirmTooltipContent}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 z-40">
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
    </>
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
