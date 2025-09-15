// app/api/upload/route.ts
import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  if (!filename || !request.body) {
    return NextResponse.json({ error: "Nome del file non valido." }, { status: 400 });
  }

  // Pulisci il nome del file per sicurezza
  const safeFilename = filename.replace(/[^a-zA-Z0-9_.-]/g, '_');

  try {
    const blob = await put(safeFilename, request.body, {
      access: 'public',
    });
    return NextResponse.json(blob);
  } catch (error: any) {
    console.error("[API Upload Error]:", error);
    return NextResponse.json({ error: `Errore durante l'upload: ${error.message}` }, { status: 500 });
  }
}