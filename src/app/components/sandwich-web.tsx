import Link from "next/link";
import type { Sandwich } from "@/lib/sandwiches";
import {
  formatDate,
  formatPercent,
  formatPrice,
  getOpenInAppUrl,
  getSandwichCreator,
  getSandwichSourceLabel,
} from "@/lib/sandwiches";
import styles from "./sandwich-web.module.css";

export function SandwichCard({
  sandwich,
  rank,
}: {
  sandwich: Sandwich;
  rank: number;
}) {
  const pnl = sandwich.pnlPct;
  const positive = (pnl ?? 0) >= 0;
  const visibleLegs = sandwich.legs.slice(0, 3);

  return (
    <Link href={`/s/${sandwich.id}`} className={styles.cardLink}>
      <div className={styles.cardTop}>
        <span className={styles.rank}>#{rank}</span>
        <span className={styles.sourceType}>{getSandwichSourceLabel(sandwich)}</span>
      </div>
      <div className={styles.cardBody}>
        <h3>{sandwich.name}</h3>
        <p className={styles.creator}>by {getSandwichCreator(sandwich)}</p>
        <div className={styles.pnlRow}>
          <strong
            className={`${styles.pnlValue} ${positive ? styles.positive : styles.negative}`}
          >
            {formatPercent(pnl)}
          </strong>
          <span className={styles.pnlLabel}>Since thesis</span>
        </div>
        <div className={styles.legStrip} aria-label="Sandwich positions">
          {visibleLegs.map((leg) => (
            <span className={styles.legChip} key={leg.id}>
              <span
                className={`${styles.sideDot} ${
                  leg.side.toLowerCase() === "short" || leg.side.toLowerCase() === "sell"
                    ? styles.sideDotShort
                    : ""
                }`}
                aria-hidden="true"
              />
              {leg.symbol || leg.label}
            </span>
          ))}
          {sandwich.legs.length > visibleLegs.length ? (
            <span className={styles.legChip}>+{sandwich.legs.length - visibleLegs.length}</span>
          ) : null}
        </div>
      </div>
      <div className={styles.cardFooter}>
        <span>{sandwich.horizon}</span>
        <span>
          {sandwich.likeCount} {sandwich.likeCount === 1 ? "like" : "likes"} ·{" "}
          {sandwich.commentCount} comments
        </span>
      </div>
    </Link>
  );
}

