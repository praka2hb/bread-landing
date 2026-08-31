import Link from "next/link";
import type { Sandwich, SandwichLeg, SandwichPeriod, SourceVideo } from "@/lib/sandwiches";
import { marketTicker, orderByMoment } from "@/lib/sandwiches";
import styles from "./feed.module.css";

/* ── Icons ─────────────────────────────────────────────────────────────── */

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 11.5a8.38 8.38 0 0 1-9 8.5 9.79 9.79 0 0 1-4.6-1.05L3 20l1.3-3.9A8.38 8.38 0 0 1 3 11.5 8.5 8.5 0 0 1 12 3a8.5 8.5 0 0 1 9 8.5Z" />
    </svg>
  );
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function VerifiedIcon() {
  return (
    <svg className={styles.verified} viewBox="0 0 24 24" fill="currentColor" aria-label="Bread builder" role="img">
      <path d="M12 1.5l2.4 2.1 3.2-.3.9 3.1 2.8 1.6-1.2 3 1.2 3-2.8 1.6-.9 3.1-3.2-.3L12 22.5l-2.4-2.1-3.2.3-.9-3.1L2.7 16l1.2-3-1.2-3 2.8-1.6.9-3.1 3.2.3z" />
      <path d="M10.6 15.4l-3-3 1.3-1.3 1.7 1.7 4-4 1.3 1.3z" fill="#fff" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className={styles.sourceMark} viewBox="0 0 24 24" fill="currentColor" aria-label="From X" role="img">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

/* ── Formatting, ported from sandwich-screen.tsx ───────────────────────── */

/**
 * Drops precision on big moves so the pill can never grow wide enough to shove
 * itself off screen — "+1240.00%" is nine glyphs of a budget with room for seven.
 */
export function formatCardPnl(value: number | null): string {
  if (value === null) return "--";
  const sign = value >= 0 ? "+" : "-";
  const magnitude = Math.abs(value);
  if (magnitude >= 1000) return `${sign}${(magnitude / 1000).toFixed(1)}k%`;
  if (magnitude >= 100) return `${sign}${Math.round(magnitude)}%`;
  return `${sign}${magnitude.toFixed(2)}%`;
}

function pnlToneClass(value: number | null): string {
  if (value === null || value === 0) return styles.pnlFlat;
  return value > 0 ? styles.pnlPositive : styles.pnlNegative;
}

function formatCardCount(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return String(value);
}

export function formatRelativeTime(iso: string | null): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";

  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (seconds < 60) return "now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

/* ── Identity ──────────────────────────────────────────────────────────── */

type CardIdentity = {
  name: string;
  showAt: boolean;
  avatarUrl: string | null;
  initials: string;
  href: string | null;
  isBuilder: boolean;
  isXSource: boolean;
};

function initialsOf(value: string): string {
  const cleaned = value.replace(/^@/, "").trim();
  return cleaned.slice(0, 2).toUpperCase() || "?";
}

/**
 * Who owns the byline.
 *
 * The Bread builder wins. With no builder at all (an ingested X post owns no
 * AppUser) the cited account stands in — as a citation, not as a byline, which
 * is why it renders one step back and takes the X mark rather than the check.
 */
function resolveIdentity(sandwich: Sandwich): CardIdentity {
  const builder = sandwich.builder;
  const builderName = builder?.name?.trim() || builder?.username?.trim() || "";

  if (builder && builderName) {
    return {
      name: builderName.replace(/^@/, ""),
      showAt: true,
      avatarUrl: builder.avatarUrl,
      initials: initialsOf(builderName),
      href: builder.username ? `/u/${builder.username}` : null,
      isBuilder: true,
      isXSource: false,
    };
  }

  const source = sandwich.source;
  const handle = source.authorHandle?.trim() || "";
  const authorName = source.authorName?.trim() || "";
  const label = handle || authorName || "Unattributed";
  const sourceType = source.sourceType.toLowerCase();

  return {
    name: label.replace(/^@/, ""),
    showAt: Boolean(handle),
    avatarUrl: source.authorAvatarUrl,
    initials: initialsOf(label),
    href: null,
    isBuilder: false,
    isXSource: sourceType === "x" || sourceType === "twitter",
  };
}

/** The post as it reads in the feed: the builder's own take, else the summary. */
function cardBodyText(sandwich: Sandwich): string {
  return (
    sandwich.thesis?.headline?.trim() ||
    sandwich.source.quote?.trim() ||
    sandwich.summary.trim() ||
    sandwich.name
  );
}

/* ── Pieces ────────────────────────────────────────────────────────────── */

function LegStack({ legs }: { legs: SandwichLeg[] }) {
  const ordered = [...legs].sort((left, right) => left.order - right.order);
  // Capped at three circles: four or more show two icons plus a "+N" badge. A
  // fourth circle pushed the P&L off screen on a narrow viewport.
  const visible = ordered.slice(0, ordered.length > 3 ? 2 : 3);
  const remaining = ordered.length - visible.length;

  if (visible.length === 0) return null;

  return (
    <span
      className={styles.legStack}
      aria-label={`${ordered.length} ${ordered.length === 1 ? "asset" : "assets"} in this sandwich`}
    >
      {visible.map((leg) => (
        <span className={styles.legIcon} key={leg.id}>
          {leg.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={leg.imageUrl} alt="" loading="lazy" decoding="async" />
          ) : (
            leg.symbol.slice(0, 2)
          )}
        </span>
      ))}
      {remaining > 0 ? <span className={styles.legIcon}>+{remaining}</span> : null}
    </span>
  );
}

/**
 * Engagement state, shown but not operable — this surface reads, it does not
 * write. Presented as one labelled group rather than as three dead buttons.
 */
function ActionRow({ sandwich }: { sandwich: Sandwich }) {
  const hasPnl = sandwich.pnlPct !== null;

  return (
    <div
      className={styles.actionsRow}
      role="group"
      aria-label={`${sandwich.likeCount} likes, ${sandwich.commentCount} comments`}
    >
      <span className={`${styles.action} ${sandwich.viewerHasLiked ? styles.actionLiked : ""}`}>
        <HeartIcon filled={sandwich.viewerHasLiked} />
        {sandwich.likeCount > 0 ? (
          <span
            className={`${styles.actionCount} ${sandwich.viewerHasLiked ? styles.actionCountLiked : ""}`}
          >
            {formatCardCount(sandwich.likeCount)}
          </span>
        ) : null}
      </span>

      <span className={styles.action}>
        <CommentIcon />
        {sandwich.commentCount > 0 ? (
          <span className={styles.actionCount}>{formatCardCount(sandwich.commentCount)}</span>
        ) : null}
      </span>

      <span className={styles.action}>
        <BookmarkIcon filled={false} />
      </span>

      {sandwich.legs.length > 0 || hasPnl ? (
        <span className={styles.pnlPill}>
          <LegStack legs={sandwich.legs} />
          {hasPnl ? (
            <span className={`${styles.pnl} ${pnlToneClass(sandwich.pnlPct)}`}>
              {formatCardPnl(sandwich.pnlPct)}
            </span>
          ) : null}
        </span>
      ) : null}
    </div>
  );
}

/* ── Card ──────────────────────────────────────────────────────────────── */

export function FeedCard({ sandwich }: { sandwich: Sandwich }) {
  const identity = resolveIdentity(sandwich);
  const record = sandwich.builder?.record;
  const isPerp = sandwich.venue.toLowerCase() === "perp";

  return (
    <article>
      <Link href={`/s/${sandwich.id}`} className={styles.card}>
        <span className={styles.avatar}>
          {identity.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={identity.avatarUrl} alt="" loading="lazy" decoding="async" />
          ) : (
            identity.initials
          )}
        </span>

        <div className={styles.content}>
          <div className={styles.creatorRow}>
            <span
              className={`${styles.handle} ${identity.isBuilder ? "" : styles.handleSource}`}
            >
              {identity.showAt ? <span className={styles.handleAt}>@</span> : null}
              {identity.name}
            </span>
            {identity.isBuilder ? <VerifiedIcon /> : identity.isXSource ? <XIcon /> : null}
            {record?.visible && record.hitRate !== null ? (
              <span className={styles.recordBadge}>
                {Math.round(record.hitRate * 100)}% · {record.resolvedCount}
              </span>
            ) : null}
            <span className={`${styles.venueBadge} ${isPerp ? styles.venueBadgePerp : ""}`}>
              {isPerp ? "Perp" : "Spot"}
            </span>
            <span className={styles.spacer} />
            <span className={styles.timestamp}>{formatRelativeTime(sandwich.createdAt)}</span>
          </div>

          <p className={styles.thesis}>{cardBodyText(sandwich)}</p>

          <ActionRow sandwich={sandwich} />
        </div>
      </Link>
    </article>
  );
}

