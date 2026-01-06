import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'I Miei Interventi | NikiTuttoFare',
  description: 'Visualizza lo storico e lo stato delle tue richieste di intervento',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
