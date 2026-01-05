
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PaymentGate } from '@/components/PaymentGate';

// Mock data for the lead
const getLeadData = async (leadId: string) => {
  console.log(`Fetching data for lead: ${leadId}`);
  // In a real application, you would fetch this data from your API
  return {
    id: leadId,
    problemDescription: 'Perdita d\'acqua sotto il lavello della cucina. Sembra provenire dal sifone.',
    location: 'Rimini',
    customer: {
      name: 'Mario Rossi',
      phone: '3331234567',
    },
  };
};

export default function LeadPage({ params }: { params: { leadId: string } }) {
  const [lead, setLead] = useState<any>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    const fetchLead = async () => {
      const leadData = await getLeadData(params.leadId);
      setLead(leadData);
    };
    fetchLead();
  }, [params.leadId]);

  if (!lead) {
    return <div>Caricamento...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Dettagli del Lead</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <h2 className="text-lg font-semibold">Descrizione del Problema</h2>
            <p>{lead.problemDescription}</p>
          </div>
          <div className="mt-4">
            <h2 className="text-lg font-semibold">Zona</h2>
            <p>{lead.location}</p>
          </div>
          <div className="mt-4">
            <h2 className="text-lg font-semibold">Contatto Cliente</h2>
            <div className={!isUnlocked ? 'blur-sm' : ''}>
              <p>
                <strong>Nome:</strong> {lead.customer.name}
              </p>
              <p>
                <strong>Telefono:</strong> {lead.customer.phone}
              </p>
            </div>
          </div>
          {!isUnlocked ? (
            <PaymentGate onUnlock={() => setIsUnlocked(true)} />
          ) : (
            <Button className="mt-4" onClick={() => window.location.href = `tel:${lead.customer.phone}`}>
              Chiama Cliente
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
