import { NextResponse } from "next/server";
import {
  ensureSchema,
  createMicrosoftUser,
  getUserByMicrosoftId,
  getUserByEmail,
  linkMicrosoftId,
} from "@/lib/db";
import { popOAuthStateCookie, setSessionCookie } from "@/lib/auth";

export const runtime = "nodejs";

type MicrosoftProfile = {
  id: string;
  mail?: string | null;
  userPrincipalName?: string;
  displayName?: string;
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const baseUrl = process.env.PUBLIC_BASE_URL ?? url.origin;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const expectedState = await popOAuthStateCookie();
  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(`${baseUrl}/trade?error=microsoft_auth_failed`);
  }

  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${baseUrl}/trade?error=microsoft_not_configured`);
  }

  try {
    const tokenRes = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${baseUrl}/api/auth/microsoft/callback`,
        grant_type: "authorization_code",
        scope: "openid email profile User.Read",
      }),
      cache: "no-store",
    });
    if (!tokenRes.ok) throw new Error("Microsoft token exchange failed");
    const tokenData: { access_token?: string } = await tokenRes.json();
    if (!tokenData.access_token) throw new Error("No access token from Microsoft");

    const profileRes = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
      cache: "no-store",
    });
    if (!profileRes.ok) throw new Error("Failed to fetch Microsoft profile");
    const profile: MicrosoftProfile = await profileRes.json();

    const microsoftId = profile.id;
    const email = (profile.mail ?? profile.userPrincipalName ?? "").toLowerCase().trim();
    const name = (profile.displayName ?? "").trim().slice(0, 24) || null;
    if (!microsoftId || !email) throw new Error("Incomplete Microsoft profile");

    await ensureSchema();

    let user = await getUserByMicrosoftId(microsoftId);
    if (!user) {
      const existingByEmail = await getUserByEmail(email);
      if (existingByEmail) {
        await linkMicrosoftId(existingByEmail.id, microsoftId);
        user = existingByEmail;
      } else {
        user = await createMicrosoftUser(email, microsoftId, name);
      }
    }

    await setSessionCookie(user.id);
    return NextResponse.redirect(`${baseUrl}/trade`);
  } catch (err) {
    console.error("microsoft auth callback failed:", err);
    return NextResponse.redirect(`${baseUrl}/trade?error=microsoft_auth_failed`);
  }
}
