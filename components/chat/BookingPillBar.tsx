'use client';

import * as Popover from '@radix-ui/react-popover';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';
import type { BookingSlotKey } from '@/lib/chat-parser';
import type { BookingSlots, SlotState } from '@/hooks/useChat';

type PillBarProps = {
  slots: BookingSlots;
  highlightSlot: BookingSlotKey | null;
  updateSlotValue: (slot: BookingSlotKey, value: string) => void;
  onClearSlot: (slot: BookingSlotKey) => void;
};

const SLOT_CONFIG: { key: BookingSlotKey; label: string }[] = [
  { key: 'nome', label: 'Nome' },
  { key: 'data', label: 'Data' },
  { key: 'orario', label: 'Orario' },
  { key: 'persone', label: 'Persone' },
  { key: 'telefono', label: 'Telefono' },
  { key: 'allergeni', label: 'Allergie' },
];

export function BookingPillBar({
  slots,
  highlightSlot,
  updateSlotValue,
  onClearSlot,
}: PillBarProps) {
  const [openPopover, setOpenPopover] = useState<BookingSlotKey | null>(null);

  const missingSlots = SLOT_CONFIG.filter((config) => {
    const slot = slots[config.key];
    if (!slot) return true;
    return !slot.isFilled || slot.needsClarification;
  });
  const filledSlots = SLOT_CONFIG.filter((config) => {
    const slot = slots[config.key];
    return slot?.isFilled && !slot.needsClarification;
  });

  if (missingSlots.length === 0) {
    return null;
  }

  return (
    <div className="border-t border-gray-200 bg-gray-50/50 p-3">
      <div className="mb-1 ml-1 text-xs font-medium text-gray-500">Dati richiesti:</div>
      <div className="flex flex-wrap items-center gap-2">
        {missingSlots.map((config) => (
          <SlotPill
            key={config.key}
            slotKey={config.key}
            label={config.label}
            slotState={slots[config.key]}
            isHighlighted={highlightSlot === config.key}
            isOpen={openPopover === config.key}
            setIsOpen={(open) => setOpenPopover(open ? config.key : null)}
            onUpdate={updateSlotValue}
          />
        ))}
        {filledSlots.map((config) => (
          <SlotPill
            key={config.key}
            slotKey={config.key}
            label={config.label}
            slotState={slots[config.key]}
            isHighlighted={false}
            isOpen={openPopover === config.key}
            setIsOpen={(open) => setOpenPopover(open ? config.key : null)}
            onUpdate={updateSlotValue}
            onClear={onClearSlot}
          />
        ))}
      </div>
    </div>
  );
}

type SlotPillProps = {
  slotKey: BookingSlotKey;
  label: string;
  slotState: SlotState | undefined;
  isHighlighted: boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onUpdate: (slot: BookingSlotKey, value: string) => void;
  onClear?: (slot: BookingSlotKey) => void;
};

function SlotPill({
  slotKey,
  label,
  slotState,
  isHighlighted,
  isOpen,
  setIsOpen,
  onUpdate,
  onClear,
}: SlotPillProps) {
  const value = slotState?.value ?? '';
  const [inputValue, setInputValue] = useState(String(value ?? ''));

  useEffect(() => {
    setInputValue(String(slotState?.value ?? ''));
  }, [slotState?.value]);

  const [isFlashing, setIsFlashing] = useState(false);
  useEffect(() => {
    if (isHighlighted) {
      setIsFlashing(true);
      const timer = setTimeout(() => setIsFlashing(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [isHighlighted]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onUpdate(slotKey, inputValue.trim());
      setIsOpen(false);
    }
  };

  const isFilled = Boolean(slotState?.isFilled && slotState.value);
  const needsAttention = Boolean(slotState?.needsClarification);

  const placeholder =
    slotKey === 'data'
      ? 'Es: domani'
      : slotKey === 'orario'
      ? 'Es: 20:30'
      : slotKey === 'persone'
      ? 'Es: 4'
      : slotKey === 'telefono'
      ? 'Es: +39 351...'
      : '';

  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger asChild>
        <button
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-all ${
            isFilled && !needsAttention
              ? 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100'
              : needsAttention
              ? 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
              : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-100'
          } ${isFlashing ? 'animate-pulse ring-2 ring-primary ring-offset-1' : ''}`}
        >
          {label}
          {isFilled && (
            <span className="max-w-[100px] truncate text-xs font-medium text-green-800">
              ({String(slotState?.value ?? '')})
            </span>
          )}
          {needsAttention && (
            <span className="max-w-[100px] truncate text-xs font-medium text-amber-900">(?)</span>
          )}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="top"
          align="start"
          className="z-50 w-64 rounded-lg border bg-white p-4 shadow-md"
          sideOffset={5}
        >
          <form onSubmit={handleSubmit}>
            <label
              htmlFor={`slot-input-${slotKey}`}
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              {needsAttention && slotState?.clarificationReason
                ? slotState.clarificationReason
                : `Modifica ${label}`}
            </label>
            <Input
              id={`slot-input-${slotKey}`}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={
                needsAttention && slotState?.clarificationPhrase
                  ? slotState.clarificationPhrase
                  : placeholder
              }
              autoFocus
            />
            <div className="mt-4 flex justify-between">
              {onClear && isFilled ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => {
                    onClear(slotKey);
                    setIsOpen(false);
                  }}
                >
                  Svuota
                </Button>
              ) : (
                <div />
              )}
              <Button type="submit" size="sm">
                Conferma
              </Button>
            </div>
          </form>
          <Popover.Close
            className="absolute right-2 top-2 rounded-full p-1 text-gray-400 hover:bg-gray-100"
            aria-label="Close"
          >
            <X size={16} />
          </Popover.Close>
          <Popover.Arrow className="fill-white" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
