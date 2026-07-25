// Read-only fetch of a shared sandwich from the backend's public JSON endpoint.
// Server-side only (no CORS concern); cached briefly so a viral link doesn't
// hammer the API.
const API_BASE = (
  process.env.SANDWICH_API_BASE ?? "https://bread-be.vercel.app"
).replace(/\/$/, "");

export type SandwichLeg = {
  id: string;
  label: string;
  symbol: string | null;
  underlyingSymbol: string | null;
  imageUrl: string | null;
  side: string;
  weightBps: number;
  pnlPct: number | null;
};

export type SandwichSource = {
  sourceType: string | null;
  sourceUrl: string | null;
  videoId: string | null;
  title: string | null;
  authorName: string | null;
  authorHandle: string | null;
  authorAvatarUrl: string | null;
};

export type Sandwich = {
  id: string;
  name: string;
  summary: string;
  direction: string | null;
  horizon: string | null;
  confidence: string | null;
  pnlPct: number | null;
  legs: SandwichLeg[];
  source: SandwichSource | null;
};

function asLeg(value: unknown): SandwichLeg | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if (typeof v.id !== "string" || typeof v.label !== "string") return null;
  return {
    id: v.id,
    label: v.label,
    symbol: typeof v.symbol === "string" ? v.symbol : null,
    underlyingSymbol:
      typeof v.underlyingSymbol === "string" ? v.underlyingSymbol : null,
    imageUrl: typeof v.imageUrl === "string" ? v.imageUrl : null,
    side: typeof v.side === "string" ? v.side : "long",
    weightBps: typeof v.weightBps === "number" ? v.weightBps : 0,
    pnlPct: typeof v.pnlPct === "number" ? v.pnlPct : null,
  };
}

function asSource(value: unknown): SandwichSource | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const str = (x: unknown) => (typeof x === "string" && x ? x : null);
  // For YouTube sources `quote` is either the bare video title or
  // "<title> — <transcript excerpt>"; keep only the title part.
  const quote = str(v.quote);
  const title = quote ? (quote.split(" — ")[0] || quote).trim() || null : null;
  return {
    sourceType: str(v.sourceType),
    sourceUrl: str(v.sourceUrl),
    videoId: str(v.videoId),
    title,
    authorName: str(v.authorName),
    authorHandle: str(v.authorHandle),
    authorAvatarUrl: str(v.authorAvatarUrl),
  };
}

export type VideoPreview = {
  title: string | null;
  author: string | null;
  thumbnailUrl: string;
};

// Server-side oEmbed lookup for the exact title/author/thumbnail. Falls back
// to the always-available hqdefault thumbnail if YouTube doesn't answer.
export async function getYouTubePreview(videoId: string): Promise<VideoPreview> {
  const fallback: VideoPreview = {
    title: null,
    author: null,
    thumbnailUrl: `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg`,
  };
  try {
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`,
      { next: { revalidate: 86400 } },
    );
    if (!res.ok) return fallback;
    const data = (await res.json()) as Record<string, unknown>;
    return {
      title: typeof data.title === "string" ? data.title : null,
      author: typeof data.author_name === "string" ? data.author_name : null,
      thumbnailUrl:
        typeof data.thumbnail_url === "string" ? data.thumbnail_url : fallback.thumbnailUrl,
    };
  } catch {
    return fallback;
  }
}

export async function getSandwich(id: string): Promise<Sandwich | null> {
  if (!id.trim()) return null;
  try {
    const res = await fetch(
      `${API_BASE}/api/sandwiches/${encodeURIComponent(id.trim())}`,
      { next: { revalidate: 300 } },
    );
    if (!res.ok) return null;
    const payload: unknown = await res.json();
    const raw =
      payload && typeof payload === "object"
        ? (payload as Record<string, unknown>).sandwich
        : null;
    if (!raw || typeof raw !== "object") return null;
    const s = raw as Record<string, unknown>;
    if (typeof s.id !== "string" || typeof s.name !== "string") return null;
    return {
      id: s.id,
      name: s.name,
      summary: typeof s.summary === "string" ? s.summary : "",
      direction: typeof s.direction === "string" ? s.direction : null,
      horizon: typeof s.horizon === "string" ? s.horizon : null,
      confidence: typeof s.confidence === "string" ? s.confidence : null,
      pnlPct: typeof s.pnlPct === "number" ? s.pnlPct : null,
      legs: Array.isArray(s.legs)
        ? s.legs.map(asLeg).filter((l): l is SandwichLeg => l !== null)
        : [],
      source: asSource(s.source),
    };
  } catch {
    return null;
  }
}

// Deep link the app registers (bread:// scheme). SandwichScreen reads
// `sandwichId` from the route params and opens that sandwich's detail sheet.
export function sandwichAppLink(id: string): string {
  return `bread://sandwich?sandwichId=${encodeURIComponent(id)}`;
}
