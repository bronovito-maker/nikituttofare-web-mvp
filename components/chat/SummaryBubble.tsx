// File: components/chat/SummaryBubble.tsx

import { ChatFormState } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// --- MODIFICA QUI ---
import { User, MapPin, Phone, MessageSquare, Wrench } from 'lucide-react';
import { ReactNode } from 'react';

// Componente helper per non ripetere codice
const InfoRow = ({ icon, label, value }: { icon: ReactNode; label: string; value?: string }) => {
  if (!value) return null;

  return (
    <div className="flex items-center text-sm text-muted-foreground">
      {icon}
      <span className="font-semibold ml-2 mr-1">{label}:</span>
      <span>{value}</span>
    </div>
  );
};

export const SummaryBubble = ({ form }: { form: ChatFormState }) => {
  if (!form) return null;

  return (
    <Card className="bg-background/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          {/* --- MODIFICA QUI --- */}
          <Wrench size={24} className="mr-2" /> Riepilogo Richiesta
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <InfoRow icon={<MessageSquare size={20} />} label="Richiesta" value={form.message} />
        
        {(form.name || form.address || form.phone) && (
          <>
            <div className="border-t border-border my-4"></div>
            <InfoRow icon={<User size={20} />} label="Nome" value={form.name} />
            <InfoRow icon={<MapPin size={20} />} label="Indirizzo" value={form.address} />
            <InfoRow icon={<Phone size={20} />} label="Telefono" value={form.phone} />
          </>
        )}
      </CardContent>
    </Card>
  );
};