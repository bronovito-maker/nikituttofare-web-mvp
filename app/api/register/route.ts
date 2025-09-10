import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail, createUser } from "@/lib/noco";
import { hashPassword } from "@/lib/crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email || "").toLowerCase().trim();
    const password = String(body.password || "");
    const name = String(body.name || "").trim();

    if (!email || !password) {
      return NextResponse.json({ ok: false, error: "Email e password sono obbligatori" }, { status: 400 });
    }

    const base = process.env.NOCO_BASE_URL || process.env.NOCODB_BASE_URL || "";
    const token = process.env.NOCO_API_TOKEN || process.env.NOCODB_TOKEN || "";
    const usersTable = process.env.NOCO_USERS_TABLE_ID || process.env.NOCODB_TABLE_ID_USERS || "";
    if (!base || !token || !usersTable) {
      return NextResponse.json({ ok: false, error: "Missing NocoDB env" }, { status: 500 });
    }

    const exists = await getUserByEmail(base, token, usersTable, email);
    if (exists) return NextResponse.json({ ok: false, error: "Email già registrata" }, { status: 409 });

    const password_hash = await hashPassword(password);
    const rec = await createUser(base, token, usersTable, {
      email, name: name || email.split("@")[0], password_hash, createdAt: new Date().toISOString()
    });

    // opzionale: webhook n8n di benvenuto
    const welcome = process.env.N8N_WELCOME_URL;
    if (welcome) {
      fetch(welcome, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: rec?.name, userId: rec?.id }),
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true, userId: rec?.id });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}