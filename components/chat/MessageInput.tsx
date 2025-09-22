'use client'; // <-- FONDAMENTALE: Aggiungi questa riga in cima al file

import { useRef, ChangeEvent } from 'react';
import { Paperclip, SendHorizonal, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FileUploadPreview } from './FileUploadPreview';

interface MessageInputProps {
  input: string;
  handleInputChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSend: () => void;
  fileToUpload: File | null;
  setFileToUpload: (file: File | null) => void;
  removeFile: () => void;
  previewUrl: string | null;
  step: string;
}

export default function MessageInput({
  input,
  handleInputChange,
  handleSend,
  fileToUpload,
  setFileToUpload,
  removeFile,
  previewUrl,
  step
}: MessageInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (file) {
      setFileToUpload(file);
    }
    event.target.value = '';
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const isDisabled = step === 'done';

  return (
    <div className="relative">
      {previewUrl && (
        <FileUploadPreview previewUrl={previewUrl} onRemove={removeFile} />
      )}
      <div className="flex items-center p-4 border-t bg-white">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*"
          disabled={isDisabled}
        />
        <input
          type="file"
          ref={cameraInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*"
          capture="environment"
          disabled={isDisabled}
        />

        <Button variant="ghost" size="icon" onClick={handleFileClick} disabled={isDisabled}>
          <Paperclip className="h-6 w-6 text-gray-500" />
        </Button>
        
        <Button variant="ghost" size="icon" onClick={handleCameraClick} disabled={isDisabled}>
          <Camera className="h-6 w-6 text-gray-500" />
        </Button>

        <textarea
          value={input}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Scrivi il tuo messaggio..."
          className="flex-1 w-full rounded-full px-4 py-2 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={1}
          style={{ maxHeight: '100px' }}
          disabled={isDisabled}
        />
        <Button
          variant="ghost"
          size="icon"
          className="ml-2"
          onClick={() => handleSend()}
          disabled={(!input.trim() && !fileToUpload) || isDisabled}
        >
          <SendHorizonal className="h-6 w-6 text-blue-500" />
        </Button>
      </div>
    </div>
  );
}