import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { sandwichWebStyles as styles } from "@/app/components/sandwich-web";
import { FeedCard } from "@/app/components/feed";
import {
  Avatar,
  ReadOnlyNote,
  StatGrid,
  marketAppStyles as appStyles,
} from "@/app/components/market-app";
import { getAssetSlugIndex, formatCompactUsd } from "@/lib/assets";
import { formatPercent, formatPrice } from "@/lib/sandwiches";
import {
  getSandwichesByBuilder,
  getUserByUsername,
  getUserDisplayName,
  getUserHoldings,
  getUserTrackRecord,
  shortenAddress,
} from "@/lib/users";

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const user = await getUserByUsername(username);

  if (!user) return { title: "Profile not found — Bread" };

  const name = getUserDisplayName(user);
  return {
    title: `${name} — Bread`,
    description: user.bio ?? `${name}'s sandwiches, holdings, and track record on Bread.`,
    alternates: { canonical: `/u/${user.username}` },
  };
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  const user = await getUserByUsername(username);

  if (!user) notFound();

  // The DID resolved above keys every remaining read. All three run on the
  // server and none of them is allowed to fail the page — a profile with no
  // holdings is still a profile.
  const [sandwiches, holdings, trackRecord, assetSlugs] = await Promise.all([
    getSandwichesByBuilder(user.privyUserId),
    getUserHoldings(user.privyUserId),
    getUserTrackRecord(user.privyUserId),
    getAssetSlugIndex(),
  ]);

  const displayName = getUserDisplayName(user);
  const wallet = shortenAddress(user.walletAddress);

  return (
    <main className={styles.shell}>
      <div className={`${styles.container} ${appStyles.narrow}`}>
        <section className={appStyles.profileHero}>
          <Avatar src={user.avatarUrl} name={displayName} />
          <div className={appStyles.profileCopy}>
            <h1>{displayName}</h1>
            <p className={appStyles.profileHandle}>@{user.username}</p>
            {user.bio ? <p className={appStyles.profileBio}>{user.bio}</p> : null}
            <div className={appStyles.profileCounts}>
              <span className={appStyles.profileCount}>
                <strong>{user.followerCount}</strong>{" "}
                {user.followerCount === 1 ? "follower" : "followers"}
              </span>
              <span className={appStyles.profileCount}>
                <strong>{user.followingCount}</strong> following
              </span>
              <span className={appStyles.profileCount}>
                <strong>{user.tradeCount}</strong>{" "}
                {user.tradeCount === 1 ? "trade" : "trades"}
              </span>
            </div>
            {wallet ? <span className={appStyles.walletChip}>{wallet}</span> : null}
          </div>
        </section>

        {trackRecord ? (
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>Track record</h2>
              <span>{trackRecord.openCount} open</span>
            </div>
            {trackRecord.visible ? (
              <StatGrid
                stats={[
                  { label: "Hit rate", value: formatPercent(trackRecord.hitRate) },
                  { label: "Median return", value: formatPercent(trackRecord.medianReturn) },
                  { label: "Resolved", value: String(trackRecord.resolvedCount) },
                  { label: "Open", value: String(trackRecord.openCount) },
                ]}
              />
            ) : (
              <p className={appStyles.sectionNote}>
                Not published yet — {displayName} has {trackRecord.resolvedCount} resolved{" "}
                {trackRecord.resolvedCount === 1 ? "position" : "positions"} of the{" "}
                {trackRecord.requiredForRecord} Bread requires before showing a hit rate.
              </p>
            )}
          </section>
        ) : null}

        {holdings.holdings.length > 0 ? (
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>Holdings</h2>
              <span>
                {formatCompactUsd(holdings.totalValueUsd)} in positions ·{" "}
                {formatCompactUsd(holdings.cashUsd)} cash
              </span>
            </div>
            <div>
              {holdings.holdings.map((holding) => {
                const slug = assetSlugs.get(holding.mint) ?? assetSlugs.get(holding.symbol.toUpperCase());
                const body = (
                  <>
                    <span className={appStyles.assetLogo}>
                      {holding.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={holding.image} alt="" loading="lazy" decoding="async" />
                      ) : (
                        holding.symbol.slice(0, 4)
                      )}
                    </span>
                    <span>
                      <strong>{holding.name ?? holding.symbol}</strong>
                      <small>
                        {holding.units === null
                          ? holding.symbol
                          : `${holding.units.toLocaleString("en-US", { maximumFractionDigits: 6 })} ${holding.symbol}`}
                      </small>
                    </span>
                    <span className={appStyles.numeric}>{formatPrice(holding.valueUsd)}</span>
                  </>
                );

                return slug ? (
                  <Link href={`/assets/${slug}`} className={appStyles.holdingRow} key={holding.mint}>
                    {body}
                  </Link>
                ) : (
                  <div className={appStyles.holdingRow} key={holding.mint}>
                    {body}
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        <div className={styles.sectionTopline}>
          <h2>Sandwiches built</h2>
          <span>
            {sandwiches.length} {sandwiches.length === 1 ? "thesis" : "theses"}
          </span>
        </div>

        {sandwiches.length > 0 ? (
          <section aria-label={`Sandwiches built by ${displayName}`}>
            {sandwiches.map((sandwich) => (
              <FeedCard sandwich={sandwich} key={sandwich.id} />
            ))}
          </section>
        ) : (
          <p className={`${appStyles.sectionNote} ${appStyles.bottomSpace}`}>
            {displayName}
            {" hasn’t published a sandwich yet."}
          </p>
        )}

        <ReadOnlyNote>
          Public profile data only. Following and trading happen in the Bread app.
        </ReadOnlyNote>
        <div className={appStyles.bottomSpace} />
      </div>
    </main>
  );
}
