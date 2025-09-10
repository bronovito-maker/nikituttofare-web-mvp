'use client';
import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

export default function ThemeToggle() {
  // default: rispetta il sistema
  const sysDark = typeof window !== 'undefined'
    ? window.matchMedia?.('(prefers-color-scheme: dark)').matches
    : false;

  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<Theme>(sysDark ? 'dark' : 'light');

  // inizializza da localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ntf-theme') as Theme | null;
      if (saved === 'light' || saved === 'dark') setTheme(saved);
    } catch {}
    setMounted(true);
  }, []);

  // applica tema e persisti
  useEffect(() => {
    if (!mounted) return;
    const html = document.documentElement;
    if (theme === 'dark') html.setAttribute('data-theme', 'dark');
    else html.removeAttribute('data-theme');
    try { localStorage.setItem('ntf-theme', theme); } catch {}
  }, [theme, mounted]);

  if (!mounted) return null;

  return (
    <button
      type="button"
      className="btn-ghost"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label="Cambia tema"
      title={theme === 'dark' ? 'Passa a chiaro' : 'Passa a scuro'}
    >
      {theme === 'dark' ? '🌙' : '☀️'}
    </button>
  );
}