export function SandwichDetail({
  sandwich,
  assetSlugs,
}: {
  sandwich: Sandwich;
  /** Mint/symbol → asset slug, so each leg can link to its asset page. */
  assetSlugs?: Map<string, string>;
}) {
  const pnl = sandwich.pnlPct;
  const positive = (pnl ?? 0) >= 0;
  const sourceLabel = getSandwichSourceLabel(sandwich);
  const builderHandle = sandwich.builder?.username ?? null;

  return (
    <>
      <Link href="/sandwiches" className={styles.backLink}>
        ← Top P&amp;L sandwiches
      </Link>
      <section className={styles.detailHero}>
        <span className={styles.eyebrow}>
          <span className={styles.eyebrowDot} aria-hidden="true" />
          Bread sandwich
        </span>
        <h1>{sandwich.name}</h1>
        <div className={styles.detailMeta}>
          {builderHandle ? (
            <Link href={`/u/${builderHandle}`} className={styles.metaLink}>
              built by @{builderHandle}
            </Link>
          ) : null}
          <span>by {getSandwichCreator(sandwich)}</span>
          <span>{sourceLabel}</span>
          <span>{formatDate(sandwich.createdAt)}</span>
          <span>{sandwich.horizon}</span>
        </div>
      </section>

      <section className={styles.performancePanel} aria-label="Sandwich performance">
        <strong
          className={`${styles.performanceNumber} ${positive ? styles.positive : styles.negative}`}
        >
          {formatPercent(pnl)}
        </strong>
        <div className={styles.performanceCopy}>
          <span>Live P&amp;L since thesis</span>
          <p>{sandwich.summary}</p>
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <h2>The sandwich</h2>
          <span>
            {sandwich.legs.length} {sandwich.legs.length === 1 ? "position" : "positions"} ·{" "}
            {sandwich.venue}
          </span>
        </div>
        <div className={styles.legList}>
          {sandwich.legs.map((leg) => {
            const legPositive = (leg.pnlPct ?? 0) >= 0;
            const weight = Math.round(leg.weightBps / 100);
            const slug =
              (leg.mint ? assetSlugs?.get(leg.mint) : null) ??
              assetSlugs?.get(leg.symbol.toUpperCase()) ??
              null;
            const body = (
              <>
                <span className={styles.symbolMark}>{leg.symbol.slice(0, 5)}</span>
                <div className={styles.legIdentity}>
                  <strong>{leg.label}</strong>
                  <span>
                    <span className={styles.sideLabel}>{leg.side.toUpperCase()}</span> · {weight}%
                    weight · {formatPrice(leg.currentPriceUsd)}
                  </span>
                </div>
                <div className={styles.legNumbers}>
                  <strong className={legPositive ? styles.positive : styles.negative}>
                    {formatPercent(leg.pnlPct)}
                  </strong>
                  <span>since entry</span>
                </div>
              </>
            );

            return slug ? (
              <Link href={`/assets/${slug}`} className={styles.legRow} key={leg.id}>
                {body}
              </Link>
            ) : (
              <article className={styles.legRow} key={leg.id}>
                {body}
              </article>
            );
          })}
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <h2>The thesis</h2>
          <span>{sandwich.confidence} confidence</span>
        </div>
        <p className={styles.thesisText}>{sandwich.summary}</p>
        {sandwich.thesis?.quote ? (
          <blockquote className={styles.quote}>“{sandwich.thesis.quote}”</blockquote>
        ) : null}
      </section>

      {sandwich.source.sourceUrl ? (
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Original source</h2>
            <span>{sourceLabel}</span>
          </div>
          <a
            href={sandwich.source.sourceUrl}
            className={styles.sourceLink}
            target="_blank"
            rel="noreferrer"
          >
            <span>
              <strong>{getSandwichCreator(sandwich)}</strong>
              <span>Open the source behind this thesis</span>
            </span>
            <strong aria-hidden="true">↗</strong>
          </a>
        </section>
      ) : null}
    </>
  );
}

export function OpenInAppCard({ sandwichId }: { sandwichId: string }) {
  return (
    <section className={styles.appCard}>
      <h2>Trade this sandwich</h2>
      <p>Open Bread to choose an amount, review every leg, and submit the trade.</p>
      <div className={styles.appActions}>
        <a href={getOpenInAppUrl(sandwichId)} className={styles.primaryLink}>
          Open in Bread
        </a>
        <Link href="/" className={styles.secondaryLink}>
          Get the app
        </Link>
      </div>
    </section>
  );
}

export function MiniLeaderboard({
  sandwiches,
}: {
  sandwiches: Sandwich[];
}) {
  if (sandwiches.length === 0) return null;

  return (
    <section className={styles.leaderboardCard}>
      <h2>Top P&amp;L</h2>
      <div className={styles.miniList}>
        {sandwiches.slice(0, 5).map((sandwich, index) => {
          const positive = (sandwich.pnlPct ?? 0) >= 0;
          return (
            <Link href={`/s/${sandwich.id}`} className={styles.miniItem} key={sandwich.id}>
              <span className={styles.miniRank}>{index + 1}</span>
              <span className={styles.miniTitle}>{sandwich.name}</span>
              <span
                className={`${styles.miniPnl} ${positive ? styles.positive : styles.negative}`}
              >
                {formatPercent(sandwich.pnlPct)}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function SandwichLoadingGrid() {
  return (
    <main className={styles.shell}>
      <div className={styles.container}>
        <div className={styles.skeletonGrid} aria-label="Loading sandwiches" aria-busy="true">
          {Array.from({ length: 6 }, (_, index) => (
            <div className={styles.skeletonCard} key={index} />
          ))}
        </div>
      </div>
    </main>
  );
}

export { styles as sandwichWebStyles };
