'use client';

import { useState, useRef, useCallback } from 'react';
import { Camera, X, Check, AlertCircle, Loader2 } from 'lucide-react';

interface ImageUploadProps {
  onUploadComplete: (url: string) => void;
  onUploadStart?: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
}

type UploadState = 'idle' | 'selecting' | 'compressing' | 'uploading' | 'success' | 'error';

// Helper functions moved outside the component to reduce nesting
const handleImageLoadForCompression = (
  img: HTMLImageElement,
  canvas: HTMLCanvasElement,
  resolve: (value: Blob) => void,
  reject: (reason?: any) => void
) => {
  const MAX_WIDTH = 1920;
  const MAX_HEIGHT = 1080;
  let { width, height } = img;

  if (width > MAX_WIDTH) {
    height = (height * MAX_WIDTH) / width;
    width = MAX_WIDTH;
  }
  if (height > MAX_HEIGHT) {
    width = (width * MAX_HEIGHT) / height;
    height = MAX_HEIGHT;
  }

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return reject(new Error('Failed to get canvas context'));
  
  ctx.drawImage(img, 0, 0, width, height);

  canvas.toBlob(
    (blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Compressione fallita'));
    },
    'image/jpeg',
    0.85
  );
};

const compressImage = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    img.onload = () => handleImageLoadForCompression(img, canvas, resolve, reject);
    img.onerror = (err) => reject(new Error(`Caricamento immagine fallito: ${err}`));
    img.src = URL.createObjectURL(file);
  });
};

const UploadContent = ({
  state,
  progress,
  errorMessage,
}: {
  state: UploadState;
  progress: number;
  errorMessage: string | null;
}) => {
  switch (state) {
    case 'idle':
      return <Camera className="w-5 h-5 text-slate-500 group-hover:text-slate-700 transition-colors" />;
    case 'selecting':
    case 'compressing':
      return (
        <div className="flex flex-col items-center gap-1">
          <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          <span className="text-[10px] text-slate-500">Preparazione...</span>
        </div>
      );
    case 'uploading':
      return (
        <div className="relative w-8 h-8">
          <svg className="w-8 h-8 transform -rotate-90">
            <circle cx="16" cy="16" r="14" fill="none" stroke="#e2e8f0" strokeWidth="3" />
            <circle
              cx="16"
              cy="16"
              r="14"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 14}`}
              strokeDashoffset={`${2 * Math.PI * 14 * (1 - progress / 100)}`}
              className="transition-all duration-300"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-blue-600">
            {progress}%
          </span>
        </div>
      );
    case 'success':
      return (
        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center animate-in zoom-in-50 duration-300">
          <Check className="w-4 h-4 text-green-600" />
        </div>
      );
    case 'error':
      return (
        <div className="flex flex-col items-center gap-1">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-[10px] text-red-500 text-center leading-tight max-w-[60px]">
            {errorMessage || 'Errore'}
          </span>
        </div>
      );
    default:
      return null;
  }
};


export function ImageUpload({ 
  onUploadComplete, 
  onUploadStart,
  onError,
  disabled = false,
  className = ''
}: ImageUploadProps) {
  const [state, setState] = useState<UploadState>('idle');
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    setState('idle');
    setProgress(0);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setErrorMessage(null);
  }, [previewUrl]);

  const uploadFile = useCallback(async (file: File) => {
    try {
      setState('compressing');
      setProgress(10);
      onUploadStart?.();

      if (!file.type.startsWith('image/')) throw new Error('Solo immagini sono permesse');
      if (file.size > 10 * 1024 * 1024) throw new Error('File troppo grande (max 10MB)');

      const previewDataUrl = URL.createObjectURL(file);
      setPreviewUrl(previewDataUrl);
      setProgress(20);

      let processedFile: Blob = file;
      if (file.size > 2 * 1024 * 1024) {
        processedFile = await compressImage(file);
        setProgress(40);
      } else {
        setProgress(40);
      }

      setState('uploading');
      const formData = new FormData();
      formData.append('file', processedFile, file.name);

      const progressInterval = setInterval(() => setProgress(p => Math.min(p + 10, 90)), 200);

      const response = await fetch('/api/upload-image', { method: 'POST', body: formData });
      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Upload fallito');
      }

      const data = await response.json();
      setProgress(100);
      setState('success');

      setTimeout(() => onUploadComplete(data.url), 500);

    } catch (err) {
      setState('error');
      const message = err instanceof Error ? err.message : 'Errore sconosciuto';
      setErrorMessage(message);
      onError?.(message);
    }
  }, [onUploadComplete, onUploadStart, onError]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [uploadFile]);

  const handleClick = useCallback(() => {
    if (disabled || state === 'compressing' || state === 'uploading') return;
    if (state === 'error') return resetState();
    fileInputRef.current?.click();
  }, [disabled, state, resetState]);

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || state === 'compressing' || state === 'uploading'}
        className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all group ${state === 'error' ? 'bg-red-50 hover:bg-red-100' : state === 'success' ? 'bg-green-50' : 'bg-slate-100 hover:bg-slate-200'} ${(disabled || state === 'compressing' || state === 'uploading') ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <UploadContent state={state} progress={progress} errorMessage={errorMessage} />
      </button>

      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileSelect} className="hidden" disabled={disabled} />

      {state === 'success' && previewUrl && (
        <div className="absolute bottom-full left-0 mb-2 p-1 bg-white rounded-lg shadow-xl border border-slate-200 animate-in slide-in-from-bottom-2 duration-300">
          <img src={previewUrl} alt="Preview" className="h-16 w-auto rounded-md object-cover" />
          <button onClick={(e) => { e.stopPropagation(); resetState(); }} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-slate-900 text-white rounded-full flex items-center justify-center hover:bg-slate-700 transition-colors shadow-lg">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {state === 'error' && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded-lg whitespace-nowrap animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
          Tap per riprovare
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
        </div>
      )}
    </div>
  );
}

export function ImagePreview({ 
  url, 
  onRemove,
  className = ''
}: { 
  url: string; 
  onRemove?: () => void;
  className?: string;
}) {
  return (
    <div className={`relative inline-block ${className}`}>
      <img src={url} alt="Preview" className="h-20 w-auto rounded-xl border border-slate-200 shadow-sm object-cover" />
      {onRemove && (
        <button onClick={onRemove} className="absolute -top-2 -right-2 w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center hover:bg-slate-700 transition-colors shadow-lg">
          <X className="w-4 h-4" />
        </button>
      )}
      <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-green-500 text-white text-[10px] font-bold rounded-md flex items-center gap-0.5">
        <Check className="w-2.5 h-2.5" />
        Caricata
      </div>
    </div>
  );
}