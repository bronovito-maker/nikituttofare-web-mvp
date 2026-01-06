import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Dashboard | NikiTuttoFare',
  description: 'Pannello di amministrazione per la gestione dei ticket e dei tecnici',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
