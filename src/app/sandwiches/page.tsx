import type { Metadata } from "next";
import { sandwichWebStyles as styles } from "@/app/components/sandwich-web";
import {
  ComposeFab,
  FeedCard,
  FeedTabs,
  VideoGroupCard,
  feedStyles,
} from "@/app/components/feed";
import {
  buildFeedItems,
  filterSandwichesByPeriod,
  getTopSandwiches,
  parseSandwichPeriod,
} from "@/lib/sandwiches";

export const metadata: Metadata = {
  title: "For You — Bread",
  description: "The Bread community's market theses, ranked by live return since creation.",
};

type Props = {
  searchParams: Promise<{ period?: string }>;
};

const emptyCopy = {
  hot: "No profitable sandwiches were created in the last 7 days.",
  "last-month": "No priced theses were created in the last 30 days.",
} as const;

export default async function SandwichesPage({ searchParams }: Props) {
  const { period: requestedPeriod } = await searchParams;
  const period = parseSandwichPeriod(requestedPeriod);
  const sandwiches = await getTopSandwiches();
  const filteredSandwiches = filterSandwichesByPeriod(sandwiches, period);
  // One video is one post. Eleven calls built from the same episode arrive as
  // eleven rows and would otherwise read as eleven unrelated theses posted in
  // the same minute; grouped, they are one card that opens the episode.
  const items = buildFeedItems(filteredSandwiches);

  return (
    <main className={styles.shell}>
      <div className={styles.container}>
        <div className={feedStyles.feed}>
          <FeedTabs period={period} />

          {items.length > 0 ? (
            <section aria-label="Sandwich feed">
              {items.map((item) =>
                item.kind === "video" ? (
                  <VideoGroupCard
                    video={item.video}
                    sandwiches={item.sandwiches}
                    key={item.key}
                  />
                ) : (
                  <FeedCard sandwich={item.sandwich} key={item.key} />
                ),
              )}
            </section>
          ) : (
            <section className={styles.emptyState}>
              <div className={styles.stateCard}>
                <h2>Nothing priced yet</h2>
                <p>{emptyCopy[period]}</p>
                <a href="bread://sandwich" className={styles.primaryLink}>
                  Open Bread
                </a>
              </div>
            </section>
          )}
        </div>
      </div>
      <ComposeFab />
    </main>
  );
}
