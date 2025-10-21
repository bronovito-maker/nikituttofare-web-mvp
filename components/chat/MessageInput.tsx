// File: components/chat/MessageInput.tsx

'use client';

import { ChangeEvent, useEffect, useMemo, useRef } from 'react';
import { SendHorizonal, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MessageInputProps {
  input: string;
  handleInputChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSend: (messageOverride?: string) => void;
  isLoading: boolean;
  step?: string;
  setFileToUpload?: (file: File | null) => void;
  inputRef?: React.RefObject<HTMLTextAreaElement>;
  selection?: { start: number; end: number } | null;
  onSelectionHandled?: () => void;
}

export default function MessageInput({
  input,
  handleInputChange,
  handleSend,
  isLoading,
  step = 'chat',
  setFileToUpload = () => {},
  inputRef,
  selection = null,
  onSelectionHandled,
}: MessageInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const internalTextAreaRef = useRef<HTMLTextAreaElement>(null);
  const textAreaRef = useMemo(
    () => inputRef ?? internalTextAreaRef,
    [inputRef]
  );

  useEffect(() => {
    if (!selection) return;
    const textarea = textAreaRef.current;
    if (!textarea) return;

    const applySelection = () => {
      const valueLength = textarea.value.length;
      const start = Math.max(0, Math.min(selection.start, valueLength));
      const end = Math.max(start, Math.min(selection.end, valueLength));
      textarea.setSelectionRange(start, end);
      onSelectionHandled?.();
    };

    if (document.activeElement !== textarea) {
      textarea.focus();
      requestAnimationFrame(applySelection);
    } else {
      requestAnimationFrame(applySelection);
    }
  }, [selection, textAreaRef, onSelectionHandled, input]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFileToUpload(event.target.files[0]);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (!isLoading && (input.trim() || fileInputRef.current?.files?.length)) {
        handleSend();
      }
    }
  };

  const isDisabled = step === 'done' || isLoading;

  return (
    <div className="p-4 border-t bg-card">
      <div className="flex items-center gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*"
        />
        <Button size="icon" variant="ghost" className="rounded-full" onClick={() => fileInputRef.current?.click()} disabled={isDisabled}>
          <Paperclip className="h-5 w-5" />
        </Button>
        <textarea
          value={input}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder={isLoading ? "Attendi..." : "Scrivi il tuo messaggio..."}
          ref={textAreaRef}
          className="flex-1 w-full rounded-full px-4 py-2 bg-secondary focus:outline-none focus:ring-2 focus:ring-primary resize-none transition-colors"
          rows={1}
          style={{ maxHeight: '100px' }}
          disabled={isDisabled}
        />
        <Button
          size="icon"
          className="rounded-full flex-shrink-0"
          onClick={() => handleSend()}
          disabled={!input.trim() && !fileInputRef.current?.files?.length || isDisabled}
        >
          <SendHorizonal className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
