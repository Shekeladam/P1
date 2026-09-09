import { NextResponse } from "next/server";
import { ensureSchema, getUserByEmail } from "@/lib/db";
import { verifyPassword, setSessionCookie } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
  }

  try {
    await ensureSchema();
    const user = await getUserByEmail(email);
    if (!user || !verifyPassword(password, user.password_hash, user.password_salt)) {
      return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
    }

    await setSessionCookie(user.id);
    return NextResponse.json({ email: user.email, cashBalance: user.cash_balance });
  } catch (err) {
    console.error("signin failed:", err);
    return NextResponse.json({ error: "Sign in failed. Please try again later." }, { status: 502 });
  }
}
