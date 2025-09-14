// app/layout.tsx
import React from 'react';
import { Providers } from './providers';
import './globals.css';

export const metadata = {
  title: 'NikiTuttoFare',
  description: 'Assistente virtuale per preventivi',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body className="antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}