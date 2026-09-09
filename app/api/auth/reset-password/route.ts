import { NextResponse } from "next/server";
import { ensureSchema, getValidPasswordReset, updateUserPassword, markPasswordResetUsed, getUserById } from "@/lib/db";
import { hashPassword, setSessionCookie } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!token) {
    return NextResponse.json({ error: "Missing reset token." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }

  try {
    await ensureSchema();
    const reset = await getValidPasswordReset(token);
    if (!reset) {
      return NextResponse.json({ error: "That reset link is invalid or has expired." }, { status: 400 });
    }

    const user = await getUserById(reset.userId);
    if (!user) {
      return NextResponse.json({ error: "Account not found." }, { status: 404 });
    }

    const { hash, salt } = hashPassword(password);
    await updateUserPassword(user.id, hash, salt);
    await markPasswordResetUsed(token);
    await setSessionCookie(user.id);

    return NextResponse.json({ email: user.email });
  } catch (err) {
    console.error("reset-password failed:", err);
    return NextResponse.json({ error: "Password reset failed. Please try again later." }, { status: 502 });
  }
}
