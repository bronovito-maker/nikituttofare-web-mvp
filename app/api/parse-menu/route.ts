// app/api/parse-menu/route.ts
import { NextResponse } from 'next/server';

// 'pdf-parse' è un modulo CommonJS; use require per compatibilità
const pdf = require('pdf-parse');

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { pdfUrl } = await req.json();

    if (!pdfUrl) {
      return NextResponse.json({ error: 'pdfUrl is required' }, { status: 400 });
    }

    const response = await fetch(pdfUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const data = await pdf(buffer);
    const extractedText = data?.text ?? '';

    return NextResponse.json({ extractedText });
  } catch (error) {
    console.error('[API /api/parse-menu] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
