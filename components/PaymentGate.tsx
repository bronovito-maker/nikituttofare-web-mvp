
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export const PaymentGate = ({ onUnlock }: { onUnlock: () => void }) => {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    try {
      // Simulate API call to Stripe
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ leadId: '123' }), // Pass leadId or other relevant data
      });

      if (response.ok) {
        toast.success('Pagamento avvenuto con successo!');
        onUnlock();
      } else {
        // Handle payment failure
        toast.error('Pagamento fallito. Riprova.');
        console.error('Payment failed');
      }
    } catch (error) {
      toast.error('Si è verificato un errore durante il pagamento.');
      console.error('An error occurred during payment:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Sblocca Contatto - 15€</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4">Paga per vedere i dettagli di contatto del cliente.</p>
        <Button onClick={handlePayment} disabled={loading} className="h-12 px-6 w-full">
          {loading ? 'Pagamento in corso...' : 'Paga Ora'}
        </Button>
      </CardContent>
    </Card>
  );
};
