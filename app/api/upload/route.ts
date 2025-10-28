// app/api/upload/route.ts
export const runtime = 'nodejs'; // Necessario per il buffer e il parsing
export const dynamic = 'force-dynamic'; // Evita caching della route

import { NextResponse } from 'next/server';
import { put, type PutBlobResult } from '@vercel/blob';

/**
 * FIX (Problema 2): Attende che l'URL del blob sia disponibile sul CDN
 * con retry e backoff.
 */
async function waitForBlobAvailability(
  url: string,
  retries = 5,
  delay = 1000,
) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(`${url}?v=${Date.now()}`, { method: 'HEAD' });
      if (res.ok) {
        console.log(`[API /api/upload] Blob ${url} disponibile (tentativo ${i + 1})`);
        return true;
      }
    } catch (e) {
      console.warn(`[API /api/upload] Check fallito (tentativo ${i + 1}):`, (e as Error).message);
    }
    await new Promise((r) => setTimeout(r, delay * (i + 1)));
  }
  console.error(`[API /api/upload] Blob ${url} non disponibile dopo ${retries} tentativi.`);
  return false; // Continua comunque, ma avvisa
}

export async function POST(req: Request) {
  try {
    // Recupera il tenantId dai parametri (necessario per il nome file)
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenantId' }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 });
    }

    const filename = `tenant_${tenantId}_menu.pdf`;
    const buffer = Buffer.from(await file.arrayBuffer());

    // Esegui upload e parsing in parallelo
    const [blobResult, pdfParseResult] = await Promise.all([
      // 1. Upload su Vercel Blob
      put(filename, buffer, {
        access: 'public',
        contentType: 'application/pdf',
        addRandomSuffix: false,
        allowOverwrite: true,
        cacheControlMaxAge: 60,
      }),
      
      // 2. Parsing del PDF (FIX Problema 1: Import Dinamico)
      (async () => {
        try {
          // Importa dinamicamente 'pdf-parse'
          const pdfParse = (await import('pdf-parse')).default || (await import('pdf-parse'));
          const data = await pdfParse(buffer);
          return data?.text ?? '';
        } catch (parseError) {
          console.error('[API /api/upload] Errore parsing PDF:', parseError);
          return ''; // Non bloccare se il parsing fallisce
        }
      })(),
    ]);

    // Risultati
    const blob: PutBlobResult = blobResult;
    const extractedText: string = pdfParseResult;

    // FIX (Problema 2): Attendi la propagazione del CDN
    await waitForBlobAvailability(blob.url);

    // Aggiungi cache-busting per l'URL finale
    const cacheBustedUrl = `${blob.url}?v=${Date.now()}`;

    // Restituisci i dati al ConfigForm.tsx
    return NextResponse.json({
      url: cacheBustedUrl,
      pathname: blob.pathname,
      extractedText,
    });

  } catch (err: any) {
    console.error('[API /api/upload] Errore generale:', err);
    return NextResponse.json(
      { error: err?.message ?? 'Internal Server Error' },
      { status: 500 }
    );
  }
}
