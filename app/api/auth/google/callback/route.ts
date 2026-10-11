import { NextResponse } from "next/server";
import {
  ensureSchema,
  createGoogleUser,
  getUserByGoogleId,
  getUserByEmail,
  linkGoogleId,
} from "@/lib/db";
import { popOAuthStateCookie, setSessionCookie } from "@/lib/auth";

export const runtime = "nodejs";

type GoogleProfile = {
  sub: string;
  email?: string;
  name?: string;
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const baseUrl = process.env.PUBLIC_BASE_URL ?? url.origin;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const expectedState = await popOAuthStateCookie();
  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(`${baseUrl}/trade?error=google_auth_failed`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${baseUrl}/trade?error=google_not_configured`);
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${baseUrl}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
      cache: "no-store",
    });
    if (!tokenRes.ok) throw new Error("Google token exchange failed");
    const tokenData: { access_token?: string } = await tokenRes.json();
    if (!tokenData.access_token) throw new Error("No access token from Google");

    const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
      cache: "no-store",
    });
    if (!profileRes.ok) throw new Error("Failed to fetch Google profile");
    const profile: GoogleProfile = await profileRes.json();

    const googleId = profile.sub;
    const email = (profile.email ?? "").toLowerCase().trim();
    const name = (profile.name ?? "").trim().slice(0, 24) || null;
    if (!googleId || !email) throw new Error("Incomplete Google profile");

    await ensureSchema();

    let user = await getUserByGoogleId(googleId);
    if (!user) {
      const existingByEmail = await getUserByEmail(email);
      if (existingByEmail) {
        await linkGoogleId(existingByEmail.id, googleId);
        user = existingByEmail;
      } else {
        user = await createGoogleUser(email, googleId, name);
      }
    }

    await setSessionCookie(user.id);
    return NextResponse.redirect(`${baseUrl}/trade`);
  } catch (err) {
    console.error("google auth callback failed:", err);
    return NextResponse.redirect(`${baseUrl}/trade?error=google_auth_failed`);
  }
}
