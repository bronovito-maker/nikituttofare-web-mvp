import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/noco';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ ok: false, error: 'Email mancante' }, { status: 400 });
  }

  try {
    const user = await getUserByEmail(email);
    return NextResponse.json({ ok: true, user });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message ?? 'Errore sconosciuto' },
      { status: 500 }
    );
  }
}
