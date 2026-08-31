import { NextResponse, type NextRequest } from "next/server";
import { getSandwichChart, isChartRange } from "@/lib/sandwich-chart";
import { getSandwich } from "@/lib/sandwiches";

/**
 * Chart series for one sandwich and one lookback window.
 *
 * The timeframe pills need a fresh series per tap, and the browser cannot reach
 * the Bread API directly (CORS is restricted to localhost there), so the switch
 * goes through here instead of straight upstream.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const id = searchParams.get("id")?.trim();
  const range = searchParams.get("range");

  if (!id) {
    return NextResponse.json({ error: "Missing 'id'" }, { status: 400 });
  }
  if (!isChartRange(range)) {
    return NextResponse.json({ error: "Unknown 'range'" }, { status: 400 });
  }

  const sandwich = await getSandwich(id);
  if (!sandwich) {
    return NextResponse.json({ error: "Sandwich not found" }, { status: 404 });
  }

  const chart = await getSandwichChart(sandwich, range);
  return NextResponse.json(chart, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
  });
}
