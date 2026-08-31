/**
 * Shared read-only transport for the Bread API.
 *
 * Every caller here is a React Server Component, which is what makes these
 * requests possible at all: the API only allows CORS from localhost, so the
 * browser could not call it directly even though the endpoints are anonymous.
 * Fetching on the server also keeps the Privy DID resolved by `users.ts` out of
 * the client bundle.
 */

export const BREAD_API_BASE_URL = (
  process.env.BREAD_API_URL ??
  process.env.NEXT_PUBLIC_BREAD_API_URL ??
  "https://bread-be.vercel.app"
).replace(/\/$/, "");

export class BreadApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "BreadApiError";
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** A finite number, or null for anything the API left absent or unpriced. */
export function toNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function toText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function fetchFromBread<T>(
  path: string,
  { revalidate = 60 }: { revalidate?: number } = {},
): Promise<T> {
  const response = await fetch(`${BREAD_API_BASE_URL}${path}`, {
    headers: { Accept: "application/json" },
    next: { revalidate },
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new BreadApiError(response.status, `Bread API returned ${response.status} for ${path}`);
  }

  return (await response.json()) as T;
}

/**
 * Reads that a page can render without. A missing holdings list should thin the
 * profile out, not blank it — only the resource the route is *named* for
 * (the sandwich, the asset, the user) is allowed to fail the render.
 */
export async function fetchOptional<T>(
  path: string,
  options?: { revalidate?: number },
): Promise<T | null> {
  try {
    return await fetchFromBread<T>(path, options);
  } catch {
    return null;
  }
}
