'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function HeaderTabs() {
  const pathname = usePathname();
  const isChat = pathname?.startsWith('/chat') || pathname === '/';
  const isDash = pathname?.startsWith('/dashboard');

  return (
    <nav className="nav-tabs mx-auto">
      <Link href="/chat" className={`nav-tab ${isChat ? 'is-active' : ''}`}>Chat</Link>
      <Link href="/dashboard" className={`nav-tab ${isDash ? 'is-active' : ''}`}>Dashboard</Link>
    </nav>
  );
}