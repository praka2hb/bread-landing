import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { sandwichWebStyles as styles } from "@/app/components/sandwich-web";
import { AppHandoff } from "@/app/components/app-handoff";
import { EpisodeView, type EpisodeCallView } from "@/app/components/episode";
import { getAssetSlugIndex } from "@/lib/assets";
import {
  formatDate,
  formatPrice,
  formatTimestamp,
  getEpisode,
  getMomentStartMs,
  getOpenInAppUrl,
  getThesisDescription,
  isShortCall,
  marketTicker,
  primaryLeg,
  type Sandwich,
} from "@/lib/sandwiches";

type Props = {
  params: Promise<{ videoId: string }>;
  searchParams: Promise<{ call?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { videoId } = await params;
  const episode = await getEpisode(videoId);

  if (!episode) return { title: "Episode not found — Bread" };

  const { video, sandwiches } = episode;
  const description =
    video.summary ??
    `${sandwiches.length} timestamped market calls from ${video.channelName ?? "this video"}, tracked live on Bread.`;

  return {
    title: `${video.title} — Bread`,
    description,
    alternates: { canonical: `/v/${video.videoId}` },
    openGraph: {
      title: `${video.title} — Bread`,
      description,
      type: "video.other",
      url: `/v/${video.videoId}`,
      images: [`https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`],
    },
  };
}

/** What the row leads with: the sentence that was said, not the generated name. */
function callQuote(sandwich: Sandwich): string {
  return (
    sandwich.thesis?.quote?.trim() ||
    sandwich.thesis?.headline?.trim() ||
    sandwich.name
  );
}

export default async function EpisodePage({ params, searchParams }: Props) {
  const { videoId } = await params;
  const { call: focusCallId } = await searchParams;
  const episode = await getEpisode(videoId);

  if (!episode) notFound();

  const assetSlugs = await getAssetSlugIndex();
  const { video, sandwiches } = episode;

  // Every call from one video is built by the same account, but only some rows
  // carry it — the first that does owns the byline.
  const owner = sandwiches.map((sandwich) => sandwich.builder).find((candidate) => candidate) ?? null;
  const ownerName = owner?.name?.trim() || owner?.username?.trim() || "";

  // Flattened here rather than in the client component: every sandwich carries
  // its source's full transcript, so handing the objects across would ship a
  // megabyte of it to the browser.
  const calls: EpisodeCallView[] = sandwiches.map((sandwich) => {
    const lead = primaryLeg(sandwich);
    const startMs = getMomentStartMs(sandwich);
    const slug =
      (lead?.mint ? assetSlugs.get(lead.mint) : null) ??
      (lead ? assetSlugs.get((lead.underlyingSymbol || lead.symbol).toUpperCase()) : null) ??
      null;
    return {
      id: sandwich.id,
      ticker: marketTicker(sandwich),
      short: isShortCall(sandwich),
      startMs,
      timestamp: startMs === null ? null : formatTimestamp(startMs),
      quote: callQuote(sandwich),
      headline: sandwich.name,
      explanation: getThesisDescription(sandwich),
      // A price belongs to one instrument, so a multi-leg call shows none —
      // its `+N` says the rest exist and its percentage is already weighted.
      price:
        lead && sandwich.legs.length === 1
          ? formatPrice(lead.currentPriceUsd ?? lead.priceUsd)
          : "",
      entryPrice:
        lead && sandwich.legs.length === 1 ? formatPrice(lead.priceUsd) : null,
      pnlPct: sandwich.pnlPct,
      pnlBasis: sandwich.pnlBasis ?? null,
      assets: [...sandwich.legs]
        .sort((left, right) => left.order - right.order)
        .map((leg) => ({
          id: leg.id,
          symbol: (leg.underlyingSymbol || leg.symbol || leg.label).toUpperCase(),
          logoUrl: leg.imageUrl,
        })),
      href: slug ? `/assets/${slug}` : null,
      openInApp: getOpenInAppUrl(sandwich.id),
    };
  });

  return (
    // No site header: the episode is a focused reading screen, like the
    // sandwich detail page it replaced.
    <main className={styles.shell}>
      {/* A shared /s/ link to a video call redirects here with ?call=. */}
      {focusCallId ? <AppHandoff appLink={getOpenInAppUrl(focusCallId)} /> : null}
      <div className={styles.container}>
        <EpisodeView
          video={{
            videoId: video.videoId,
            url: video.url,
            title: video.title,
            channelName: video.channelName,
            channelHandle: video.channelHandle,
            channelAvatarUrl: video.channelAvatarUrl,
            publishedLabel: video.publishedAt ? formatDate(video.publishedAt) : null,
          }}
          calls={calls}
          builder={
            owner && ownerName
              ? {
                  name: ownerName.replace(/^@/, ""),
                  username: owner.username,
                  avatarUrl: owner.avatarUrl,
                }
              : null
          }
          focusCallId={focusCallId ?? null}
        />
      </div>
    </main>
  );
}
