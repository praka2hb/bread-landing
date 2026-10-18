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
