'use client';
import { signOut } from 'next-auth/react';

export default function AuthButtons({ logged }: { logged: boolean }) {
  if (!logged) {
    return (
      <div className="flex gap-2">
        <a className="btn" href="/login">Login</a>
        <a className="btn-outline" href="/register">Registrati</a>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-slate-600">Connesso</span>
      <button className="btn" onClick={() => signOut({ callbackUrl: '/' })}>Esci</button>
    </div>
  );
}