import Link from "next/link";
import { sandwichWebStyles as styles } from "@/app/components/sandwich-web";

export default function NotFound() {
  return (
    <main className={styles.shell}>
      <section className={styles.emptyState}>
        <div className={styles.stateCard}>
          <h1>Episode unavailable</h1>
          <p>
            Bread has no calls on file for this video. It may have produced none, or the link
            may point at a video nobody has run through Bread yet.
          </p>
          <Link href="/sandwiches" className={styles.primaryLink}>
            Back to For You
          </Link>
        </div>
      </section>
    </main>
  );
}
