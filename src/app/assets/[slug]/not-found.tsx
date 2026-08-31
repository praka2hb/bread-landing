import Link from "next/link";
import { sandwichWebStyles as styles } from "@/app/components/sandwich-web";

export default function NotFound() {
  return (
    <main className={`${styles.shell} ${styles.sheet}`}>
      <section className={styles.emptyState}>
        <div className={styles.stateCard}>
          <h1>Asset unavailable</h1>
          <p>
            Bread has no market data for this asset. It may have been delisted, or the link may
            use a ticker rather than an asset id.
          </p>
          <Link href="/sandwiches" className={styles.primaryLink}>
            Back to sandwiches
          </Link>
        </div>
      </section>
    </main>
  );
}
