import type { ReactNode } from "react";
import styles from "./legal.module.css";

/*
 * Shared shell for /terms and /privacy. Both are linked from the iOS app
 * (Settings and the sign-in screen) and from App Store Connect, so they must
 * stay reachable at those exact paths.
 */

export const LEGAL_CONTACT_EMAIL = "breadapp.live@gmail.com";
export const LEGAL_LAST_UPDATED = "October 31, 2026";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className={styles.page}>
      <article className={styles.inner}>
        <a className={styles.back} href="/">
          ← Bread
        </a>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.updated}>Last updated {LEGAL_LAST_UPDATED}</p>
        {children}
      </article>
    </main>
  );
}
