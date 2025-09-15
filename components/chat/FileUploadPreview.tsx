// components/chat/FileUploadPreview.tsx
import { X } from 'lucide-react';

interface FileUploadPreviewProps {
    previewUrl: string;
    onRemove: () => void;
}

export function FileUploadPreview({ previewUrl, onRemove }: FileUploadPreviewProps) {
    return (
        <div className="relative inline-block mb-2 p-2 border bg-secondary rounded-lg">
            <img src={previewUrl} alt="Anteprima" className="h-20 w-20 object-cover rounded" />
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