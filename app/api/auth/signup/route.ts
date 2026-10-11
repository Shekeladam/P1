import { NextResponse } from "next/server";
import { ensureSchema, createUser, getUserByEmail, STARTING_CASH_BALANCE } from "@/lib/db";
import { hashPassword, setSessionCookie } from "@/lib/auth";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const displayName = typeof body?.displayName === "string" ? body.displayName.trim() : "";

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }
  if (displayName.length < 2 || displayName.length > 24) {
    return NextResponse.json({ error: "Display name must be 2-24 characters." }, { status: 400 });
  }

  try {
    await ensureSchema();
    const existing = await getUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
    }

    const { hash, salt } = hashPassword(password);
    const user = await createUser(email, hash, salt, displayName);
    await setSessionCookie(user.id);

    return NextResponse.json({ email: user.email, cashBalance: STARTING_CASH_BALANCE });
  } catch (err) {
    console.error("signup failed:", err);
    return NextResponse.json({ error: "Sign up failed. Please try again later." }, { status: 502 });
  }
}
