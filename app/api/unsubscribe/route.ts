import { NextResponse } from "next/server";
import { removeSubscriberByToken } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") ?? "";

  let message: string;
  try {
    const removed = token ? await removeSubscriberByToken(token) : false;
    message = removed
      ? "You've been unsubscribed from the NovaX crypto digest."
      : "That unsubscribe link is invalid or already used.";
  } catch {
    message = "Something went wrong processing your request. Please try again later.";
  }

  return new NextResponse(
    `<!doctype html><html><body style="font-family:-apple-system,sans-serif;background:#0b0e13;color:#e7ecf2;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;"><p style="max-width:400px;text-align:center;">${message}</p></body></html>`,
    { headers: { "Content-Type": "text/html" } }
  );
}
