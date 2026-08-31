"use client";

import styles from "@/app/components/sandwich-web.module.css";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className={styles.shell}>
      <section className={styles.errorState}>
        <div className={styles.stateCard}>
          <h1>Couldn&apos;t load the leaderboard</h1>
          <p>This is usually a short network hiccup. Try loading the sandwiches again.</p>
          <button type="button" className={styles.primaryLink} onClick={reset}>
            Try again
          </button>
        </div>
      </section>
    </main>
  );
}
