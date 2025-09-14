// app/register/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LoaderCircle, Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError('Le password non coincidono.');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('La password deve essere di almeno 8 caratteri.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Si è verificato un errore durante la registrazione.');
      }

      setSuccess('Registrazione completata! Sarai reindirizzato al login tra poco...');
      setTimeout(() => {
        router.push('/login');
      }, 2500);

    } catch (err: any) {
      setError(err.message);
    } finally {
        if (!success) setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-secondary/50 p-4">
      <div className="w-full max-w-sm rounded-xl border bg-card text-card-foreground shadow-lg">
        <form onSubmit={handleRegister} className="p-6 sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold tracking-tight">Crea un account</h1>
            <p className="text-sm text-muted-foreground">
              Registrati per salvare le tue richieste e gestirle facilmente.
            </p>
          </div>

          {error && <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-center text-sm text-destructive">{error}</div>}
          {success && <div className="mb-4 rounded-md border border-green-500/50 bg-green-500/10 p-3 text-center text-sm text-green-700 dark:text-green-400">{success}</div>}
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">Nome</label>
              <input id="name" name="name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Mario Rossi" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <input id="email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nome@esempio.com" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            </div>
            
            <div className="space-y-2 relative">
              <label htmlFor="password" className="text-sm font-medium">Password</label>
              <input id="password" name="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-9 text-muted-foreground"><span className="sr-only">Toggle password visibility</span>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>

            <div className="space-y-2 relative">
              <label htmlFor="confirmPassword" className="text-sm font-medium">Conferma Password</label>
              <input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-9 text-muted-foreground"><span className="sr-only">Toggle password visibility</span>{showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
          </div>
          
          <button type="submit" disabled={loading || !!success} className="mt-6 inline-flex h-10 w-full items-center justify-center whitespace-nowrap rounded-md bg-primary text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 disabled:opacity-50">
            {loading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : 'Registrati'}
          </button>
        </form>

        <div className="border-t bg-secondary/50 p-4 text-center text-sm">
          <p className="text-muted-foreground">
            Hai già un account?{' '}
            <Link href="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
              Accedi
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}