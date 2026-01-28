import React from 'react';
import { Phone, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ContactActionsProps {
    readonly phone: string;
}

export function ContactActions({ phone }: ContactActionsProps) {
    // Utility per pulire il numero per WhatsApp (rimuove tutto tranne i numeri)
    // Esempio: "+39 333 123 4567" -> "393331234567"
    const cleanPhoneForWhatsApp = (p: string) => {
        return p.replaceAll(/\D/g, '');
    };

    // Utility per il dialer (mantiene + ma rimuove spazi)
    // Esempio: "+39 333 123 4567" -> "+393331234567"
    const cleanPhoneForDialer = (p: string) => {
        return p.replaceAll(/\s/g, '');
    };

    const waNumber = cleanPhoneForWhatsApp(phone);
    const waMessage = encodeURIComponent("Salve, sono il tecnico di NikiTuttoFare per l'intervento...");
    const waUrl = `https://wa.me/${waNumber}?text=${waMessage}`;

    const dialerPhone = cleanPhoneForDialer(phone);

    return (
        <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 mb-6 shadow-sm">
            <div className="flex gap-3 max-w-2xl mx-auto">
                {/* Pulsante Chiama (A) */}
                <Button
                    asChild
                    className="flex-1 h-12 text-base font-bold bg-green-600 hover:bg-green-700 text-white shadow-md active:scale-95 transition-all"
                >
                    <a href={`tel:${dialerPhone}`}>
                        <Phone className="w-5 h-5 mr-2 fill-current" />
                        Chiama
                    </a>
                </Button>

                {/* Pulsante WhatsApp (B) */}
                <Button
                    asChild
                    className="flex-1 h-12 text-base font-bold bg-[#25D366] hover:bg-[#128C7E] text-white shadow-md active:scale-95 transition-all"
                >
                    <a href={waUrl} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="w-5 h-5 mr-2" />
                        WhatsApp
                    </a>
                </Button>
            </div>
        </div>
    );
}
