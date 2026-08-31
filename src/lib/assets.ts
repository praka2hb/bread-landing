import { cache } from "react";
import {
  BreadApiError,
  fetchFromBread,
  isRecord,
  toNumber,
  toText,
} from "./bread-api";

/** One tradable instrument as it appears in a list. */
export type AssetSummary = {
  /** Slug used by the detail route — `spacex`, not `SPCX`. */
  assetId: string;
  mint: string | null;
  symbol: string;
  name: string;
  category: string | null;
  type: string | null;
  icon: string | null;
  priceUsd: number | null;
  priceChange1h: number | null;
  priceChange24h: number | null;
  volume24h: number | null;
  marketCap: number | null;
  holderCount: number | null;
};

export type AssetRiskComponent = {
  key: string;
  score: number | null;
  status: string | null;
  hasData: boolean;
};

export type AssetDetail = {
  assetId: string;
  symbol: string;
  name: string;
  category: string | null;
  imageUrl: string | null;
  primaryMint: string | null;
  description: string | null;
  stats: {
    price: number | null;
    liquidity: number | null;
    volume24hUSD: number | null;
    volume30dUSD: number | null;
    marketCap: number | null;
    fdv: number | null;
    priceChange1hPercent: number | null;
    priceChange24hPercent: number | null;
    priceChange7dPercent: number | null;
    priceChange30dPercent: number | null;
    priceChange3mPercent: number | null;
    totalSupply: number | null;
    circulatingSupply: number | null;
  };
  risk: {
    score: number | null;
    grade: string | null;
    label: string | null;
    tone: string | null;
    components: AssetRiskComponent[];
  } | null;
};

function toAssetSummary(value: unknown): AssetSummary | null {
  if (!isRecord(value)) return null;

  const assetId = toText(value.assetId);
  const symbol = toText(value.symbol);
  if (!assetId || !symbol) return null;

  return {
    assetId,
    mint: toText(value.id),
    symbol,
    name: toText(value.name) ?? symbol,
    category: toText(value.category),
    type: toText(value.type),
    icon: toText(value.icon),
    priceUsd: toNumber(value.usdPrice) ?? toNumber(value.equityPriceUsd),
    priceChange1h: toNumber(value.priceChange1h),
    priceChange24h: toNumber(value.priceChange24h),
    volume24h: toNumber(value.volume24h),
    marketCap: toNumber(value.mcap),
    holderCount: toNumber(value.holderCount),
  };
}

function toRiskComponents(value: unknown): AssetRiskComponent[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry) => {
    if (!isRecord(entry)) return [];
    const key = toText(entry.key);
    if (!key) return [];
    return [
      {
        key,
        score: toNumber(entry.score),
        status: toText(entry.status),
        hasData: entry.hasData === true,
      },
    ];
  });
}

function toAssetDetail(value: unknown): AssetDetail | null {
  if (!isRecord(value)) return null;

  const assetId = toText(value.assetId);
  const symbol = toText(value.symbol);
  if (!assetId || !symbol) return null;

  const stats = isRecord(value.stats) ? value.stats : {};
  const risk = isRecord(value.risk) ? value.risk : null;

  return {
    assetId,
    symbol,
    name: toText(value.name) ?? symbol,
    category: toText(value.category),
    imageUrl: toText(value.imageUrl),
    primaryMint: toText(value.primaryMint),
    description: toText(value.description),
    stats: {
      price: toNumber(stats.price),
      liquidity: toNumber(stats.liquidity),
      volume24hUSD: toNumber(stats.volume24hUSD),
      volume30dUSD: toNumber(stats.volume30dUSD),
      marketCap: toNumber(stats.marketCap),
      fdv: toNumber(stats.fdv),
      priceChange1hPercent: toNumber(stats.priceChange1hPercent),
      priceChange24hPercent: toNumber(stats.priceChange24hPercent),
      priceChange7dPercent: null,
      priceChange30dPercent: null,
      priceChange3mPercent: null,
      totalSupply: toNumber(stats.totalSupply),
      circulatingSupply: toNumber(stats.circulatingSupply),
    },
    risk: risk
      ? {
          score: toNumber(risk.score),
          grade: toText(risk.grade),
          label: toText(risk.label),
          tone: toText(risk.tone),
          components: toRiskComponents(risk.components),
        }
      : null,
  };
}

/**
 * Every tokenized instrument Bread knows about, heaviest 24h volume first.
 *
 * Reads `/api/tokens/stocks` rather than `/api/stocks`: the latter is backed by
 * a Stock table that is empty in production, so it answers `[]` for everything.
 */
export const getAssets = cache(async (): Promise<AssetSummary[]> => {
  const payload = await fetchFromBread<unknown>("/api/tokens/stocks", { revalidate: 120 });
  const rows = Array.isArray(payload) ? payload : [];

  return rows
    .map(toAssetSummary)
    .filter((asset): asset is AssetSummary => asset !== null)
    .sort((left, right) => (right.volume24h ?? 0) - (left.volume24h ?? 0));
});

export const getAsset = cache(async (assetId: string): Promise<AssetDetail | null> => {
  const slug = assetId.trim().toLowerCase();
  if (!slug) return null;

  try {
    const payload = await fetchFromBread<unknown>(
      `/api/tokens/asset-detail/${encodeURIComponent(slug)}`,
      { revalidate: 120 },
    );
    return toAssetDetail(payload);
  } catch (error) {
    if (error instanceof BreadApiError && error.status === 404) return null;
    throw error;
  }
});

export type AssetPerformance = {
  oneWeek: number | null;
  oneMonth: number | null;
  threeMonth: number | null;
};

/** Longer price windows used by the compact asset modal. */
export const getAssetPerformance = cache(async (mint: string): Promise<AssetPerformance> => {
  const normalizedMint = mint.trim();
  if (!normalizedMint) return { oneWeek: null, oneMonth: null, threeMonth: null };

  const payload = await fetchFromBread<unknown>(
    `/api/tokens/performance?mint=${encodeURIComponent(normalizedMint)}`,
    { revalidate: 600 },
  );
  if (!isRecord(payload)) return { oneWeek: null, oneMonth: null, threeMonth: null };

  return {
    oneWeek: toNumber(payload.oneWeek),
    oneMonth: toNumber(payload.oneMonth),
    threeMonth: toNumber(payload.threeMonth),
  };
});

/**
 * Asset slugs keyed by both mint and symbol, so a sandwich leg can link to its
 * asset page. Legs carry a mint and a ticker; neither is the slug the detail
 * route wants, and there is no endpoint that resolves one to the other.
 */
export const getAssetSlugIndex = cache(
  async (): Promise<Map<string, string>> => {
    const index = new Map<string, string>();

    let assets: AssetSummary[] = [];
    try {
      assets = await getAssets();
    } catch {
      // A leg simply renders unlinked if the asset list is unavailable.
      return index;
    }

    for (const asset of assets) {
      if (asset.mint) index.set(asset.mint, asset.assetId);
      const symbol = asset.symbol.toUpperCase();
      if (!index.has(symbol)) index.set(symbol, asset.assetId);
    }

    return index;
  },
);

const compactNumber = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 2,
});

/** `$1.88T`, `$9.55M` — the dense form used in stat grids and table cells. */
export function formatCompactUsd(value: number | null): string {
  if (value === null) return "—";
  return `$${compactNumber.format(value)}`;
}
export function formatCompactNumber(value: number | null): string {
  if (value === null) return "—";
  return compactNumber.format(value);
}