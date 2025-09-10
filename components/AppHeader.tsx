'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { signOut } from 'next-auth/react'; // 👈 import NextAuth
import HeaderTabs from './HeaderTabs';

type Sess = { user?: { email?: string }; userId?: string };

export default function AppHeader() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch('/api/auth/session', { cache: 'no-store' });
        const j: Sess = await r.json();
        const e = j?.user?.email || j?.userId || null;
        if (alive) setEmail(e);
      } catch {
        if (alive) setEmail(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function logout() {
    await signOut({ callbackUrl: '/' }); // 👈 logout ufficiale NextAuth
  }

  return (
    <header className="topbar">
      <div className="container flex items-center justify-between py-2 gap-2">
        {/* BRAND */}
        <Link href="/" className="brand">
          <img src="/logo_ntf.png" alt="NTF" width={36} height={36} />
          <span>NTF</span>
        </Link>

        {/* Destra: tabs + auth */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
          <HeaderTabs />

          {email ? (
            <>
              <span
                className="pill max-w-[46vw] sm:max-w-none truncate"
                title={email || undefined}
              >
                {email}
              </span>
              <button
                type="button"
                onClick={logout}
                className="btn-outline"
                aria-label="Esci"
              >
                Esci
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="auth-link">
                Accedi
              </Link>
              <Link href="/register" className="btn-primary">
                Registrati
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}