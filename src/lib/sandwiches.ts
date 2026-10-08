import { cache } from "react";
import { BreadApiError, fetchFromBread, isRecord } from "./bread-api";

export type SandwichLeg = {
  id: string;
  /** Position within the sandwich — the order the icon stack renders in. */
  order: number;
  label: string;
  symbol: string;
  /** The real ticker behind a tokenized wrapper — `PLTR`, not `PLTRX`. */
  underlyingSymbol?: string | null;
  /** Solana mint — how a leg is matched to its asset page. */
  mint: string | null;
  imageUrl: string | null;
  side: string;
  weightBps: number;
  priceUsd: number | null;
  currentPriceUsd: number | null;
  pnlPct: number | null;
  reason: string | null;
  /** "tokenized_stock" | "prediction_market" — absent on older payloads. */
  type?: string | null;
  /** "spot" | "perp". A perp leg has to show its side; a spot leg is always a buy. */
  venue?: string | null;
  /** Set on prediction legs — the market whose CLOB history charts the leg. */
  marketId?: string | null;
  question?: string | null;
  /** Where in the source video this leg was named, when it came from one. */
  startMs?: number | null;
  endMs?: number | null;
};

export type SandwichSource = {
  /** The source row every call built from one video shares — the group key. */
  id?: string | null;
  sourceType: string;
  sourceUrl: string | null;
  /** YouTube's own id, when the source is a video. */
  videoId?: string | null;
  /** One paragraph on the episode as a whole, written for the group screen. */
  editorialSummary?: string | null;
  authorHandle: string | null;
  authorName: string | null;
  authorAvatarUrl: string | null;
  publishedAt: string | null;
  quote: string | null;
  /** The cited post's own words — what an X sandwich renders as its body. */
  text?: string | null;
  /** The raw input the sandwich was summoned from; a URL when nothing else. */
  input?: string | null;
  tweetId?: string | null;
  user: {
    name: string | null;
    username: string | null;
  } | null;
};

export type Sandwich = {
  id: string;
  /** Top-level copy of `source.id`. Every call from one video carries it. */
  sourceId?: string | null;
  name: string;
  direction: string;
  summary: string;
  horizon: string;
  confidence: string;
  venue: string;
  createdAt: string;
  /** The builder's own words on top of what they cited, when they added any. */
  commentary?: string | null;
  totalWeightBps: number;
  pnlPct: number | null;
  pnlStatus: string;
  /**
   * "spot" | "underlying_move". A perp sandwich's percentage is the move in the
   * underlying — no leverage, no funding — so it has to be labelled rather than
   * left to read as the realized return.
   */
  pnlBasis?: string | null;
  likeCount: number;
  commentCount: number;
  source: SandwichSource;
  thesis: {
    headline: string | null;
    quote: string | null;
    /** Where in the video the call was made — what orders an episode. */
    startMs: number | null;
    endMs?: number | null;
    summary?: string | null;
  } | null;
  /** How the sandwich was derived — the prose behind "Show More". */
  derivation?: { explanation?: string | null } | null;
  routeEvidence?: {
    expansion?: {
      shortDescription?: string | null;
      thesisSummaryBullets?: string[] | null;
    } | null;
  } | null;
  legs: SandwichLeg[];
  viewerHasLiked: boolean;
  builder: {
    username: string | null;
    name: string | null;
    avatarUrl: string | null;
    /**
     * Only rendered once the server says the sample is big enough — a 1-for-1
     * "100%" badge is the fastest way to make the whole system look unserious.
     */
    record: {
      visible: boolean;
      hitRate: number | null;
      resolvedCount: number;
    } | null;
  } | null;
};

type SandwichListResponse = { sandwiches?: unknown };
type SandwichResponse = { sandwich?: unknown };

function isSandwich(value: unknown): value is Sandwich {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.summary === "string" &&
    Array.isArray(value.legs) &&
    isRecord(value.source)
  );
}

/**
 * How many calls the feed reads before grouping.
 *
 * It has to be counted in CALLS but judged in POSTS: one video can account for
 * eleven rows and still be a single card, so a limit tuned to the flat list
 * starves the grouped feed. Thirty covers roughly a dozen distinct sources.
 *
 * The response carries each source's full transcript — repeated on every call
 * built from it — so it runs past Vercel's 2 MB Data Cache entry limit and the
 * fetch itself is not stored there. That is survivable because the page is
 * statically rendered and revalidated: readers are served the ISR entry, and
 * only revalidation pays for the payload.
 */
