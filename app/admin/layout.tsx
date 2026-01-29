import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Dashboard | NikiTuttoFare',
  description: 'Pannello di amministrazione per la gestione dei ticket e dei tecnici',
};

import { AdminLayoutShell } from '@/components/admin/admin-layout-shell';

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AdminLayoutShell>{children}</AdminLayoutShell>;
}
