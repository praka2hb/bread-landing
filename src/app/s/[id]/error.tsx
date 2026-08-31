"use client";

import Link from "next/link";
import styles from "@/app/components/sandwich-web.module.css";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className={styles.shell}>
      <section className={styles.errorState}>
        <div className={styles.stateCard}>
          <h1>Couldn&apos;t load this sandwich</h1>
          <p>The market data may be temporarily unavailable. Try again or return to the leaderboard.</p>
          <div className={styles.headerActions}>
            <button type="button" className={styles.primaryLink} onClick={reset}>
              Try again
            </button>
            <Link href="/sandwiches" className={styles.secondaryLink}>
              Leaderboard
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
