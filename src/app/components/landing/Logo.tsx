import { BRANDS, type BrandKey } from "./brands";
import styles from "./landing.module.css";

function luminance(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function mix(hex: string, to: number, t: number) {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v + (to - v) * t));
  return `rgb(${c.join(",")})`;
}

/**
 * A tactile version of the mark for the hero's floating chips: a coin for crypto,
 * a glossy beveled tile for stocks, lit from the top left.
 */
/**
 * Coins show the symbol alone. Some marks (Bitcoin) ship as a disc with the symbol
 * cut out, which would paint a flat white disc over the coin's face.
 */
const COIN_GLYPH: Partial<Record<BrandKey, string>> = {
  BTC: "M17.288 10.291c.24-1.59-.974-2.45-2.64-3.03l.54-2.153-1.315-.33-.525 2.107c-.345-.087-.705-.167-1.064-.25l.526-2.127-1.32-.33-.54 2.165c-.285-.067-.565-.132-.84-.2l-1.815-.45-.35 1.407s.975.225.955.236c.535.136.63.486.615.766l-1.477 5.92c-.075.166-.24.406-.614.314.015.02-.96-.24-.96-.24l-.66 1.51 1.71.426.93.242-.54 2.19 1.32.327.54-2.17c.36.1.705.19 1.05.273l-.51 2.154 1.32.33.545-2.19c2.24.427 3.93.257 4.64-1.774.57-1.637-.03-2.58-1.217-3.196.854-.193 1.5-.76 1.68-1.93h.01zm-3.01 4.22c-.404 1.64-3.157.75-4.05.53l.72-2.9c.896.23 3.757.67 3.33 2.37zm.41-4.24c-.37 1.49-2.662.735-3.405.55l.654-2.64c.744.18 3.137.524 2.75 2.084v.006z",
};

export function GlossyLogo({ id, size = 30, coin = false }: { id: BrandKey; size?: number; coin?: boolean }) {
  const brand = BRANDS[id];
  return (
    <span
      className={coin ? styles.glossyCoin : styles.glossyTile}
      style={{
        width: size,
        height: size,
        ["--hi" as string]: mix(brand.hex, 255, 0.45),
        ["--mid" as string]: brand.hex,
        ["--lo" as string]: mix(brand.hex, 0, 0.32),
      }}
      title={brand.title}
    >
      <svg
        viewBox="0 0 24 24"
        width={size * (coin ? 0.86 : 0.58)}
        height={size * (coin ? 0.86 : 0.58)}
        fill="currentColor"
        fillRule={coin ? "evenodd" : undefined}
        aria-hidden="true"
      >
        <path d={(coin && COIN_GLYPH[id]) || brand.path} />
      </svg>
    </span>
  );
}

/** A real brand mark on an app-icon style squircle in the brand's colour. */
export function Logo({
  id,
  size = 40,
  className,
}: {
  id: BrandKey;
  size?: number;
  className?: string;
}) {
  const brand = BRANDS[id];
  const lum = luminance(brand.hex);
  const bg = lum < 0.02 ? "#111214" : brand.hex;
  const fg = lum > 0.45 ? "#0b0b0c" : "#ffffff";
  return (
    <span
      className={`${styles.logo} ${className ?? ""}`}
      style={{ width: size, height: size, background: bg, color: fg }}
      title={brand.title}
    >
      <svg viewBox="0 0 24 24" width={size * 0.56} height={size * 0.56} fill="currentColor" aria-hidden="true">
        <path d={brand.path} />
      </svg>
    </span>
  );
}

/** Overlapping stack of logos, used for a sandwich's legs. */
export function LogoStack({ ids, size = 28 }: { ids: BrandKey[]; size?: number }) {
  return (
    <span className={styles.logoStack}>
      {ids.map((id) => (
        <Logo key={id} id={id} size={size} />
      ))}
    </span>
  );
}
