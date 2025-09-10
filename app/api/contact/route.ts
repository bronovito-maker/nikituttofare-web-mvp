import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { buildUserId, normEmail, normPhoneIntl } from "@/lib/identity";

function makeTicket(): string {
  const r = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `NTF-${r}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let session: any = undefined;
    try {
      if (process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET) {
        session = await auth();
      }
    } catch {}
    const sessionUserId = session?.userId as string | undefined;

    const name = String(body.name || "").trim();
    const email = normEmail(String(body.email || ""));
    const phone = normPhoneIntl(String(body.phone || ""));
    const city = String(body.city || "").trim();
    const address = String(body.address || "").trim();
    const timeslot = String(body.timeslot || "").trim();
    const message = String(body.message || "").trim();
    const category = String(body.category || "").trim();
    const urgency = String(body.urgency || "").trim();
    const price = typeof body.price === "number" ? body.price : undefined;
    const price_low = typeof body.price_low === "number" ? body.price_low : undefined;
    const price_high = typeof body.price_high === "number" ? body.price_high : undefined;
    const est_minutes = typeof body.est_minutes === "number" ? body.est_minutes : undefined;
    const photos = Array.isArray(body.photos) ? body.photos.slice(0,2) : []; // dataURL base64
    const geo = body.geo && typeof body.geo === 'object' ? { lat: body.geo.lat, lng: body.geo.lng } : undefined;

    const userId = sessionUserId || buildUserId({ email, phone, name, city });
    const ticketId = makeTicket();

    const payload = {
      ticketId,
      userId,
      source: body.source || "chat",
      createdAt: new Date().toISOString(),
      name,
      email,
      phone,
      city,
      address,
      timeslot,
      message,
      category: category || undefined,
      urgency: urgency || undefined,
      price,
      price_low,
      price_high,
      est_minutes,
      photos,    // fino a 2 immagini (base64) – gestiscile in n8n
      geo        // {lat,lng} opzionale
    };

    const url = process.env.N8N_WEBHOOK_URL;
    if (!url) {
      return NextResponse.json({ ok: false, error: "Missing N8N_WEBHOOK_URL env" }, { status: 500 });
    }

    // Timeout 12s
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 12000);

    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: ctl.signal
      });
    } finally {
      clearTimeout(t);
    }

    const text = await res.text();
    let data: any;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    if (!res.ok) {
      return NextResponse.json({
        ok: false,
        status: res.status,
        error: data?.message || data?.error || (typeof data === "string" ? data : text?.slice(0, 400) || "Webhook error"),
        debug: { url, payload }
      }, { status: 502 });
    }

    return NextResponse.json({ ok: true, status: res.status, ticketId, data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}