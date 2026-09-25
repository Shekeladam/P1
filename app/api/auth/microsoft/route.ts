import { NextResponse } from "next/server";
import { generateOAuthState, setOAuthStateCookie } from "@/lib/auth";

export const runtime = "nodejs";

// Kicks off the Microsoft OAuth flow: redirects the browser to Microsoft's
// consent screen. MICROSOFT_CLIENT_ID/MICROSOFT_CLIENT_SECRET come from an
// Azure/Microsoft Entra app registration (see README) — this route only
// needs the client ID. The "common" tenant allows both personal Microsoft
// accounts and work/school accounts to sign in.
export async function GET(req: Request) {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const baseUrl = process.env.PUBLIC_BASE_URL ?? new URL(req.url).origin;

  if (!clientId) {
    return NextResponse.redirect(`${baseUrl}/trade?error=microsoft_not_configured`);
  }

  const state = generateOAuthState();
  await setOAuthStateCookie(state);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${baseUrl}/api/auth/microsoft/callback`,
    response_type: "code",
    response_mode: "query",
    scope: "openid email profile User.Read",
    state,
    prompt: "select_account",
  });

  return NextResponse.redirect(`https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`);
}
