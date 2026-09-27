import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Free, keyless European Central Bank reference rates via Frankfurter.
// Updated once per banking day — plenty fresh for a currency converter.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const base = (searchParams.get("base") ?? "USD").toUpperCase();

  try {
    const res = await fetch(`https://api.frankfurter.app/latest?from=${base}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Frankfurter API error ${res.status}`);
    const data: { amount: number; base: string; date: string; rates: Record<string, number> } = await res.json();
    return NextResponse.json({ base: data.base, date: data.date, rates: data.rates });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch exchange rates." },
      { status: 502 }
    );
  }
}
