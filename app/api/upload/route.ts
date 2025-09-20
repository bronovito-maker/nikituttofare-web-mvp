// app/api/upload/route.ts
import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  if (!filename || !request.body) {
    return NextResponse.json({ error: 'Nessun nome file fornito' }, { status: 400 });
  }

  const blob = await put(filename, request.body, {
    access: 'public',
    // --- QUESTA È LA RIGA CHE RISOLVE IL PROBLEMA ---
    addRandomSuffix: true, // Aggiunge un suffisso casuale per garantire l'unicità
  });

  return NextResponse.json(blob);
}