const FEED_LIMIT = 30;

const fetchSandwichList = cache(async (limit: number): Promise<Sandwich[]> => {
  const requested = Math.max(1, Math.min(limit, 50));
  const payload = await fetchFromBread<SandwichListResponse>(
    `/api/sandwiches?limit=${requested}`,
  );
  return Array.isArray(payload.sandwiches) ? payload.sandwiches.filter(isSandwich) : [];
});

export const getTopSandwiches = cache(async (limit = FEED_LIMIT): Promise<Sandwich[]> => {
  const rows = await fetchSandwichList(limit);

  return rows
    .filter(
      (sandwich) =>
        sandwich.pnlStatus !== "unavailable" &&
        typeof sandwich.pnlPct === "number" &&
        Number.isFinite(sandwich.pnlPct),
    )
    .sort((left, right) => (right.pnlPct ?? 0) - (left.pnlPct ?? 0));
});

export const SANDWICH_PERIODS = ["hot", "last-month"] as const;
export type SandwichPeriod = (typeof SANDWICH_PERIODS)[number];

export function parseSandwichPeriod(value: string | undefined): SandwichPeriod {
  return SANDWICH_PERIODS.includes(value as SandwichPeriod)
    ? (value as SandwichPeriod)
    : "hot";
}

/**
 * Hot is the profitable leaderboard for the trailing 7 days; last month keeps
 * every priced sandwich from the trailing 30 days.
 */
export function filterSandwichesByPeriod(
  sandwiches: Sandwich[],
  period: SandwichPeriod,
  now = new Date(),
): Sandwich[] {
  const nowMs = now.getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  const start = nowMs - (period === "hot" ? 7 * dayMs : 30 * dayMs);
  const endExclusive = nowMs + 1;

  return sandwiches.filter((sandwich) => {
    const createdAt = new Date(sandwich.createdAt).getTime();
    const isInWindow =
      Number.isFinite(createdAt) && createdAt >= start && createdAt < endExclusive;
    const isProfitable = typeof sandwich.pnlPct === "number" && sandwich.pnlPct > 0;
    return isInWindow && (period !== "hot" || isProfitable);
  });
}

export type Episode = { video: SourceVideo; sandwiches: Sandwich[] };

/**
 * An episode by its YouTube id: the video, and every call built from it.
 *
 * The list endpoint scopes on `sourceId`, not on YouTube's id, so the recent
 * feed is what resolves one to the other. A slug that is already a `sourceId`
 * is passed straight through, which is what keeps an episode that has fallen
 * off the end of the feed reachable.
 */
export const getEpisode = cache(async (slug: string): Promise<Episode | null> => {
  const key = slug.trim();
  if (!key) return null;

  const recent = await fetchSandwichList(FEED_LIMIT);
  const match = recent.find((sandwich) => getSourceVideo(sandwich)?.videoId === key);
  const sourceId = match?.sourceId ?? match?.source.id ?? key;

  const sandwiches = await getSandwichesBySource(sourceId);
  if (sandwiches.length === 0) return null;

  // Any call carries the source, but only some carry an editorial summary.
  const videos = sandwiches
    .map(getSourceVideo)
    .filter((video): video is SourceVideo => video !== null);
  const video = videos.find((candidate) => candidate.summary) ?? videos[0];
  if (!video) return null;

  return { video, sandwiches };
});

/**
 * Every call built from one source, newest video moment last.
 *
 * `sourceId` is the API's own scoping parameter — the same one the app's
 * episode screen uses to rebuild itself when opened cold.
 */
export const getSandwichesBySource = cache(
  async (sourceId: string): Promise<Sandwich[]> => {
    const key = sourceId.trim();
    if (!key) return [];

    const payload = await fetchFromBread<SandwichListResponse>(
      `/api/sandwiches?sourceId=${encodeURIComponent(key)}&limit=50`,
    );
    const rows = Array.isArray(payload.sandwiches)
      ? payload.sandwiches.filter(isSandwich)
      : [];

    return orderByMoment(rows);
  },
);

export const getSandwich = cache(async (id: string): Promise<Sandwich | null> => {
  const normalizedId = id.trim();
  if (!normalizedId) return null;

  try {
    const payload = await fetchFromBread<SandwichResponse>(
      `/api/sandwiches/${encodeURIComponent(normalizedId)}`,
    );
    return isSandwich(payload.sandwich) ? payload.sandwich : null;
  } catch (error) {
    if (error instanceof BreadApiError && error.status === 404) return null;
    throw error;
  }
});

