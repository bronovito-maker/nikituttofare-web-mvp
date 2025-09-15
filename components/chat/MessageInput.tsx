// components/chat/MessageInput.tsx
import { useRef, useEffect } from 'react';
import { Paperclip, SendHorizontal, LoaderCircle } from 'lucide-react';
import { FileUploadPreview } from './FileUploadPreview';

interface MessageInputProps {
    input: string;
    setInput: (value: string) => void;
    loading: boolean;
    handleSend: () => void;
    fileToUpload: File | null;
    previewUrl: string | null;
    handleFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
    removeFile: () => void;
    suggestionText?: string;
}

export function MessageInput({ input, setInput, loading, handleSend, fileToUpload, previewUrl, handleFileSelect, removeFile }: MessageInputProps) {
    const formRef = useRef<HTMLFormElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSend();
    };

    return (
        <div className="p-4 pt-2 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-card/80 backdrop-blur-sm border-t border-border">
            {previewUrl && <FileUploadPreview previewUrl={previewUrl} onRemove={removeFile} />}
            <form ref={formRef} onSubmit={handleSubmit} className="flex items-center gap-2">
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" />
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={loading} className="flex-shrink-0 w-10 h-10 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center hover:bg-muted disabled:opacity-50" aria-label="Allega file">
                    <Paperclip size={20} />
                </button>
                <input 
                    className="w-full px-4 py-2.5 bg-secondary border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Descrivi il problema o allega una foto..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={loading}
                    autoFocus
                />
                <button type="submit" disabled={loading || (!input.trim() && !fileToUpload)} className="flex-shrink-0 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:bg-primary/90 disabled:bg-primary/70">
                    {loading ? <LoaderCircle size={20} className="animate-spin" /> : <SendHorizontal size={20} />}
                </button>
            </form>
        </div>
    );
}