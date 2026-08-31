/**
 * Server-side chart series for a sandwich — the web equivalent of the app's
 * `SandwichBasketChart` data layer.
 *
 * The browser cannot fetch these upstreams itself (the Bread API only allows
 * CORS from localhost), so the whole series is built here: one OHLCV request per
 * chartable leg, blended into a single index series, then reconciled against the
 * server's headline PnL. Route handlers and Server Components both call in here.
 */

import { fetchFromBread, isRecord, toNumber } from "./bread-api";
import {
  anchorLatestReturn,
  buildBasketPoints,
  synthesizeFallbackPoints,
  type BasketPoint,
  type ChartLeg,
  type ChartTimeframe,
  type LoadedLeg,
  type OhlcvCandle,
} from "./basket-points";
import type { Sandwich } from "./sandwiches";

/** Selectable lookback windows for the timeframe pills, same set as the app. */
export type ChartRange = "24H" | "1W" | "1M" | "3M" | "ALL";

export const CHART_RANGES: ChartRange[] = ["24H", "1W", "1M", "3M", "ALL"];

export type SandwichChart = {
  range: ChartRange;
  points: BasketPoint[];
  /** False when the series measures a shorter window than the headline PnL. */
  isFullHistory: boolean;
};

const RANGE_SECONDS: Record<Exclude<ChartRange, "ALL">, number> = {
  "24H": 24 * 60 * 60,
  "1W": 7 * 24 * 60 * 60,
  "1M": 30 * 24 * 60 * 60,
  "3M": 90 * 24 * 60 * 60,
};

const MAX_PREDICTION_CANDLES = 48;

const nowSeconds = () => Math.floor(Date.now() / 1000);

export function isChartRange(value: string | null): value is ChartRange {
  return value !== null && (CHART_RANGES as string[]).includes(value);
}

/**
 * The shortest pill that still covers the whole life of the thesis, so the curve
 * on open spans exactly the period the headline PnL is measured over.
 */
export function defaultChartRange(createdAt: string | null): ChartRange {
  if (!createdAt) return "1W";
  const ageSeconds = (Date.now() - new Date(createdAt).getTime()) / 1000;
  if (!Number.isFinite(ageSeconds)) return "1W";
  if (ageSeconds <= 24 * 60 * 60) return "24H";
  if (ageSeconds <= 7 * 24 * 60 * 60) return "1W";
  if (ageSeconds <= 30 * 24 * 60 * 60) return "1M";
  if (ageSeconds <= 90 * 24 * 60 * 60) return "3M";
  return "ALL";
}

function rangeSeconds(range: ChartRange): number | null {
  return range === "ALL" ? null : RANGE_SECONDS[range];
}

function timeframeForWindow(fromSeconds: number): ChartTimeframe {
  const ageSeconds = Math.max(0, nowSeconds() - fromSeconds);
  if (ageSeconds <= 60 * 60) return "1m";
  if (ageSeconds <= 6 * 60 * 60) return "5m";
  if (ageSeconds <= 7 * 24 * 60 * 60) return "1H";
  if (ageSeconds <= 30 * 24 * 60 * 60) return "4H";
  return "1D";
}

function predictionTimeframeForWindow(fromSeconds: number): ChartTimeframe {
  const ageSeconds = Math.max(0, nowSeconds() - fromSeconds);
  if (ageSeconds <= 60 * 60) return "1m";
  if (ageSeconds <= 6 * 60 * 60) return "5m";
  if (ageSeconds <= 24 * 60 * 60) return "1H";
  if (ageSeconds <= 45 * 24 * 60 * 60) return "4H";
  return "1D";
}

function toCandle(value: unknown, timeKey: "unixTime" | "timestamp"): OhlcvCandle | null {
  if (!isRecord(value)) return null;
  const rawTime = toNumber(value[timeKey]);
  const open = toNumber(value[timeKey === "unixTime" ? "o" : "open"]);
  const high = toNumber(value[timeKey === "unixTime" ? "h" : "high"]);
  const low = toNumber(value[timeKey === "unixTime" ? "l" : "low"]);
  const close = toNumber(value[timeKey === "unixTime" ? "c" : "close"]);
  if (rawTime === null || open === null || high === null || low === null || close === null) {
    return null;
  }
  // The OHLCV route reports seconds; Polymarket candles already report ms.
  const timestamp = timeKey === "unixTime" ? rawTime * 1000 : rawTime;
  return { timestamp, open, high, low, close };
}

