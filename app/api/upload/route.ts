// app/api/upload/route.ts
import { NextResponse } from 'next/server';
import { uploadPublicBlob } from '@/lib/blob';

export async function POST(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  if (!filename || !request.body) {
    return NextResponse.json({ error: 'Nessun nome file fornito' }, { status: 400 });
  }

  try {
    const blob = await uploadPublicBlob(filename, request.body);
    return NextResponse.json(blob);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'Upload fallito' }, { status: 500 });
  }
}
