// app/api/upload/route.ts
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { PDFParse } from 'pdf-parse';

export async function POST(req: Request) {
  try {
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

    const [blob, extractedText] = await Promise.all([
      put(filename, buffer, {
        access: 'public',
        contentType: 'application/pdf',
        addRandomSuffix: false,
        allowOverwrite: true,
        cacheControlMaxAge: 60,
      }),
      (async () => {
        const parser = new PDFParse({ data: buffer });
        const { text } = await parser.getText();
        await parser.destroy();
        return text ?? '';
      })(),
    ]);

    return NextResponse.json({
      url: blob.url,
      pathname: blob.pathname,
      extractedText,
    });
  } catch (err: any) {
    console.error('[API /api/upload] Error:', err);
    return NextResponse.json(
      { error: err?.message ?? 'Internal Server Error' },
      { status: 500 }
    );
  }
}
