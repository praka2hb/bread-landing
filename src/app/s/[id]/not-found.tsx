import Link from "next/link";
import { sandwichWebStyles as styles } from "@/app/components/sandwich-web";

export default function NotFound() {
  return (
    <main className={styles.shell}>
      <section className={styles.emptyState}>
        <div className={styles.stateCard}>
          <h1>Sandwich unavailable</h1>
          <p>This sandwich may have been removed, or the shared link may be incomplete.</p>
          <Link href="/sandwiches" className={styles.primaryLink}>
            Browse top sandwiches
          </Link>
        </div>
      </section>
    </main>
  );
}