/* ── Episodes ──────────────────────────────────────────────────────────────
 *
 * One video is one post, not one post per call.
 *
 * A video that produced eleven calls is eleven rows in `/api/sandwiches`, each
 * with its own legs, thesis and timestamp, all sharing a `sourceId`. Rendered
 * flat they read as eleven unrelated theses from the same person in the same
 * minute. The app collapses them (`buildFeedItems` in the mobile
 * sandwich-screen) and so does the web, on the same key.
 */

export type SourceVideo = {
  videoId: string;
  url: string;
  title: string;
  channelName: string | null;
  channelHandle: string | null;
  channelAvatarUrl: string | null;
  summary: string | null;
  publishedAt: string | null;
};

const YOUTUBE_ID = /(?:youtu\.be\/|v=|\/embed\/|\/shorts\/)([A-Za-z0-9_-]{6,})/;

function youTubeIdFrom(value: string | null | undefined): string | null {
  if (!value) return null;
  return YOUTUBE_ID.exec(value)?.[1] ?? null;
}

/**
 * The video a call came from, or null if it did not come from one.
 *
 * The title is carried in `quote` as `"<title> — <transcript excerpt>"`, which
 * is why the em-dash split is load-bearing rather than cosmetic.
 */
export function getSourceVideo(sandwich: Sandwich): SourceVideo | null {
  const source = sandwich.source;
  if (source.sourceType.toLowerCase() !== "youtube") return null;

  const videoId =
    source.videoId?.trim() ||
    youTubeIdFrom(source.sourceUrl) ||
    youTubeIdFrom(source.input);
  if (!videoId) return null;

  const quote = source.quote?.trim() ?? "";
  const title = quote ? decodeHtmlEntities((quote.split(" — ")[0] || quote).trim()) : "";

  return {
    videoId,
    url: source.sourceUrl?.trim() || `https://www.youtube.com/watch?v=${videoId}`,
    title: title || "Watch on YouTube",
    channelName: source.authorName ?? source.authorHandle,
    channelHandle: source.authorHandle,
    channelAvatarUrl: source.authorAvatarUrl,
    summary: source.editorialSummary?.trim() || null,
    publishedAt: source.publishedAt,
  };
}

/** Where in the video the call was made — the thesis' moment, else a leg's. */
export function getMomentStartMs(sandwich: Sandwich): number | null {
  const thesisStart = sandwich.thesis?.startMs;
  if (typeof thesisStart === "number" && thesisStart >= 0) return thesisStart;

  for (const leg of sandwich.legs) {
    const legStart = leg.startMs;
    if (typeof legStart === "number" && legStart >= 0) return legStart;
  }

  return null;
}

/** Chronological, so an episode always reads in the order it happened. */
export function orderByMoment(sandwiches: Sandwich[]): Sandwich[] {
  return [...sandwiches].sort((left, right) => {
    const leftMs = getMomentStartMs(left);
    const rightMs = getMomentStartMs(right);
    if (leftMs === null && rightMs === null) {
      return left.createdAt.localeCompare(right.createdAt);
    }
    if (leftMs === null) return 1;
    if (rightMs === null) return -1;
    return leftMs - rightMs;
  });
}

