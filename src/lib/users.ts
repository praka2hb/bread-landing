import { cache } from "react";
import {
  BreadApiError,
  fetchFromBread,
  fetchOptional,
  isRecord,
  toNumber,
  toText,
} from "./bread-api";
import type { Sandwich } from "./sandwiches";

export type UserProfile = {
  id: string;
  /**
   * Privy DID. Every other user endpoint is keyed on it, so it is resolved once
   * per profile render — on the server, and never passed to a client component.
   */
  privyUserId: string;
  username: string;
  name: string | null;
  avatarUrl: string | null;
  bio: string | null;
  walletAddress: string | null;
  followerCount: number;
  followingCount: number;
  tradeCount: number;
};

export type UserHolding = {
  mint: string;
  symbol: string;
  name: string | null;
  image: string | null;
  units: number | null;
  pricePerToken: number | null;
  valueUsd: number | null;
  avgPriceUsd: number | null;
};

export type UserHoldings = {
  holdings: UserHolding[];
  totalValueUsd: number | null;
  cashUsd: number | null;
};

export type UserTrackRecord = {
  /**
   * False until the user has enough resolved positions to publish a hit rate.
   * The API decides the threshold; the page shows progress toward it rather
   * than a rate computed from too few samples.
   */
  visible: boolean;
  resolvedCount: number;
  requiredForRecord: number;
  hitRate: number | null;
  medianReturn: number | null;
  openCount: number;
};

function toUserProfile(value: unknown): UserProfile | null {
  if (!isRecord(value)) return null;

  const id = toText(value.id);
  const privyUserId = toText(value.privyUserId);
  const username = toText(value.username);
  if (!id || !privyUserId || !username) return null;

  return {
    id,
    privyUserId,
    username,
    name: toText(value.name),
    avatarUrl: toText(value.avatarUrl),
    bio: toText(value.bio),
    walletAddress: toText(value.walletAddress),
    followerCount: toNumber(value.followerCount) ?? 0,
    followingCount: toNumber(value.followingCount) ?? 0,
    tradeCount: toNumber(value.tradeCount) ?? 0,
  };
}

/**
 * Resolve a handle to a profile.
 *
 * Backed by `/api/users/by-username/[username]`, added alongside this page —
 * sandwich payloads carry `builder.username` but drop the Privy DID that every
 * other user endpoint is keyed on. Until bread-be ships that route, production
 * answers 404 here and profile links render as plain text.
 */
export const getUserByUsername = cache(
  async (username: string): Promise<UserProfile | null> => {
    const handle = username.trim().replace(/^@/, "");
    if (!handle) return null;

    try {
      const payload = await fetchFromBread<unknown>(
        `/api/users/by-username/${encodeURIComponent(handle)}`,
      );
      return toUserProfile(payload);
    } catch (error) {
      if (error instanceof BreadApiError && error.status === 404) return null;
      throw error;
    }
  },
);

/** Sandwiches this user BUILT — `privyUserId` filters the feed by author. */
export const getSandwichesByBuilder = cache(
  async (privyUserId: string, limit = 12): Promise<Sandwich[]> => {
    const payload = await fetchOptional<{ sandwiches?: unknown }>(
      `/api/sandwiches?privyUserId=${encodeURIComponent(privyUserId)}&limit=${Math.min(limit, 50)}`,
    );
    const rows = Array.isArray(payload?.sandwiches) ? payload.sandwiches : [];

    return rows.filter((row): row is Sandwich => {
      if (!isRecord(row)) return false;
      return typeof row.id === "string" && typeof row.name === "string" && Array.isArray(row.legs);
    });
  },
);

export const getUserHoldings = cache(
  async (privyUserId: string): Promise<UserHoldings> => {
    const payload = await fetchOptional<{
      holdings?: unknown;
      totalValueUsd?: unknown;
      cashUsd?: unknown;
    }>(`/api/users/${encodeURIComponent(privyUserId)}/holdings`);

    const rows = Array.isArray(payload?.holdings) ? payload.holdings : [];
    const holdings = rows.flatMap((row): UserHolding[] => {
      if (!isRecord(row)) return [];
      const mint = toText(row.mint);
      const symbol = toText(row.symbol);
      if (!mint || !symbol) return [];
      return [
        {
          mint,
          symbol,
          name: toText(row.name),
          image: toText(row.image),
          units: toNumber(row.units),
          pricePerToken: toNumber(row.pricePerToken),
          valueUsd: toNumber(row.valueUsd),
          avgPriceUsd: toNumber(row.avgPriceUsd),
        },
      ];
    });

    return {
      holdings: holdings.sort((left, right) => (right.valueUsd ?? 0) - (left.valueUsd ?? 0)),
      totalValueUsd: toNumber(payload?.totalValueUsd),
      cashUsd: toNumber(payload?.cashUsd),
    };
  },
);

export const getUserTrackRecord = cache(
  async (privyUserId: string): Promise<UserTrackRecord | null> => {
    const payload = await fetchOptional<{ trackRecord?: unknown }>(
      `/api/users/${encodeURIComponent(privyUserId)}/track-record`,
    );
    const record = payload?.trackRecord;
    if (!isRecord(record)) return null;

    return {
      visible: record.visible === true,
      resolvedCount: toNumber(record.resolvedCount) ?? 0,
      requiredForRecord: toNumber(record.requiredForRecord) ?? 0,
      hitRate: toNumber(record.hitRate),
      medianReturn: toNumber(record.medianReturn),
      openCount: toNumber(record.openCount) ?? 0,
    };
  },
);

export function getUserDisplayName(user: UserProfile): string {
  return user.name?.trim() || `@${user.username}`;
}

/** `D5L7…CTrS` — a wallet is shown for identification, never for interaction. */
export function shortenAddress(address: string | null): string | null {
  if (!address || address.length <= 12) return address;
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}
