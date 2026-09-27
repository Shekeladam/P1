import { NextResponse } from "next/server";
import { ensureSchema, getUserById, updateUserPassword } from "@/lib/db";
import { getSessionUserId, hashPassword, verifyPassword } from "@/lib/auth";

export const runtime = "nodejs";

// Sets a new password. Users who already have a password must supply
// currentPassword to change it; OAuth-only users with no password yet can
// set one for the first time without it.
export async function PATCH(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

  if (newPassword.length < 6) {
    return NextResponse.json({ error: "New password must be at least 6 characters." }, { status: 400 });
  }

  try {
    await ensureSchema();
    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: "Account not found." }, { status: 404 });
    }

    if (user.password_hash && user.password_salt) {
      if (!currentPassword || !verifyPassword(currentPassword, user.password_hash, user.password_salt)) {
        return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });
      }
    }

    const { hash, salt } = hashPassword(newPassword);
    await updateUserPassword(userId, hash, salt);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("account password update failed:", err);
    return NextResponse.json({ error: "Failed to update password." }, { status: 502 });
  }
}
