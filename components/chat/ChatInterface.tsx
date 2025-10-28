'use client';

import {
  ChangeEvent,
  CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useChat } from '@/hooks/useChat';
import { ChatIntroScreen } from './ChatIntroScreen';
import MessageInput from './MessageInput';
import Typing from '../Typing';
import ChatBubble from '../ChatBubble';
import { BookingPillBar } from './BookingPillBar';
import type { AssistantConfig } from '@/lib/types';
import type { BookingSlotKey } from '@/lib/chat-parser';
import type { Message } from 'ai/react';

type ChatInterfaceProps = {
  assistantConfig?: AssistantConfig | null;
  widgetColor?: string | null;
};

type SlotStatus = 'missing' | 'clarify' | 'complete';

type SlotConfig = {
  key: BookingSlotKey;
  label: string;
  editTemplate: { missing: string; clarify: string; complete: string };
};

const isDisplayableMessage = (
  message: Message
): message is Message & { role: Extract<Message['role'], 'user' | 'assistant' | 'system'> } =>
  message.role === 'user' || message.role === 'assistant' || message.role === 'system';

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

export default function ChatInterface({
  assistantConfig = null,
  widgetColor,
}: ChatInterfaceProps) {
  const {
    messages = [],
    isLoading,
    sendMessage,
    parsedData,
    bookingData,
    summaryReady,
    confirmBooking,
    isConfirming,
    bookingSaved,
    error,
    confirmationError,
    resetConfirmationError,
    slotState,
    clarifications,
    recentlyUpdatedSlots,
    highlightSlot,
    handlePillBarUpdate,
    handlePillBarClear,
  } = useChat();

  const [input, setInput] = useState('');
  const [inputSelection, setInputSelection] = useState<{ start: number; end: number } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const [isConfirmTooltipVisible, setIsConfirmTooltipVisible] = useState(false);
  const confirmTooltipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const confirmButtonDisabled = !summaryReady || bookingSaved || isConfirming;
  const shouldShowConfirmTooltip =
    !bookingSaved && !isConfirming && !summaryReady && pendingSlots.length > 0;
  const confirmTooltipContent = shouldShowConfirmTooltip
    ? `Completa i dati mancanti: ${pendingSlots.map((slot) => slot.label).join(', ')}`
    : '';
  const confirmTooltipId = 'confirm-booking-tooltip';

  const accentColor = widgetColor?.trim() || '#4f46e5';
  const accentVars = {
    '--widget-primary-color': accentColor,
  } as CSSProperties;

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
      if (confirmTooltipTimeoutRef.current) {
        clearTimeout(confirmTooltipTimeoutRef.current);
      }
    };
  }, []);

  const chatMessagesWithMeta = useMemo(() => {
    if (!Array.isArray(messages)) return [];
    const baseMessages = messages.slice(1);
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

  const metaByMessageId = useMemo(() => {
    const map = new Map<string | number, { dividerLabel?: string; date?: Date }>();
    chatMessagesWithMeta.forEach(({ message, dividerLabel, date }, idx) => {
      if (message.id === undefined || message.id === null) {
        map.set(idx, { dividerLabel, date });
        return;
      }
      map.set(message.id, { dividerLabel, date });
    });
    return map;
  }, [chatMessagesWithMeta]);

  if (!Array.isArray(messages) || messages.length <= 1) {
    return (
      <ChatIntroScreen
        onSuggestionClick={handleSendMessage}
        businessName={assistantConfig?.name}
      />
    );
  }

  return (
    <div
      className="relative flex h-full min-h-full flex-col bg-gray-50"
      style={accentVars}
    >
        <div className="flex-1 overflow-y-auto px-4 pb-28 pt-4 space-y-4">
          {messages
            .slice(1)
            .filter(isDisplayableMessage)
            .map((msg, index) => {
              const metaKey =
                msg.id === undefined || msg.id === null ? index : msg.id;
              const meta = metaByMessageId.get(metaKey) ?? {};
              const { dividerLabel, date } = meta;
              return (
                <div key={msg.id ?? index} className="space-y-2">
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
              );
            })}
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
                className="w-full rounded-md px-4 py-2 font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                style={{ backgroundColor: 'var(--widget-primary-color)' }}
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
        <div className="fixed bottom-0 left-0 right-0 z-40">
          {bookingFlowActive && (
            <BookingPillBar
              slots={slotState}
              highlightSlot={highlightSlot}
              updateSlotValue={handlePillBarUpdate}
              onClearSlot={handlePillBarClear}
            />
          )}
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
    </div>
  );
}
