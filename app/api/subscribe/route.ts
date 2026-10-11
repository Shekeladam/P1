import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { addSubscriber, ensureSchema } from "@/lib/db";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  try {
    await ensureSchema();
    const token = randomUUID();
    const outcome = await addSubscriber(email, token);
    return NextResponse.json({ status: outcome });
  } catch (err) {
    console.error("subscribe failed:", err);
    return NextResponse.json({ error: "Subscription failed. Please try again later." }, { status: 502 });
  }
}
