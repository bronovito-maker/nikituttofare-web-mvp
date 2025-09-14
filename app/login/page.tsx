// app/login/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { LoaderCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Controlla se c'è un messaggio di errore nell'URL (es. da un redirect)
  useEffect(() => {
    const callbackError = searchParams.get('error');
    if (callbackError === 'CredentialsSignin') {
      setError('Email o password non validi. Riprova.');
    }
  }, [searchParams]);

  // Gestore per l'invio del modulo
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Usiamo la funzione signIn di NextAuth
      const result = await signIn('credentials', {
        redirect: false, // Gestiamo noi il redirect per mostrare gli errori
        email: email,
        password: password,
      });

      if (result?.error) {
        setError('Credenziali non valide. Controlla email e password.');
        setLoading(false);
      } else if (result?.ok) {
        // Login riuscito, reindirizza alla dashboard
        router.push('/dashboard');
      }
    } catch (err) {
      console.error(err);
      setError('Si è verificato un errore inaspettato.');
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-secondary/50 p-4">
      <div className="w-full max-w-sm rounded-xl border bg-card text-card-foreground shadow-lg">
        <form onSubmit={handleLogin} className="p-6 sm:p-8">
          {/* Intestazione della Card */}
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold tracking-tight">Accedi</h1>
            <p className="text-sm text-muted-foreground">
              Inserisci le tue credenziali per continuare
            </p>
          </div>

          {/* Spazio per i messaggi di errore */}
          {error && (
            <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-center text-sm text-destructive">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            {/* Campo Email */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium leading-none"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@esempio.com"
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
            
            {/* Campo Password */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium leading-none"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
          </div>
          
          {/* Pulsante di Invio */}
          <button
            type="submit"
            disabled={loading}
            className="mt-6 inline-flex h-10 w-full items-center justify-center whitespace-nowrap rounded-md bg-primary text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            {loading ? (
              <LoaderCircle className="h-5 w-5 animate-spin" />
            ) : (
              'Entra'
            )}
          </button>
        </form>

        {/* Link per la Registrazione */}
        <div className="border-t bg-secondary/50 p-4 text-center text-sm">
          <p className="text-muted-foreground">
            Non hai un account?{' '}
            <Link href="/register" className="font-semibold text-primary underline-offset-4 hover:underline">
              Registrati
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}