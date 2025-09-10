'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';

type Props = { logged: boolean; userLabel?: string };

function NavLink({
  href,
  children,
  active,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`inline-flex items-center px-2 py-1 rounded-md text-[15px] transition-colors
        ${active ? 'text-ntf-accent font-medium' : 'text-slate-700 hover:text-slate-900'}
        [data-theme=dark]:text-slate-300 [data-theme=dark]:hover:text-white`}
    >
      {children}
    </Link>
  );
}

/** Toggle tema light/dark memorizzando la scelta in localStorage */
function ThemeToggle() {
  const [dark, setDark] = useState<boolean>(false);

  useEffect(() => {
    const saved = localStorage.getItem('ntf-theme'); // 'dark' | 'light' | null
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    const shouldDark = saved ? saved === 'dark' : prefersDark;
    document.documentElement.setAttribute('data-theme', shouldDark ? 'dark' : 'light');
    setDark(shouldDark);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
    localStorage.setItem('ntf-theme', next ? 'dark' : 'light');
  }

  return (
    <button
      onClick={toggle}
      aria-label="Cambia tema"
      className="btn-ghost rounded-xl px-3 py-2"
      title={dark ? 'Tema scuro' : 'Tema chiaro'}
    >
      {dark ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
}

export default function NavClient({ logged, userLabel }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Chiudi menu quando cambi pagina
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="navbar w-full">
      <div className="mx-auto max-w-6xl px-4">
        <nav className="flex h-14 items-center justify-between gap-4">
          {/* Brand */}
          <Link
            href="/"
            className="inline-flex items-center text-lg font-semibold tracking-tight hover:opacity-90"
          >
            Niki Tuttofare
          </Link>

          {/* Centro: link desktop */}
          <div className="hidden items-center gap-6 md:flex">
            <NavLink href="/chat" active={pathname === '/chat'}>Chat</NavLink>
            <NavLink href="/dashboard" active={pathname === '/dashboard'}>Dashboard</NavLink>
          </div>

          {/* Destra: azioni */}
          <div className="hidden items-center gap-2 md:flex">
            <ThemeToggle />
            {!logged ? (
              <>
                <Link href="/login" className="btn">Login</Link>
                <Link href="/register" className="btn-outline">Registrati</Link>
              </>
            ) : (
              <>
                <span
                  className="text-sm text-slate-500 max-w-[220px] truncate [data-theme=dark]:text-slate-400"
                  title={userLabel}
                >
                  Connesso{userLabel ? ` · ${userLabel}` : ''}
                </span>
                <button className="btn" onClick={() => signOut({ callbackUrl: '/' })}>
                  Esci
                </button>
              </>
            )}
          </div>

          {/* Mobile: hamburger */}
          <button
            aria-label="Apri menu"
            aria-expanded={open}
            className="inline-flex items-center justify-center rounded-md p-2 md:hidden hover:bg-slate-100 [data-theme=dark]:hover:bg-white/10"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </nav>
      </div>

      {/* Mobile dropdown (glass) */}
      {open && (
        <div className="md:hidden border-t border-premium-line [data-theme=dark]:border-premium-d_line">
          <div className="mx-auto max-w-6xl px-4 py-3">
            <div className="rounded-2xl border border-premium-line bg-premium-surface-80 shadow-sm
                            [data-theme=dark]:border-premium-d_line [data-theme=dark]:bg-premium-dark-80 p-3">
              <div className="flex flex-col gap-2">
                <NavLink href="/chat" active={pathname === '/chat'} onClick={() => setOpen(false)}>
                  Chat
                </NavLink>
                <NavLink href="/dashboard" active={pathname === '/dashboard'} onClick={() => setOpen(false)}>
                  Dashboard
                </NavLink>

                <div className="flex items-center justify-between pt-2">
                  <ThemeToggle />
                  {!logged ? (
                    <div className="grid grid-cols-2 gap-2">
                      <Link href="/login" className="btn w-full text-center">Login</Link>
                      <Link href="/register" className="btn-outline w-full text-center">Registrati</Link>
                    </div>
                  ) : (
                    <button className="btn" onClick={() => signOut({ callbackUrl: '/' })}>
                      Esci
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}