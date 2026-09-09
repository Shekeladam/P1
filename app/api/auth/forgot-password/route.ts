import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { ensureSchema, getUserByEmail, createPasswordReset } from "@/lib/db";
import { sendEmail } from "@/lib/mailer";

export const runtime = "nodejs";

const RESET_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";

  // Always return the same generic response whether or not the email
  // exists, so this endpoint can't be used to discover registered accounts.
  const genericResponse = NextResponse.json({
    message: "If an account with that email exists, a reset link has been sent.",
  });

  if (!email) return genericResponse;

  try {
    await ensureSchema();
    const user = await getUserByEmail(email);
    if (!user) return genericResponse;

    const token = randomUUID();
    await createPasswordReset(user.id, token, new Date(Date.now() + RESET_EXPIRY_MS));

    const baseUrl = process.env.PUBLIC_BASE_URL ?? new URL(req.url).origin;
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    const html = `
      <div style="font-family:-apple-system,sans-serif;max-width:480px;">
        <p>Someone (hopefully you) requested a password reset for your NovaX paper-trading account.</p>
        <p><a href="${resetUrl}" style="background:#f0b429;color:#14110a;padding:10px 16px;border-radius:6px;text-decoration:none;font-weight:600;">Reset your password</a></p>
        <p style="color:#8b95a5;font-size:12px;">This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
      </div>`;
    await sendEmail(user.email, "Reset your NovaX password", html);

    return genericResponse;
  } catch (err) {
    console.error("forgot-password failed:", err);
    // Still return the generic message — don't leak whether something broke
    // server-side vs. the email simply not existing.
    return genericResponse;
  }
}
