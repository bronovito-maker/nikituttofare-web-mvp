// app/layout.tsx
import './globals.css';
import type { ReactNode } from 'react';
import AppHeader from '@/components/AppHeader';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="it" data-theme="dark">
      <body className="min-h-svh">
        <AppHeader />
        <main className="pt-2">{children}</main>
      </body>
    </html>
  );
}