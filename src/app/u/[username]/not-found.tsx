import Link from "next/link";
import { sandwichWebStyles as styles } from "@/app/components/sandwich-web";

export default function NotFound() {
  return (
    <main className={styles.shell}>
      <section className={styles.emptyState}>
        <div className={styles.stateCard}>
          <h1>Profile unavailable</h1>
          <p>No Bread account uses this handle. It may have been changed, or the account removed.</p>
          <Link href="/sandwiches" className={styles.primaryLink}>
            Browse top sandwiches
          </Link>
        </div>
      </section>
    </main>
  );
}
