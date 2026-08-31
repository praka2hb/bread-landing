"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatCompactUsd, type AssetDetail } from "@/lib/assets";
import type { ChartRange, SandwichChart } from "@/lib/sandwich-chart";
import type { Sandwich, SandwichLeg } from "@/lib/sandwiches";
import {
  getOpenInAppUrl,
  getSandwichPostText,
  getThesisBullets,
  getThesisDescription,
  isXPostSource,
} from "@/lib/sandwiches";
import { BasketChart } from "./basket-chart";
import { AssetLogo } from "./market-app";
import styles from "./sandwich-app-detail.module.css";

/**
 * The sandwich detail screen as the app draws it, on the web.
 *
 * Type, spacing and colour are lifted from the native screen
 * (bread-mobile/src/screens/sandwich-screen.tsx + components/x-post-preview.tsx
 * + components/sandwich-basket-chart.tsx) so a shared link looks like the thing
 * it links to. What the web cannot do — like, comment, bookmark, trade — hands
 * off to the app rather than pretending: every action control is a deep link.
 */

const CHART_RANGES: { label: string; range: ChartRange }[] = [
  { label: "24H", range: "24H" },
  { label: "1W", range: "1W" },
  { label: "1M", range: "1M" },
  { label: "3M", range: "3M" },
  { label: "ALL", range: "ALL" },
];

function formatPnl(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "--";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function formatLegPrice(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "--";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: value < 1 ? 4 : 2,
  }).format(value);
}

function formatPostDate(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: date.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  });
}

function legSideLabel(leg: SandwichLeg): string {
  const side = (leg.side ?? "").trim().toLowerCase();
  if (leg.type === "prediction_market") return side === "no" ? "NO" : "YES";
  return side === "sell" || side === "short" ? "SHORT" : "LONG";
}

function assetChangeClass(value: number | null): string {
  if (value === null || value === 0) return styles.assetChangeFlat;
  return value > 0 ? styles.assetChangeUp : styles.assetChangeDown;
}

/* eslint-disable @next/next/no-img-element -- upstream logo CDNs (tokens.xyz,
   ondo, pbs.twimg, r2.dev) are not in next.config's image allowlist; sizes are
   fixed in CSS and every image has a text fallback. */
function RemoteImage({ src, alt, className }: { src: string; alt: string; className: string }) {
  return <img className={className} src={src} alt={alt} loading="lazy" decoding="async" />;
}
/* eslint-enable @next/next/no-img-element */

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M15 5 8 12l7 7"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231ZM17.083 19.77h1.833L7.084 4.126H5.117Z" />
    </svg>
  );
}

function ChevronDownIcon({ up }: { up: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={up ? { transform: "rotate(180deg)" } : undefined}
    >
      <path
        d="m6 9.5 6 6 6-6"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="m6 6 12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LegRow({
  leg,
  asset,
  onOpen,
}: {
  leg: SandwichLeg;
  asset: AssetDetail;
  onOpen: (asset: AssetDetail, opener: HTMLButtonElement) => void;
}) {
  const title =
    leg.type === "prediction_market"
      ? (leg.question ?? leg.label)
      : (leg.symbol || leg.label).toUpperCase();
  const weight = `${Math.round(Math.max(0, leg.weightBps) / 100)}%`;
  const sideLabel = legSideLabel(leg);
  const showSide = leg.type === "prediction_market" || leg.venue === "perp";
  const pnl = leg.pnlPct;

  const body = (
    <>
      <span className={styles.legLogo}>
        {leg.imageUrl ? (
          <RemoteImage src={leg.imageUrl} alt="" className={styles.legLogoImg} />
        ) : (
          (leg.symbol || leg.label).slice(0, 4).toUpperCase()
        )}
      </span>
      <span className={styles.legCopy}>
        <strong className={styles.legTitle}>{title}</strong>
        <span className={styles.legWeight}>{weight}</span>
      </span>
      <span className={styles.legMetrics}>
        {showSide ? (
          <span
            className={`${styles.legSidePill} ${
              sideLabel === "NO" || sideLabel === "SHORT" ? styles.legSidePillNo : styles.legSidePillYes
            }`}
          >
            {sideLabel}
          </span>
        ) : null}
        <span className={styles.legPrice}>{formatLegPrice(leg.currentPriceUsd)}</span>
        <span
          className={`${styles.legPnl} ${
            pnl === null ? styles.legPnlMuted : pnl < 0 ? styles.legPnlNegative : styles.legPnlPositive
          }`}
        >
          {/* No PnL means no live price for this leg upstream — never that the
              sandwich is new, which reads 0.00% from the moment it is created. */}
          {formatPnl(pnl)}
        </span>
      </span>
    </>
  );

  return (
    <button
      type="button"
      className={styles.legRow}
      aria-haspopup="dialog"
      onClick={(event) => onOpen(asset, event.currentTarget)}
    >
      {body}
    </button>
  );
}

