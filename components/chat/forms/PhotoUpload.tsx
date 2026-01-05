"use client"

import { Upload } from "lucide-react";
import { useState, useCallback } from "react";
import { useDropzone, FileRejection } from "react-dropzone";
import { toast } from "sonner";

interface PhotoUploadProps {
  onImageUpload: (base64: string) => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function PhotoUpload({ onImageUpload }: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (fileRejections.length > 0) {
      const rejection = fileRejections[0];
      rejection.errors.forEach(error => {
        if (error.code === 'file-too-large') {
          toast.error(`File troppo grande. La dimensione massima è ${MAX_FILE_SIZE / 1024 / 1024}MB.`);
        }
        if (error.code === 'file-invalid-type') {
          toast.error('Tipo di file non valido. Seleziona un file PNG, JPG o JPEG.');
        }
      });
      return;
    }
    
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setPreview(base64);
        onImageUpload(base64);
      };
      reader.readAsDataURL(file);
    }
  }, [onImageUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.png', '.jpg'] },
    multiple: false,
    maxSize: MAX_FILE_SIZE,
  });

  return (
    <div
      {...getRootProps()}
      className={`mt-4 border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
      ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"}`}
    >
      <input {...getInputProps()} />
      {preview ? (
        <img src={preview} alt="Anteprima" className="max-h-48 mx-auto rounded-lg" />
      ) : (
        <div className="flex flex-col items-center justify-center text-gray-500">
          <Upload className="w-12 h-12 mb-2" />
          {isDragActive ? (
            <p>Rilascia la foto qui...</p>
          ) : (
            <p>Trascina una foto qui, o clicca per selezionarla</p>
          )}
          <p className="text-xs text-gray-400 mt-1">PNG, JPG, JPEG</p>
        </div>
      )}
    </div>
  );
}
