import { NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/noco';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email') || 'bronovito@gmail.com';

  try {
    const user = await getUserByEmail(email);
    return NextResponse.json({ ok: true, email, user });
  } catch (error: any) {
    const message = error?.message ?? String(error);
    return NextResponse.json({ ok: false, email, error: message }, { status: 500 });
  }
}
