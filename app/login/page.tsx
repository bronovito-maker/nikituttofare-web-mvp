'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    // usa provider "credentials" definito in auth.ts
    const res = await signIn('credentials', {
      redirect: true,          // true = lascia gestire a NextAuth il redirect
      callbackUrl: '/',        // dove tornare dopo il login
      email,                   // IMPORTANT: i nomi dei campi devono essere "email" e "password"
      password,
    });
    // se redirect=true, qui non sempre rientra;
    // se volessi gestire il risultato qui, usa redirect:false e controlla res?.error
  }

  return (
    <div className="max-w-sm mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">Login</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          className="input w-full"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          required
        />
        <input
          className="input w-full"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
          required
        />
        {err && <div className="text-red-600 text-sm">{err}</div>}
        <button className="btn-primary w-full" type="submit" disabled={loading}>
          {loading ? '...' : 'Entra'}
        </button>
      </form>
      <div className="text-sm mt-3">
        Non hai un account? <a className="underline" href="/register">Registrati</a>
      </div>
    </div>
  );
}