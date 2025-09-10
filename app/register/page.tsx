'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    setError(undefined);

    const em = email.trim();
    const n = name.trim();
    const p1 = password.trim();
    const p2 = password2.trim();

    if (!em || !p1 || p1 !== p2) {
      setError('Controlla email e che le password coincidano.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: em, name: n, password: p1 }),
      });
      const j = await res.json();

      if (!j.ok) {
        setError(j.error || 'Registrazione non riuscita');
        return;
      }

      setOk(true);
      setTimeout(() => router.push('/login'), 1200);
    } catch {
      setError('Qualcosa è andato storto. Riprova tra poco.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mt-6">
      <div className="card">
        <h1 className="text-xl font-semibold mb-3">Crea un account</h1>

        <form onSubmit={onSubmit} className="space-y-3">
          <input
            className="input w-full"
            type="text"
            placeholder="Nome (opzionale)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="input w-full"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <input
            className="input w-full"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
          <input
            className="input w-full"
            type="password"
            placeholder="Ripeti password"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            required
            autoComplete="new-password"
          />

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}
          {ok && (
            <div className="text-green-600 text-sm">
              Registrazione ok! Reindirizzo…
            </div>
          )}

          <button className="btn-primary w-full" type="submit" disabled={loading}>
            {loading ? '...' : 'Registrati'}
          </button>
        </form>

        <div className="text-sm mt-3">
          Hai già un account?{' '}
          <a className="underline" href="/login">
            Accedi
          </a>
        </div>
      </div>
    </div>
  );
}