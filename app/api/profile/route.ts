import { NextResponse } from "next/server";
import { ensureSchema, updateDisplayName } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

export const runtime = "nodejs";

export async function PATCH(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const displayName = typeof body?.displayName === "string" ? body.displayName.trim() : "";
  if (displayName.length < 2 || displayName.length > 24) {
    return NextResponse.json({ error: "Display name must be 2-24 characters." }, { status: 400 });
  }

  try {
    await ensureSchema();
    await updateDisplayName(userId, displayName);
    return NextResponse.json({ displayName });
  } catch (err) {
    console.error("profile update failed:", err);
    return NextResponse.json({ error: "Failed to update profile." }, { status: 502 });
  }
}
