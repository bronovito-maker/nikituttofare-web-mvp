// components/chat/FileUploadPreview.tsx
import Image from 'next/image';
import { X } from 'lucide-react';

interface FileUploadPreviewProps {
    previewUrl: string;
    onRemove: () => void;
}

export function FileUploadPreview({ previewUrl, onRemove }: FileUploadPreviewProps) {
    return (
        <div className="relative inline-block mb-2 p-2 border bg-secondary rounded-lg">
            <Image
                src={previewUrl}
                alt="Anteprima"
                width={80}
                height={80}
                className="h-20 w-20 object-cover rounded"
                unoptimized
            />
            <button 
                onClick={onRemove} 
                className="absolute -top-2 -right-2 bg-muted text-muted-foreground rounded-full p-0.5 hover:bg-destructive hover:text-destructive-foreground"
                aria-label="Rimuovi file"
            >
                <X size={16} />
            </button>
        </div>
    );
}