async function fetchOhlcv(
  mint: string,
  timeframe: ChartTimeframe,
  fromSeconds: number,
): Promise<OhlcvCandle[]> {
  const params = new URLSearchParams({
    address: mint,
    type: timeframe,
    time_from: String(fromSeconds),
  });
  const payload = await fetchFromBread<unknown>(`/api/tokens/ohlcv?${params}`, {
    revalidate: 120,
  });
  if (!isRecord(payload) || !isRecord(payload.data) || !Array.isArray(payload.data.items)) {
    return [];
  }
  return payload.data.items
    .map((item) => toCandle(item, "unixTime"))
    .filter((candle): candle is OhlcvCandle => candle !== null)
    .sort((a, b) => a.timestamp - b.timestamp);
}

async function fetchPredictionCandles(
  marketId: string,
  side: string,
  timeframe: ChartTimeframe,
  fromSeconds: number,
): Promise<OhlcvCandle[]> {
  const params = new URLSearchParams({
    marketId,
    side: side.trim().toLowerCase() || "yes",
    type: timeframe,
    time_from: String(fromSeconds),
  });
  const payload = await fetchFromBread<unknown>(`/api/polymarket/candles?${params}`, {
    revalidate: 120,
  });
  if (!isRecord(payload) || !Array.isArray(payload.candles)) return [];
  return payload.candles
    .map((item) => toCandle(item, "timestamp"))
    .filter((candle): candle is OhlcvCandle => candle !== null)
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-MAX_PREDICTION_CANDLES);
}

function toChartLeg(leg: Sandwich["legs"][number]): ChartLeg {
  return {
    id: leg.id,
    type: leg.type ?? "tokenized_stock",
    mint: leg.mint,
    marketId: leg.marketId ?? null,
    side: leg.side,
    weightBps: leg.weightBps,
    pnlPct: leg.pnlPct,
  };
}

/**
 * Build the basket curve for one lookback window.
 *
 * A windowed view measures a different period than the headline PnL, so only the
 * full-history series is re-anchored onto `sandwich.pnlPct` — anchoring a zoomed
 * window would put the wrong number on the wrong curve.
 */
export async function getSandwichChart(
  sandwich: Sandwich,
  range: ChartRange,
): Promise<SandwichChart> {
  const createdAtMs = new Date(sandwich.createdAt).getTime();
  if (!Number.isFinite(createdAtMs)) return { range, points: [], isFullHistory: true };

  const createdAtSeconds = Math.floor(createdAtMs / 1000);
  const windowSeconds = rangeSeconds(range);
  const fromSeconds = windowSeconds
    ? Math.max(createdAtSeconds, nowSeconds() - windowSeconds)
    : createdAtSeconds;
  const isFullHistory = fromSeconds <= createdAtSeconds;

  const legs = sandwich.legs.map(toChartLeg).filter((leg) => leg.weightBps > 0);
  const priceLegs = legs.filter((leg) => leg.type !== "prediction_market" && !!leg.mint);
  const predictionLegs = legs.filter((leg) => leg.type === "prediction_market" && !!leg.marketId);

  const targetReturnPct =
    sandwich.pnlStatus !== "unavailable" &&
    sandwich.pnlPct !== null &&
    Math.abs(sandwich.pnlPct) > 0.05
      ? sandwich.pnlPct
      : null;

  const timeframe = timeframeForWindow(fromSeconds);
  const predictionTimeframe = predictionTimeframeForWindow(fromSeconds);

  const settled = await Promise.allSettled([
    ...priceLegs.map(async (leg): Promise<LoadedLeg> => ({
      leg,
      items: await fetchOhlcv(leg.mint as string, timeframe, fromSeconds),
    })),
    ...predictionLegs.map(async (leg): Promise<LoadedLeg> => ({
      leg,
      items: await fetchPredictionCandles(
        leg.marketId as string,
        leg.side ?? "yes",
        predictionTimeframe,
        fromSeconds,
      ),
    })),
  ]);

  // A leg whose upstream failed still belongs in the blend — `buildBasketPoints`
  // ramps its known return rather than drawing it flat.
  const loaded = settled
    .filter((result): result is PromiseFulfilledResult<LoadedLeg> => result.status === "fulfilled")
    .map((result) => result.value);
  const loadedIds = new Set(loaded.map((entry) => entry.leg.id));
  for (const leg of [...priceLegs, ...predictionLegs]) {
    if (!loadedIds.has(leg.id)) loaded.push({ leg, items: [] });
  }

  const basketPoints = buildBasketPoints(loaded, timeframe);
  const points =
    basketPoints.length > 0
      ? isFullHistory
        ? anchorLatestReturn(basketPoints, targetReturnPct)
        : basketPoints
      : // Nothing chartable came back (an unpriced instrument, a throttled
        // upstream). Draw the known return as a ramp rather than an empty box.
        synthesizeFallbackPoints(fromSeconds, sandwich.pnlPct, timeframe);

  return { range, points, isFullHistory };
}
