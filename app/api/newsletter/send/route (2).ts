import { NextResponse } from "next/server";
import {
  ensureSchema,
  getActiveSubscribers,
  getLastSentAt,
  setLastSentAt,
} from "@/lib/db";
import { buildDigest, renderDigestEmailHtml } from "@/lib/newsletter";
import { sendDigestEmail } from "@/lib/mailer";

export const runtime = "nodejs";
export const maxDuration = 60;

const SEND_INTERVAL_MS = 3 * 24 * 60 * 60 * 1000;

// Meant to be hit by a daily cron job (see vercel.json — Vercel Cron sends
// GET and auto-attaches "Authorization: Bearer $CRON_SECRET" when that env
// var is set). It only actually sends once 3+ days have passed since the
// last send, so the exact cron cadence doesn't need to be precise. POST is
// kept too, for manual triggering (e.g. curl) during setup/testing.
//
// For manual testing straight from a browser (no terminal needed), the
// secret can also be passed as ?secret=... in the URL instead of the
// Authorization header — visit /api/newsletter/send?secret=YOUR_CRON_SECRET.
async function handleSend(req: Request) {
  const auth = req.headers.get("authorization");
  const secretParam = new URL(req.url).searchParams.get("secret");
  const authorized =
    process.env.CRON_SECRET != null &&
    (auth === `Bearer ${process.env.CRON_SECRET}` || secretParam === process.env.CRON_SECRET);
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureSchema();

    const lastSentAt = await getLastSentAt();
    const now = new Date();
    if (lastSentAt && now.getTime() - lastSentAt.getTime() < SEND_INTERVAL_MS) {
      return NextResponse.json({ skipped: true, reason: "Sent within the last 3 days" });
    }

    const subscribers = await getActiveSubscribers();
    if (subscribers.length === 0) {
      await setLastSentAt(now);
      return NextResponse.json({ sent: 0, reason: "No active subscribers" });
    }

    const digest = await buildDigest();
    const baseUrl = process.env.PUBLIC_BASE_URL ?? new URL(req.url).origin;
    const subject = `NovaX Crypto Digest — BTC dominance ${digest.dominance[0]?.pct.toFixed(1)}%`;

    let sent = 0;
    const failures: string[] = [];
    for (const sub of subscribers) {
      const unsubscribeUrl = `${baseUrl}/api/unsubscribe?token=${sub.unsubscribe_token}`;
      const html = renderDigestEmailHtml(digest, unsubscribeUrl);
      try {
        await sendDigestEmail(sub.email, subject, html);
        sent++;
      } catch (err) {
        failures.push(sub.email + ": " + (err instanceof Error ? err.message : String(err)));
      }
    }

    // Only mark this cycle as "done" if at least one email actually went
    // out. If every send failed (e.g. Gmail credentials broken), leave
    // last_sent_at untouched so tomorrow's cron tick retries the whole
    // batch instead of silently waiting 3 more days.
    if (sent > 0) {
      await setLastSentAt(now);
    }
    return NextResponse.json({ sent, failed: failures.length, failures });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Newsletter send failed." },
      { status: 502 }
    );
  }
}

export async function GET(req: Request) {
  return handleSend(req);
}

export async function POST(req: Request) {
  return handleSend(req);
}
