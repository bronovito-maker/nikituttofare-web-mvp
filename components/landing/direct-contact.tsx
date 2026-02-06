import { PhoneCall } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';

export function DirectContact() {
    const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '+393461027447';
    // Standard contact for "non-ai" people
    const whatsappUrl = `https://wa.me/${whatsappNumber.replace('+', '')}?text=Ciao Niki, ho bisogno di aiuto urgente`;

    // Emergency "Red Number"
    const emergencyNumber = '+393793394421';
    const emergencyTel = `tel:${emergencyNumber.replaceAll(' ', '')}`;

    return (
        <section className="py-12 px-4 max-w-4xl mx-auto">
            <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none transform rotate-12">
                    {/* Stylized Nokia-like Robust Phone SVG */}
                    <svg width="120" height="200" viewBox="0 0 60 100" fill="currentColor" className="text-slate-400">
                        <rect x="10" y="10" width="40" height="80" rx="5" stroke="currentColor" strokeWidth="2" fill="none" />
                        <rect x="15" y="20" width="30" height="20" rx="2" fill="currentColor" />
                        <rect x="15" y="45" width="30" height="30" fill="none" />
                        <circle cx="20" cy="50" r="2" fill="currentColor" />
                        <circle cx="30" cy="50" r="2" fill="currentColor" />
                        <circle cx="40" cy="50" r="2" fill="currentColor" />
                        <circle cx="20" cy="60" r="2" fill="currentColor" />
                        <circle cx="30" cy="60" r="2" fill="currentColor" />
                        <circle cx="40" cy="60" r="2" fill="currentColor" />
                        <circle cx="20" cy="70" r="2" fill="currentColor" />
                        <circle cx="30" cy="70" r="2" fill="currentColor" />
                        <circle cx="40" cy="70" r="2" fill="currentColor" />
                    </svg>
                </div>

                <CardContent className="p-8 md:p-12 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                    <div className="space-y-4 max-w-lg">
                        <h2 className="text-2xl md:text-3xl font-bold text-white">
                            Hai un&apos;urgenza o preferisci parlare con una persona?
                        </h2>
                        <p className="text-slate-300 text-lg">
                            Salta l&apos;intelligenza artificiale e mettiti subito in contatto con noi.
                        </p>
                    </div>

                    <div className="flex flex-col gap-4 w-full md:w-auto">
                        {/* WhatsApp Button - using dark text for better contrast */}
                        <Button asChild size="lg" className="bg-[#25D366] hover:bg-[#128C7E] text-slate-900 border-0 font-bold h-auto py-4">
                            <Link href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                                <WhatsappIcon className="h-5 w-5 shrink-0" />
                                <span>WhatsApp Diretto</span>
                            </Link>
                        </Button>

                        {/* Red Number Button */}
                        <div className="flex flex-col gap-1 items-center w-full">
                            <Button asChild variant="destructive" size="lg" className="w-full h-auto py-4 bg-red-600 hover:bg-red-700 font-bold border-2 border-red-500 shadow-lg shadow-red-900/20 whitespace-normal text-center">
                                <Link href={emergencyTel} className="flex items-center justify-center gap-2">
                                    <PhoneCall className="h-5 w-5 animate-pulse shrink-0" />
                                    <span>Chiama il Numero Rosso</span>
                                </Link>
                            </Button>
                            <span className="text-xs text-slate-300 font-medium tracking-wide">
                                H24 • Rispondiamo sempre
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </section>
    );
}

function WhatsappIcon(props: Readonly<React.SVGProps<SVGSVGElement>>) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>
    );
}
