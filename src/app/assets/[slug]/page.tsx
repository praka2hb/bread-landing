import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { sandwichWebStyles as styles } from "@/app/components/sandwich-web";
import {
  AssetIdentity,
  AssetLogo,
  BuyBar,
  ChangeStrip,
  SheetSection,
  StatList,
  marketAppStyles as appStyles,
} from "@/app/components/market-app";
import { getAsset, formatCompactNumber, formatCompactUsd } from "@/lib/assets";
import { formatPercent, formatPrice } from "@/lib/sandwiches";

type Props = { params: Promise<{ slug: string }> };

/** Green up, magenta down, grey flat — the app's `changeColor`. */
function tone(value: number | null): "up" | "down" | "flat" {
  if (value === null || value === 0) return "flat";
  return value > 0 ? "up" : "down";
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const asset = await getAsset(slug);

  if (!asset) return { title: "Asset not found — Bread" };

  return {
    title: `${asset.name} (${asset.symbol}) — Bread`,
    description: `Live price, volume, and risk breakdown for ${asset.name} on Bread.`,
    alternates: { canonical: `/assets/${asset.assetId}` },
  };
}

export default async function AssetPage({ params }: Props) {
  const { slug } = await params;
  const asset = await getAsset(slug);

  if (!asset) notFound();

  const { stats } = asset;
  const change24h = stats.priceChange24hPercent;
  const change1h = stats.priceChange1hPercent;

  // The page takes the move's hue, as the app's sheet does.
  const wash =
    change24h === null || change24h === 0
      ? styles.sheetFlat
      : change24h > 0
        ? styles.sheetUp
        : styles.sheetDown;

  return (
    <main className={`${styles.shell} ${styles.sheet} ${wash}`}>
      <div className={`${styles.container} ${appStyles.narrow} ${appStyles.assetSheet}`}>
        <Link href="/sandwiches" className={styles.backLink}>
          ← Sandwiches
        </Link>

        <AssetIdentity
          logo={<AssetLogo src={asset.imageUrl} symbol={asset.symbol} variant="hero" />}
          name={asset.name}
          symbol={asset.symbol}
          price={formatPrice(stats.price)}
          change={formatPercent(change24h)}
          changeTone={tone(change24h)}
        />

        <ChangeStrip
          windows={[
            { label: "1H", value: formatPercent(change1h), tone: tone(change1h) },
            { label: "24H", value: formatPercent(change24h), tone: tone(change24h), active: true },
          ]}
        />

        <SheetSection title="About" meta={asset.category ?? undefined}>
          {asset.description ? (
            <p className={appStyles.aboutText}>{asset.description}</p>
          ) : (
            <p className={appStyles.aboutEmpty}>
              No description available for this asset yet.
            </p>
          )}
        </SheetSection>

        <SheetSection title="Stats">
          <StatList
            rows={[
              { label: "Market cap", value: formatCompactUsd(stats.marketCap) },
              { label: "FDV", value: formatCompactUsd(stats.fdv) },
              { label: "Liquidity", value: formatCompactUsd(stats.liquidity) },
              { label: "24h volume", value: formatCompactUsd(stats.volume24hUSD) },
              { label: "30d volume", value: formatCompactUsd(stats.volume30dUSD) },
              { label: "Circulating", value: formatCompactNumber(stats.circulatingSupply) },
              { label: "Total supply", value: formatCompactNumber(stats.totalSupply) },
            ]}
          />
        </SheetSection>


        <BuyBar symbol={asset.symbol} />
      </div>
    </main>
  );
}
