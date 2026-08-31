import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { SandwichAppDetail } from "@/app/components/sandwich-app-detail";
import {
  getAsset,
  getAssetPerformance,
  getAssetSlugIndex,
  type AssetDetail,
} from "@/lib/assets";
import { defaultChartRange, getSandwichChart } from "@/lib/sandwich-chart";
import { getSandwich, getSourceVideo } from "@/lib/sandwiches";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const sandwich = await getSandwich(id);

  if (!sandwich) {
    return { title: "Sandwich not found — Bread" };
  }

  return {
    title: `${sandwich.name} — Bread`,
    description: sandwich.summary,
    alternates: { canonical: `/s/${sandwich.id}` },
    openGraph: {
      title: `${sandwich.name} — Bread`,
      description: sandwich.summary,
      type: "website",
      url: `/s/${sandwich.id}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${sandwich.name} — Bread`,
      description: sandwich.summary,
    },
  };
}

export default async function SandwichPage({ params }: Props) {
  const { id } = await params;
  const sandwich = await getSandwich(id);

  if (!sandwich) notFound();

  // A call built from a video has no page of its own — it is one timestamp in
  // an episode, and reading it apart from the ten others made in the same hour
  // is what made the feed look like ten unrelated theses. Old links keep
  // working and land on the call, cued in the player.
  const video = getSourceVideo(sandwich);
  if (video) redirect(`/v/${video.videoId}?call=${sandwich.id}#call-${sandwich.id}`);

  // The chart opens on the shortest window that still covers the whole life of
  // the thesis, so the curve spans exactly the period the headline PnL measures.
  const range = defaultChartRange(sandwich.createdAt);
  const [assetSlugs, chart] = await Promise.all([
    getAssetSlugIndex(),
    getSandwichChart(sandwich, range),
  ]);

  // Shared web pages preview one position and obscure the remaining rows under
  // the TestFlight gate.
  const sortedLegs = [...sandwich.legs].sort((left, right) => left.order - right.order);
  const visibleLegs = sortedLegs.slice(0, 1);

  // Resolve and preload asset details on the server so opening the modal is
  // instant. The leg itself is a complete fallback if the asset endpoint is
  // unavailable, so a holding never turns back into route navigation.
  const legAssetEntries = await Promise.all(visibleLegs.map(async (leg) => {
    const slug =
      (leg.mint ? assetSlugs.get(leg.mint) : null) ??
      assetSlugs.get(leg.symbol.toUpperCase()) ??
      null;
    const [detail, performance] = await Promise.all([
      slug ? getAsset(slug).catch(() => null) : null,
      leg.mint ? getAssetPerformance(leg.mint).catch(() => null) : null,
    ]);
    const fallback: AssetDetail = {
      assetId: slug ?? leg.id,
      symbol: (leg.symbol || leg.label).toUpperCase(),
      name: leg.label || leg.symbol,
      category: null,
      imageUrl: leg.imageUrl,
      primaryMint: leg.mint,
      description: null,
      stats: {
        price: leg.currentPriceUsd ?? leg.priceUsd,
        liquidity: null,
        volume24hUSD: null,
        volume30dUSD: null,
        marketCap: null,
        fdv: null,
        priceChange1hPercent: null,
        priceChange24hPercent: leg.pnlPct,
        priceChange7dPercent: null,
        priceChange30dPercent: null,
        priceChange3mPercent: null,
        totalSupply: null,
        circulatingSupply: null,
      },
      risk: null,
    };

    const asset = detail ?? fallback;
    return [
      leg.id,
      {
        ...asset,
        stats: {
          ...asset.stats,
          priceChange7dPercent: performance?.oneWeek ?? null,
          priceChange30dPercent: performance?.oneMonth ?? null,
          priceChange3mPercent: performance?.threeMonth ?? null,
        },
      },
    ] as const;
  }));
  const legAssets = Object.fromEntries(legAssetEntries);

  return (
    <SandwichAppDetail
      sandwich={sandwich}
      initialChart={chart}
      legAssets={legAssets}
    />
  );
}