/**
 * One video is one card, not one card per call.
 *
 * A video that produced eleven calls used to post eleven cards, each repeating
 * the same byline and minute — the feed read as eleven unrelated theses. This
 * is the container: the episode's own words, its thumbnail, and the tickers it
 * produced. The calls themselves are rows on the episode page.
 */
export function VideoGroupCard({
  video,
  sandwiches,
}: {
  video: SourceVideo;
  sandwiches: Sandwich[];
}) {
  const ordered = orderByMoment(sandwiches);
  const identity = resolveIdentity(ordered[0]);
  const tickers = [...new Set(ordered.map((sandwich) => marketTicker(sandwich)))];
  const visibleTickers = tickers.slice(0, 4);
  // The heart reads as it does in the app: a count is a max, not a sum, since
  // one tap writes a like row per call.
  const likeCount = ordered.reduce((most, item) => Math.max(most, item.likeCount), 0);
  const commentCount = ordered.reduce((sum, item) => sum + item.commentCount, 0);

  return (
    <article>
      <Link href={`/v/${video.videoId}`} className={styles.card}>
        <span className={styles.avatar}>
          {identity.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={identity.avatarUrl} alt="" loading="lazy" decoding="async" />
          ) : (
            identity.initials
          )}
        </span>

        <div className={styles.content}>
          <div className={styles.creatorRow}>
            <span className={styles.handle}>
              {identity.showAt ? <span className={styles.handleAt}>@</span> : null}
              {identity.name}
            </span>
            {identity.isBuilder ? <VerifiedIcon /> : null}
            <span className={`${styles.venueBadge} ${styles.callCountBadge}`}>
              {ordered.length} {ordered.length === 1 ? "call" : "calls"}
            </span>
            <span className={styles.spacer} />
            <span className={styles.timestamp}>
              {formatRelativeTime(video.publishedAt ?? ordered[0].createdAt)}
            </span>
          </div>

          <p className={styles.thesis}>{video.title}</p>

          <span className={styles.videoThumb}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`}
              alt=""
              loading="lazy"
              decoding="async"
            />
            <span className={styles.videoPlay} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
            {video.channelName ? (
              <span className={styles.videoChannel}>{video.channelName}</span>
            ) : null}
          </span>

          <div
            className={styles.actionsRow}
            role="group"
            aria-label={`${likeCount} likes, ${commentCount} comments`}
          >
            <span className={styles.action}>
              <HeartIcon filled={false} />
              {likeCount > 0 ? (
                <span className={styles.actionCount}>{formatCardCount(likeCount)}</span>
              ) : null}
            </span>
            <span className={styles.action}>
              <CommentIcon />
              {commentCount > 0 ? (
                <span className={styles.actionCount}>{formatCardCount(commentCount)}</span>
              ) : null}
            </span>
            <span className={styles.action}>
              <BookmarkIcon filled={false} />
            </span>

            <span className={styles.tickerStrip}>
              {visibleTickers.map((ticker) => (
                <span className={styles.tickerChip} key={ticker}>
                  {ticker}
                </span>
              ))}
              {tickers.length > visibleTickers.length ? (
                <span className={styles.tickerChip}>
                  +{tickers.length - visibleTickers.length}
                </span>
              ) : null}
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

const periodTabs: Array<{ value: SandwichPeriod; label: string }> = [
  { value: "hot", label: "hot" },
  { value: "last-month", label: "last month" },
];

/** Shareable time windows for the ranked sandwich feed. */
export function FeedTabs({ period }: { period: SandwichPeriod }) {
  return (
    <nav className={styles.tabs} aria-label="Filter sandwiches by date">
      {periodTabs.map((tab) => {
        const isActive = period === tab.value;
        return (
          <Link
            href={`/sandwiches?period=${tab.value}`}
            className={`${styles.tab} ${isActive ? styles.tabActive : ""}`}
            aria-current={isActive ? "page" : undefined}
            key={tab.value}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** The app's compose button. Here it opens the app, since the web can't post. */
export function ComposeFab() {
  return (
    <a href="bread://sandwich" className={styles.fab} aria-label="Open Bread to create a sandwich">
      <PlusIcon />
    </a>
  );
}

export { styles as feedStyles };
