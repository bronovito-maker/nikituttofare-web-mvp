
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();
  console.log('Stripe checkout called with:', body);

  // Simulate a successful payment
  return NextResponse.json({ success: true });
}
