// components/chat/SummaryBubble.tsx
import { AiResult, ChatFormState } from "@/lib/types";
import { User, MapPin, Phone, Mail, Clock, Tag, CircleDollarSign, Timer } from 'lucide-react';

interface SummaryBubbleProps {
    form: Partial<ChatFormState>;
    aiResult: AiResult | null;
}

const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | number | null }) => {
    if (!value) return null;
    return (
        <div className="flex items-start">
            <div className="w-6 h-6 flex-shrink-0 text-primary">{icon}</div>
            <div className="ml-3">
                <p className="text-sm font-semibold text-foreground">{label}</p>
                <p className="text-sm text-muted-foreground">{value}</p>
            </div>
        </div>
    );
};

export function SummaryBubble({ form, aiResult }: SummaryBubbleProps) {
    const stimaPrezzo = aiResult?.price_low && aiResult?.price_high
        ? `~${aiResult.price_low} - ${aiResult.price_high}€`
        : 'Da definire';

    return (
        <div className="p-4 bg-secondary/50 border border-border rounded-lg text-left w-full">
            <h3 className="text-lg font-bold text-foreground mb-4">Riepilogo Richiesta</h3>
            
            <div className="space-y-4">
                {/* Dettagli Intervento */}
                <InfoRow icon={<Tag size={20} />} label="Tipo di Intervento" value={aiResult?.category} />
                <InfoRow icon={<CircleDollarSign size={20} />} label="Stima Costo" value={stimaPrezzo} />
                <InfoRow icon={<Timer size={20} />} label="Tempo Stimato" value={aiResult?.est_minutes ? `~${aiResult.est_minutes} min` : 'N/D'} />

                {/* Dati Personali */}
                <div className="border-t border-border my-4"></div>
                <InfoRow icon={<User size={20} />} label="Nome" value={form.name} />
                {/* --- CORREZIONE: Mostra solo form.address --- */}
                <InfoRow icon={<MapPin size={20} />} label="Indirizzo" value={form.address} />
                <InfoRow icon={<Phone size={20} />} label="Telefono" value={form.phone} />
                {form.email && <InfoRow icon={<Mail size={20} />} label="Email" value={form.email} />}
                <InfoRow icon={<Clock size={20} />} label="Disponibilità" value={form.timeslot} />
            </div>
        </div>
    );
}