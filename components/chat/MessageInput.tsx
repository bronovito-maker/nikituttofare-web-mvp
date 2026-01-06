// File: components/chat/MessageInput.tsx
'use client';

import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { SendHorizonal, Paperclip, Image as ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FileUploadPreview } from './FileUploadPreview';

interface MessageInputProps {
  input: string;
  handleInputChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSend: (messageOverride?: string, photoFile?: File) => void;
  isLoading: boolean;
  step?: string;
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
  inputRef,
  selection = null,
  onSelectionHandled,
}: MessageInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const internalTextAreaRef = useRef<HTMLTextAreaElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
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
    const file = event.target.files?.[0];
    if (file) {
      // Verifica che sia un'immagine
      if (!file.type.startsWith('image/')) {
        alert('Per favore, seleziona solo file immagine');
        return;
      }
      
      // Verifica dimensione (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('L\'immagine è troppo grande. Massimo 10MB');
        return;
      }

      setSelectedFile(file);
      
      // Crea preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (!isLoading && (input.trim() || selectedFile)) {
        handleSendMessage();
      }
    }
  };

  const handleSendMessage = () => {
    if (input.trim() || selectedFile) {
      handleSend(undefined, selectedFile || undefined);
      // Reset dopo l'invio
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const isDisabled = step === 'done' || isLoading;

  return (
    <div className="p-3 sm:p-4 md:p-6 bg-white">
      {/* Preview immagine */}
      {previewUrl && selectedFile && (
        <div className="mb-3 flex items-center gap-2 max-w-full bg-green-50 border border-green-200 rounded-lg p-2">
          <FileUploadPreview 
            previewUrl={previewUrl} 
            onRemove={handleRemoveFile}
          />
          <div className="flex-1 min-w-0">
            <span className="text-xs sm:text-sm text-gray-700 truncate block font-medium">
              {selectedFile.name}
            </span>
            <span className="text-xs text-green-600 flex items-center gap-1">
              ✓ Immagine pronta per l'invio
            </span>
          </div>
        </div>
      )}
      

      <div className="flex items-end gap-2 sm:gap-3 max-w-4xl mx-auto">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*"
          disabled={isDisabled}
        />
        <Button 
          size="icon" 
          variant="ghost" 
          className="rounded-full flex-shrink-0 h-10 w-10 sm:h-12 sm:w-12" 
          onClick={() => fileInputRef.current?.click()} 
          disabled={isDisabled}
          title="Carica immagine"
        >
          <ImageIcon className="h-5 w-5 sm:h-6 sm:w-6" />
        </Button>
        
        <div className="flex-1 relative">
          <textarea
            value={input}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={isLoading ? "Attendi..." : "Descrivi il problema o carica una foto..."}
            ref={textAreaRef}
            className="w-full rounded-2xl px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-4 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none transition-all border border-transparent text-sm sm:text-base"
            rows={1}
            style={{ 
              maxHeight: '120px',
              minHeight: '44px',
            }}
            disabled={isDisabled}
          />
        </div>
        
        <Button
          size="icon"
          className="rounded-full flex-shrink-0 bg-blue-600 hover:bg-blue-700 h-10 w-10 sm:h-12 sm:w-12 shadow-md"
          onClick={handleSendMessage}
          disabled={(!input.trim() && !selectedFile) || isDisabled}
          title="Invia messaggio"
        >
          <SendHorizonal className="h-5 w-5 sm:h-6 sm:w-6" />
        </Button>
      </div>
      
      {/* Hint - nascosto su mobile, visibile su desktop */}
      <p className="mt-2 text-xs sm:text-sm text-gray-500 text-center hidden sm:block max-w-4xl mx-auto">
        💡 Carica una foto del problema per un preventivo più preciso
      </p>
    </div>
  );
}
