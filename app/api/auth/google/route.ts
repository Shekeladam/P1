import { NextResponse } from "next/server";
import { generateOAuthState, setOAuthStateCookie } from "@/lib/auth";

export const runtime = "nodejs";

// Kicks off the Google OAuth flow: redirects the browser to Google's
// consent screen. GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET come from a Google
// Cloud OAuth Client (see README) — this route just needs the client ID.
export async function GET(req: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const baseUrl = process.env.PUBLIC_BASE_URL ?? new URL(req.url).origin;

  if (!clientId) {
    return NextResponse.redirect(`${baseUrl}/trade?error=google_not_configured`);
  }

  const state = generateOAuthState();
  await setOAuthStateCookie(state);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${baseUrl}/api/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}
