// app/providers.tsx
"use client";

import React, { useState } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { SessionProvider, useSession, signOut } from "next-auth/react";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, LayoutDashboard, LogOut, Menu, X, LogIn, UserPlus } from 'lucide-react';
import Image from "next/image";

// (Il resto del file rimane invariato fino a MobileMenu)
// ...

const MobileMenu = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) => {
    const { data: session } = useSession();
    return (
        <>
            <div className={`fixed inset-0 bg-black/40 z-40 transition-opacity md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose}></div>
            <div className={`fixed top-0 right-0 h-full w-72 bg-card shadow-xl z-50 transform transition-transform md:hidden ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex justify-end p-4"><button onClick={onClose} className="p-2 rounded-md hover:bg-secondary transition-colors"><X size={24} /></button></div>
                <div className="flex flex-col p-6 pt-4 h-full">
                    <div className="space-y-2 flex-grow">
                        {session ? ( <>
                            <Link href="/chat" onClick={onClose} className="flex items-center gap-3 p-3 rounded-lg font-semibold hover:bg-secondary"><MessageSquare size={20} /> Chat</Link>
                            <Link href="/dashboard" onClick={onClose} className="flex items-center gap-3 p-3 rounded-lg font-semibold hover:bg-secondary"><LayoutDashboard size={20} /> Dashboard</Link>
                        </> ) : ( <>
                            <Link href="/login" onClick={onClose} className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary"><LogIn size={20} /> Accedi</Link>
                            <Link href="/register" onClick={onClose} className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary"><UserPlus size={20} /> Registrati</Link>
                        </> )}
                    </div>
                    {/* --- MODIFICA CHIAVE: Aggiunta la sezione per l'utente --- */}
                    {session && (
                        <div className="mt-auto pt-4 border-t border-border">
                            <div className="px-3 py-2 text-sm text-muted-foreground truncate" title={session.user?.email ?? ''}>
                                {session.user?.email}
                            </div>
                            <button onClick={() => { signOut(); onClose(); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary text-red-500 transition-colors text-left w-full font-semibold"><LogOut size={20} /> Esci</button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

// --- Gli altri componenti (AppHeader, AppShell, Providers) rimangono invariati ---

const AppHeader = ({ onMenuToggle }: { onMenuToggle: () => void; }) => {
  const { data: session } = useSession();
  const pathname = usePathname();
  const isChat = pathname === '/chat' || pathname === '/';
  const isDash = pathname === '/dashboard';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex items-center justify-between h-16 mx-auto px-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-foreground">
          <Image src="/logo_ntf.png" alt="NikiTuttoFare Logo" width={32} height={32} className="rounded-md" />
          <span>NikiTuttoFare</span>
        </Link>

        {session && (
          <nav className="hidden md:flex items-center gap-1 rounded-full bg-muted p-1 text-muted-foreground">
            <Link href="/chat" className={`inline-flex items-center justify-center whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-all ${isChat ? 'bg-background text-foreground shadow-sm' : 'hover:bg-background/50'}`}>
              <MessageSquare className="h-4 w-4 mr-2" />Chat
            </Link>
            <Link href="/dashboard" className={`inline-flex items-center justify-center whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-all ${isDash ? 'bg-background text-foreground shadow-sm' : 'hover:bg-background/50'}`}>
              <LayoutDashboard className="h-4 w-4 mr-2" />Dashboard
            </Link>
          </nav>
        )}

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3">
            {session ? (
              <>
                <span className="text-sm text-muted-foreground truncate max-w-48" title={session.user?.email ?? ''}>{session.user?.email}</span>
                <button onClick={() => signOut()} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-9 px-3 border border-input bg-background hover:bg-accent hover:text-accent-foreground">Esci</button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">Accedi</Link>
                <Link href="/register" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-9 px-4 bg-primary text-primary-foreground hover:bg-primary/90">Registrati</Link>
              </>
            )}
          </div>
          <button onClick={onMenuToggle} className="md:hidden p-2 rounded-md hover:bg-secondary transition-colors z-30">
            <Menu size={24} />
          </button>
        </div>
      </div>
    </header>
  );
};

function AppShell({ children }: { children: React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  return (
    <div className="flex flex-col h-dvh bg-background font-sans">
      <AppHeader onMenuToggle={() => setIsMenuOpen(p => !p)} />
      <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      {children}
    </div>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
        <AppShell>
          {children}
        </AppShell>
      </NextThemesProvider>
    </SessionProvider>
  );
}