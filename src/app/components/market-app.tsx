import type { ReactNode } from "react";
import styles from "./market-app.module.css";
import sandwichStyles from "./sandwich-web.module.css";

/**
 * Remote logos come from a handful of upstream CDNs (tokens.xyz, backpack,
 * r2.dev, unavatar) that are not in next.config's image allowlist, so these use
 * a plain <img>. Sizes are fixed by CSS and every one has a text fallback.
 */
function RemoteImage({ src, alt }: { src: string | null; alt: string }) {
  if (!src) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" decoding="async" />;
}

export function AssetLogo({
  src,
  symbol,
  variant = "row",
}: {
  src: string | null;
  symbol: string;
  variant?: "row" | "hero";
}) {
  return (
    <span className={variant === "hero" ? styles.assetHeroLogo : styles.assetLogo}>
      {src ? <RemoteImage src={src} alt="" /> : symbol.slice(0, 4)}
    </span>
  );
}

/* ── Asset sheet ───────────────────────────────────────────────────────────
 * The asset page is the app's stock detail sheet on the web: same identity
 * row, same dotted-leader stat rows, same green BUY bar. Ported from
 * bread-mobile/src/components/stock-detail-sheet.tsx.
 */

export function AssetIdentity({
  logo,
  name,
  symbol,
  price,
  change,
  changeTone,
}: {
  logo: ReactNode;
  name: string;
  symbol: string;
  price: string;
  change: string;
  changeTone: "up" | "down" | "flat";
}) {
  return (
    <div className={styles.identityRow}>
      {logo}
      <div className={styles.identityCopy}>
        <h1>{name}</h1>
        <p>{symbol}</p>
      </div>
      <div className={styles.identityPrice}>
        <strong>{price}</strong>
        <span
          className={
            changeTone === "up"
              ? styles.changeUp
              : changeTone === "down"
                ? styles.changeDown
                : styles.changeFlat
          }
        >
          {change}
        </span>
      </div>
    </div>
  );
}

/** The app's window strip: a labelled cell per timeframe, the live one lit. */
export function ChangeStrip({
  windows,
}: {
  windows: { label: string; value: string; tone: "up" | "down" | "flat"; active?: boolean }[];
}) {
  return (
    <div className={styles.changeStrip}>
      {windows.map((window) => (
        <div
          className={`${styles.changeCell} ${window.active ? styles.changeCellActive : ""}`}
          key={window.label}
        >
          <span className={styles.changeCellLabel}>{window.label}</span>
          <strong
            className={
              window.tone === "up"
                ? styles.changeUp
                : window.tone === "down"
                  ? styles.changeDown
                  : styles.changeFlat
            }
          >
            {window.value}
          </strong>
        </div>
      ))}
    </div>
  );
}

/** A section under a tab-weight heading — the sheet's About / Holders rhythm. */
export function SheetSection({
  title,
  meta,
  children,
}: {
  title: string;
  meta?: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.sheetSection}>
      <div className={styles.sheetSectionHead}>
        <h2>{title}</h2>
        {meta ? <span>{meta}</span> : null}
      </div>
      {children}
    </section>
  );
}

/** `label ········· value` rows, drawn straight on the sheet with no card. */
export function StatList({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <div>
      {rows.map((row) => (
        <div className={styles.leaderRow} key={row.label}>
          <span className={styles.leaderLabel}>{row.label}</span>
          <span className={styles.leaderDots} aria-hidden="true" />
          <span className={styles.leaderValue}>{row.value}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * The sheet's floating BUY bar. The web cannot place an order, so the button
 * hands off to the app rather than pretending to be a trade control.
 */
export function BuyBar({ symbol }: { symbol: string }) {
  return (
    <div className={styles.buyBar}>
      <a href="bread://sandwich" className={styles.buyButton}>
        BUY {symbol}
      </a>
      <span className={styles.buyNote}>Opens Bread — trading happens in the app</span>
    </div>
  );
}

export function StatGrid({
  stats,
}: {
  stats: { label: string; value: string }[];
}) {
  return (
    <dl className={styles.statGrid}>
      {stats.map((stat) => (
        <div className={styles.stat} key={stat.label}>
          <dt>{stat.label}</dt>
          <dd>{stat.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function PageHead({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className={styles.pageHead}>
      <div>
        <span className={sandwichStyles.eyebrow}>
          <span className={sandwichStyles.eyebrowDot} aria-hidden="true" />
          {eyebrow}
        </span>
        <h1>{title}</h1>
      </div>
      {children ? <p>{children}</p> : null}
    </section>
  );
}

/**
 * Says plainly what this surface is. The app is where trading happens; without
 * this a visitor reasonably reads a missing buy button as a broken page.
 */
export function ReadOnlyNote({ children }: { children: ReactNode }) {
  return (
    <p className={styles.readOnlyBanner}>
      <strong>Read-only.</strong>
      {children}
    </p>
  );
}

export function Avatar({ src, name }: { src: string | null; name: string }) {
  return (
    <span className={styles.avatar}>
      {src ? <RemoteImage src={src} alt="" /> : name.slice(0, 1).toUpperCase()}
    </span>
  );
}

export { styles as marketAppStyles };
