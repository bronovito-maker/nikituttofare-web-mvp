// components/ui/markdown-renderer.tsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
    return (
        <div className={`prose prose-invert prose-sm max-w-none ${className}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    // Personalizzazione degli elementi per lo stile tecnico
                    p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                    li: ({ children }) => <li className="text-slate-300">{children}</li>,
                    strong: ({ children }) => <strong className="text-blue-400 font-semibold">{children}</strong>,
                    code: ({ children }) => <code className="bg-slate-800 px-1 rounded text-pink-400 font-mono text-xs">{children}</code>,
                    h1: ({ children }) => <h1 className="text-lg font-bold mb-2 text-white">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-md font-bold mb-1 text-white">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-sm font-bold mb-1 text-white">{children}</h3>,
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
