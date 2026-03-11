import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ProductCard, ProductMetadata } from '@/components/technician/ProductCard';

interface MarkdownRendererProps {
    content: string;
    className?: string;
    onProductAdd?: (product: ProductMetadata) => void;
}

export function MarkdownRenderer({ content, className = '', onProductAdd }: MarkdownRendererProps) {
    const components = useMemo(() => ({
        // Personalizzazione degli elementi per lo stile tecnico
        p: ({ children }: any) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
        ul: ({ children }: any) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
        ol: ({ children }: any) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
        li: ({ children }: any) => <li className="text-slate-300">{children}</li>,
        strong: ({ children }: any) => <strong className="text-blue-400 font-semibold">{children}</strong>,
        code: ({ node, inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            const lang = match ? match[1] : '';
            
            if (!inline && lang === 'product') {
                try {
                    // Pulizia approfondita del contenuto del blocco
                    let rawContent = String(children).trim();
                    
                    // Rimuovi eventuali tag ```json o simili rimasti per errore
                    rawContent = rawContent.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '').trim();
                    
                    // Se il contenuto è vuoto o chiaramente non un oggetto, mostra come testo
                    if (!rawContent || !rawContent.startsWith('{')) {
                        return <pre className="bg-slate-800 p-2 rounded text-slate-400 text-xs overflow-x-auto whitespace-pre-wrap font-mono">{rawContent}</pre>;
                    }

                    // Proviamo a estrarre solo la parte JSON se c'è testo extra prima o dopo
                    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
                    const jsonStr = jsonMatch ? jsonMatch[0] : rawContent;
                    
                    try {
                        const data = JSON.parse(jsonStr);
                        return <ProductCard product={data} onAddToList={onProductAdd} />;
                    } catch (parseErr) {
                        // Se il parse fallisce (es. troncato), mostriamo il blocco pulito
                        return (
                            <div className="relative group">
                                <pre className="bg-slate-800/50 p-3 rounded-lg border border-red-500/20 text-slate-400 text-xs overflow-x-auto whitespace-pre-wrap font-mono">
                                    {rawContent}
                                </pre>
                                <div className="absolute top-2 right-2 text-[10px] text-red-400 opacity-50">Dati incompleti</div>
                            </div>
                        );
                    }
                } catch (e) {
                    return <pre className="bg-slate-800 p-2 rounded text-slate-500 text-[10px] overflow-x-auto">{String(children)}</pre>;
                }
            }
            
            return (
                <code className="bg-slate-800 px-1 rounded text-pink-400 font-mono text-xs" {...props}>
                    {children}
                </code>
            );
        },
        h1: ({ children }: any) => <h1 className="text-lg font-bold mb-2 text-white">{children}</h1>,
        h2: ({ children }: any) => <h2 className="text-md font-bold mb-1 text-white">{children}</h2>,
        h3: ({ children }: any) => <h3 className="text-sm font-bold mb-1 text-white">{children}</h3>,
        table: ({ children }: any) => (
            <div className="overflow-x-auto my-4 rounded-lg border border-white/10">
                <table className="min-w-full divide-y divide-white/10 text-[11px]">
                    {children}
                </table>
            </div>
        ),
        thead: ({ children }: any) => <thead className="bg-white/5">{children}</thead>,
        th: ({ children }: any) => <th className="px-2 py-1 text-left font-bold text-blue-400">{children}</th>,
        td: ({ children }: any) => <td className="px-2 py-1 text-slate-300 border-t border-white/5">{children}</td>,
    }), [onProductAdd]);

    return (
        <div className={`prose prose-invert prose-sm max-w-none ${className}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={components}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