export function SandwichAppDetail({
  sandwich,
  initialChart,
  legAssets,
}: {
  sandwich: Sandwich;
  initialChart: SandwichChart;
  /** Leg id → preloaded modal detail. Every visible leg has a fallback. */
  legAssets: Record<string, AssetDetail>;
}) {
  const [chart, setChart] = useState(initialChart);
  const [range, setRange] = useState<ChartRange>(initialChart.range);
  const [pendingRange, setPendingRange] = useState<ChartRange | null>(null);
  const [scrubIndex, setScrubIndex] = useState(-1);
  const [postExpanded, setPostExpanded] = useState(false);
  const [postTruncatable, setPostTruncatable] = useState(false);
  const [thesisExpanded, setThesisExpanded] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<AssetDetail | null>(null);
  const postRef = useRef<HTMLParagraphElement>(null);
  const assetDialogRef = useRef<HTMLDialogElement>(null);
  const assetOpenerRef = useRef<HTMLButtonElement | null>(null);

  const postText = useMemo(() => getSandwichPostText(sandwich), [sandwich]);
  const thesisBullets = useMemo(() => getThesisBullets(sandwich), [sandwich]);
  // Both fall back to `summary`, so on a sandwich with nothing more specific
  // they resolve to the same sentence — and "Show More" would open onto a copy
  // of the paragraph above it. Drop it when it adds nothing.
  const thesisDescription = useMemo(() => {
    const description = getThesisDescription(sandwich);
    return description.trim() === postText.trim() ? "" : description;
  }, [postText, sandwich]);
  const hasThesisContent = Boolean(thesisDescription) || thesisBullets.length > 0;

  const source = sandwich.source;
  const isXPost = isXPostSource(source);
  const builder = sandwich.builder;
  const openInApp = getOpenInAppUrl(sandwich.id);

  // An X sandwich IS the post, so it is shown under the cited account. Anything
  // else leads with the builder's take, so it has to be shown under theirs —
  // putting a generated thesis under the cited author's name and handle would
  // put words in their mouth.
  const identity =
    isXPost || !builder
      ? {
          name: source.authorName?.trim() || source.authorHandle?.replace(/^@+/, "") || "Bread",
          handle: source.authorHandle?.replace(/^@+/, "") ?? "",
          avatarUrl: source.authorAvatarUrl,
          href: null,
          date: formatPostDate(source.publishedAt ?? sandwich.createdAt),
        }
      : {
          name: builder.name?.trim() || builder.username || "Builder",
          handle: builder.username ?? "",
          avatarUrl: builder.avatarUrl,
          href: builder.username ? `/u/${builder.username}` : null,
          date: formatPostDate(sandwich.createdAt),
        };
  const initials =
    identity.name
      .split(/[\s._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "B";

  const [visibleLegs, hiddenLegs] = useMemo(
    () => {
      const sorted = [...sandwich.legs].sort((a, b) => a.order - b.order);
      return [sorted.slice(0, 1), sorted.slice(1)];
    },
    [sandwich.legs],
  );

  useEffect(() => {
    const node = postRef.current;
    if (!node) return;
    const measure = () => {
      if (postExpanded) return;
      setPostTruncatable(node.scrollHeight - node.clientHeight > 1);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [postExpanded, postText]);

  useEffect(() => {
    const dialog = assetDialogRef.current;
    if (!selectedAsset || !dialog || dialog.open) return;
    dialog.showModal();
  }, [selectedAsset]);

  useEffect(() => {
    if (!selectedAsset) return;
    const { body } = document;
    const gutter = window.innerWidth - document.documentElement.clientWidth;
    const previous = { overflow: body.style.overflow, paddingRight: body.style.paddingRight };
    body.style.overflow = "hidden";
    if (gutter > 0) body.style.paddingRight = `${gutter}px`;

    return () => {
      body.style.overflow = previous.overflow;
      body.style.paddingRight = previous.paddingRight;
    };
  }, [selectedAsset]);

  const openAsset = useCallback((asset: AssetDetail, opener: HTMLButtonElement) => {
    assetOpenerRef.current = opener;
    setSelectedAsset(asset);
  }, []);

  const closeAsset = useCallback(() => {
    assetDialogRef.current?.close();
  }, []);

  const handleAssetDialogClose = useCallback(() => {
    setSelectedAsset(null);
    assetOpenerRef.current?.focus();
    assetOpenerRef.current = null;
  }, []);

  // At rest the headline is the authoritative since-creation PnL. While
  // scrubbing — or on a zoomed window, which measures a different period — it is
  // the curve's own return, so the number always describes the line on screen.
  const scrubbedReturn =
    scrubIndex >= 0 && scrubIndex < chart.points.length - 1
      ? (chart.points[scrubIndex]?.returnPct ?? null)
      : null;
  const windowedReturn = !chart.isFullHistory
    ? (chart.points[chart.points.length - 1]?.returnPct ?? null)
    : null;
  const headlinePnl = scrubbedReturn ?? windowedReturn ?? sandwich.pnlPct;
  const headlinePositive = (headlinePnl ?? 0) >= 0;

  const selectRange = useCallback(
    async (next: ChartRange) => {
      if (next === range || pendingRange === next) return;
      setRange(next);
      setPendingRange(next);
      setScrubIndex(-1);
      try {
        const response = await fetch(
          `/api/sandwich-chart?id=${encodeURIComponent(sandwich.id)}&range=${next}`,
        );
        if (!response.ok) return;
        const data = (await response.json()) as SandwichChart;
        // Ignore a slow response for a window the viewer already moved off.
        setChart((current) => (data.range === next ? data : current));
      } catch {
        // Keep the window the viewer picked and the curve already drawn — a
        // failed refetch should not bounce the pills back on its own.
      } finally {
        setPendingRange((current) => (current === next ? null : current));
      }
    },
    [pendingRange, range, sandwich.id],
  );

  return (
    <div className={styles.screen}>
      <div className={styles.page}>
        <Link href="/sandwiches" className={styles.backButton} aria-label="Back to sandwiches">
          <ChevronLeftIcon />
        </Link>

        {/*
          One DOM, two layouts. Narrow screens flatten both columns into the app's
          own top-to-bottom order (the wrappers go `display: contents`); from the
          wide breakpoint up they become real columns — the thesis on the left,
          the market on the right — so a desktop reader isn't scrolling a phone.
        */}
        <div className={styles.columns}>
        <div className={styles.postColumn}>
        <header className={styles.postHeader}>
          {(() => {
            const face = (
              <>
                {identity.avatarUrl ? (
                  <RemoteImage src={identity.avatarUrl} alt="" className={styles.avatar} />
                ) : (
                  <span className={`${styles.avatar} ${styles.avatarFallback}`}>{initials}</span>
                )}
                <span className={styles.identity}>
                  <span className={styles.displayName}>{identity.name}</span>
                  <span className={styles.metaRow}>
                    {identity.handle ? (
                      <span className={styles.handle}>@{identity.handle}</span>
                    ) : null}
                    {identity.handle && identity.date ? (
                      <span className={styles.metaDot}>·</span>
                    ) : null}
                    {identity.date ? <span className={styles.date}>{identity.date}</span> : null}
                  </span>
                </span>
              </>
            );
            return identity.href ? (
              <Link href={identity.href} className={styles.identityLink}>
                {face}
              </Link>
            ) : (
              <span className={styles.identityLink}>{face}</span>
            );
          })()}
          {isXPost && source.sourceUrl ? (
            <a
              className={styles.xButton}
              href={source.sourceUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="Open the original post on X"
            >
              <XIcon />
            </a>
          ) : null}
        </header>

        <p
          ref={postRef}
          className={`${styles.postBody} ${postExpanded ? "" : styles.postBodyClamped}`}
        >
          {postText}
        </p>
        {/* Only offer More when the post actually overflows the clamp — the app
            measures the same way before it shows the control. */}
        {postTruncatable ? (
          <button
            type="button"
            className={styles.moreButton}
            onClick={() => setPostExpanded((value) => !value)}
          >
            {postExpanded ? "Show less" : "More"}
          </button>
        ) : null}

        <div className={styles.legs}>
          {visibleLegs.map((leg) => (
            <LegRow key={leg.id} leg={leg} asset={legAssets[leg.id]} onOpen={openAsset} />
          ))}
          {hiddenLegs.length > 0 ? (
            <aside
              className={styles.hiddenLegSummary}
              aria-label={`${hiddenLegs.length} more ${hiddenLegs.length === 1 ? "asset" : "assets"}`}
            >
              <span className={styles.hiddenLegStack} aria-hidden="true">
                {hiddenLegs.map((leg) => (
                  <span className={styles.hiddenLegLogo} key={leg.id}>
                    {leg.imageUrl ? (
                      <RemoteImage src={leg.imageUrl} alt="" className={styles.hiddenLegLogoImage} />
                    ) : (
                      (leg.symbol || leg.label).slice(0, 3).toUpperCase()
                    )}
                  </span>
                ))}
              </span>
              <strong>
                +{hiddenLegs.length} more {hiddenLegs.length === 1 ? "asset" : "assets"}
              </strong>
              <span className={styles.hiddenLegPnl} aria-hidden="true">
                +12.48%
              </span>
            </aside>
          ) : null}
        </div>

        <a className={styles.buyButton} href={openInApp}>
          BUY
        </a>

        {hasThesisContent ? (
          <div className={styles.thesis}>
            {thesisExpanded ? (
              <div className={styles.thesisBody}>
                {thesisDescription ? <p className={styles.thesisText}>{thesisDescription}</p> : null}
                {thesisBullets.length > 0 ? (
                  <ul className={styles.thesisBullets}>
                    {thesisBullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
            <button
              type="button"
              className={styles.showMoreButton}
              onClick={() => setThesisExpanded((value) => !value)}
            >
              {thesisExpanded ? "Show Less" : "Show More"}
              <ChevronDownIcon up={thesisExpanded} />
            </button>
          </div>
        ) : null}
        </div>

        <div className={styles.marketColumn}>
        <div className={styles.pnlRow}>
          {sandwich.pnlBasis === "underlying_move" ? (
            <span className={styles.pnlBasis}>underlying</span>
          ) : null}
          <strong
            className={`${styles.pnlValue} ${
              headlinePositive ? styles.pnlPositive : styles.pnlNegative
            }`}
          >
            {formatPnl(headlinePnl)}
          </strong>
        </div>

        <BasketChart
          className={styles.chartSection}
          points={chart.points}
          scrubIndex={scrubIndex}
          onScrubIndex={setScrubIndex}
        />

        <div className={styles.rangeRow} role="tablist" aria-label="Chart timeframe">
          {CHART_RANGES.map(({ label, range: value }) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={range === value}
              className={`${styles.rangePill} ${range === value ? styles.rangePillActive : ""}`}
              onClick={() => void selectRange(value)}
            >
              {label}
            </button>
          ))}
        </div>

        </div>
        </div>
      </div>

      <dialog
        ref={assetDialogRef}
        className={styles.assetDialog}
        aria-labelledby="asset-modal-title"
        onClose={handleAssetDialogClose}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeAsset();
        }}
      >
        {selectedAsset ? (
          <div className={styles.assetModal}>
            <header className={styles.assetModalHeader}>
              <div className={styles.assetModalIdentity}>
                <AssetLogo src={selectedAsset.imageUrl} symbol={selectedAsset.symbol} />
                <div>
                  <h2 id="asset-modal-title">{selectedAsset.name}</h2>
                  <span>{selectedAsset.symbol}</span>
                </div>
              </div>
              <button
                type="button"
                className={styles.assetModalClose}
                aria-label="Close asset details"
                onClick={closeAsset}
              >
                <CloseIcon />
              </button>
            </header>

            <div className={styles.assetModalContent}>
              <div className={styles.assetMarketCap}>
                <span>Market cap</span>
                <strong>{formatCompactUsd(selectedAsset.stats.marketCap)}</strong>
              </div>

              <div className={styles.assetChangeGrid} aria-label="Asset price changes">
                {([
                  ["1H", selectedAsset.stats.priceChange1hPercent],
                  ["24H", selectedAsset.stats.priceChange24hPercent],
                  ["7D", selectedAsset.stats.priceChange7dPercent],
                  ["30D", selectedAsset.stats.priceChange30dPercent],
                  ["3M", selectedAsset.stats.priceChange3mPercent],
                ] as const).map(([label, value]) => (
                  <div className={styles.assetChangeCell} key={label}>
                    <span>{label}</span>
                    <strong className={assetChangeClass(value)}>{formatPnl(value)}</strong>
                  </div>
                ))}
              </div>

              <section className={styles.assetAbout}>
                <h3>{`Why $${selectedAsset.symbol.replace(/^\$/, "")}?`}</h3>
                <p>
                  {selectedAsset.description || "No description available for this asset yet."}
                </p>
              </section>
            </div>
          </div>
        ) : null}
      </dialog>
    </div>
  );
}