export function formatTimestamp(ms: number | null): string {
  if (ms === null || ms < 0) return "--:--";
  const total = Math.floor(ms / 1000);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** The instrument a call leads with — its logo and ticker head the row. */
export function primaryLeg(sandwich: Sandwich): SandwichLeg | null {
  return sandwich.legs[0] ?? null;
}

export function marketTicker(sandwich: Sandwich): string {
  const leg = primaryLeg(sandwich);
  return leg?.underlyingSymbol || leg?.symbol || leg?.label || sandwich.name;
}

export function isShortCall(sandwich: Sandwich): boolean {
  return sandwich.direction?.toLowerCase() === "down";
}

export type FeedItem =
  | { kind: "sandwich"; key: string; sandwich: Sandwich }
  | { kind: "video"; key: string; video: SourceVideo; sandwiches: Sandwich[] };

/**
 * Collapses each video's calls into one item, in place: a group keeps the feed
 * position of its first (best-performing, since the list arrives sorted)
 * member, so grouping never reorders the feed. Everything else passes through.
 */
export function buildFeedItems(sandwiches: Sandwich[]): FeedItem[] {
  const items: FeedItem[] = [];
  const indexBySource = new Map<string, number>();

  for (const sandwich of sandwiches) {
    const video = getSourceVideo(sandwich);
    const sourceId = sandwich.sourceId ?? sandwich.source.id ?? null;

    if (!video || !sourceId) {
      items.push({ kind: "sandwich", key: sandwich.id, sandwich });
      continue;
    }

    const existing = indexBySource.get(sourceId);
    if (existing !== undefined) {
      const group = items[existing];
      if (group.kind === "video") group.sandwiches.push(sandwich);
      continue;
    }

    indexBySource.set(sourceId, items.length);
    items.push({ kind: "video", key: `video-${sourceId}`, video, sandwiches: [sandwich] });
  }

  return items;
}

export function getSandwichCreator(sandwich: Sandwich): string {
  return (
    sandwich.source.authorName?.trim() ||
    sandwich.source.authorHandle?.trim() ||
    sandwich.builder?.name?.trim() ||
    sandwich.builder?.username?.trim() ||
    "Bread community"
  );
}

export function isXPostSource(source: SandwichSource): boolean {
  if (source.sourceType === "x_summon" || source.sourceType === "x_post") return true;
  return /^https?:\/\/(?:www\.)?(?:x\.com|twitter\.com)\//i.test(source.sourceUrl ?? "");
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

/**
 * The cited post's own words. A bare URL is not a body — fall through to the
 * next candidate rather than rendering the link the sandwich was summoned from.
 */
export function getSourcePostText(sandwich: Sandwich): string {
  const candidates = [sandwich.source.text, sandwich.source.quote, sandwich.source.input];
  const value = candidates.find(
    (candidate) =>
      typeof candidate === "string" &&
      candidate.trim().length > 0 &&
      !/^https?:\/\//i.test(candidate.trim()),
  );
  return value ? decodeHtmlEntities(value.trim()) : "";
}

/**
 * The builder's own take, for sources whose text is not something a person
 * wrote — a video's transcript, an article's body. Rendering `source.text` there
 * would put a raw transcript dump under the builder's name.
 */
export function getBuilderTake(sandwich: Sandwich): string {
  const candidates = [
    sandwich.commentary,
    sandwich.thesis?.summary,
    sandwich.summary,
    sandwich.source.input,
  ];
  const value = candidates.find(
    (candidate) =>
      typeof candidate === "string" &&
      candidate.trim().length > 0 &&
      !/^https?:\/\//i.test(candidate.trim()),
  );
  return value ? decodeHtmlEntities(value.trim()) : "";
}

/**
 * What the screen leads with: an X sandwich is the post, anything else is the
 * builder's take on what they cited. Mirrors the app's split between
 * `XPostPreview` and the creator hero.
 */
export function getSandwichPostText(sandwich: Sandwich): string {
  const primary = isXPostSource(sandwich.source)
    ? getSourcePostText(sandwich)
    : getBuilderTake(sandwich);
  return primary || sandwich.summary;
}

/** The prose behind "Show More" — the most specific account of the thesis we hold. */
export function getThesisDescription(sandwich: Sandwich): string {
  return (
    [
      sandwich.derivation?.explanation,
      sandwich.routeEvidence?.expansion?.shortDescription,
      sandwich.thesis?.summary,
      sandwich.summary,
    ]
      .map((value) => (typeof value === "string" ? value.trim() : ""))
      .find((value) => value.length > 0) ?? ""
  );
}

export function getThesisBullets(sandwich: Sandwich): string[] {
  return (
    sandwich.routeEvidence?.expansion?.thesisSummaryBullets
      ?.map((bullet) => bullet.trim())
      .filter((bullet) => bullet.length > 0) ?? []
  );
}

export function getSandwichSourceLabel(sandwich: Sandwich): string {
  const type = sandwich.source.sourceType.toLowerCase();
  if (type === "youtube") return "Video thesis";
  if (type === "x" || type === "twitter") return "Social thesis";
  if (type === "podcast") return "Podcast thesis";
  return "Community thesis";
}

// Public beta invite. Where a shared link sends someone who doesn't have Bread.
export const TESTFLIGHT_URL = "https://testflight.apple.com/join/8UAWE67D";

export function getOpenInAppUrl(id: string): string {
  return `bread://sandwich?sandwichId=${encodeURIComponent(id)}`;
}

export function formatPercent(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function formatPrice(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value < 1 ? 4 : 2,
  }).format(value);
}

export function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
