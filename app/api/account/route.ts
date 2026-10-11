import { NextResponse } from "next/server";
import { ensureSchema, deleteUser } from "@/lib/db";
import { getSessionUserId, clearSessionCookie } from "@/lib/auth";

export const runtime = "nodejs";

export async function DELETE() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  try {
    await ensureSchema();
    await deleteUser(userId);
    await clearSessionCookie();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("account deletion failed:", err);
    return NextResponse.json({ error: "Failed to delete account." }, { status: 502 });
  }
}
