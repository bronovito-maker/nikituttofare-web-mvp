// app/profilo/change-password/page.tsx
'use client';
import Link from 'next/link';

export default function ChangePasswordPage() {
  return (
    <main className="flex-grow container mx-auto px-4 py-8 sm:py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold">Cambia Password</h1>
        <p className="text-muted-foreground mt-2">
          Questa funzionalità è in fase di sviluppo.
        </p>
         <div className="mt-8 p-6 bg-card border rounded-lg">
            <p>Qui potrai inserire la vecchia e la nuova password.</p>
        </div>
        <Link href="/profilo" className="mt-6 inline-block text-primary hover:underline">
            &larr; Torna al profilo
        </Link>
      </div>
    </main>
  );
}