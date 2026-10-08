import Image from "next/image";
import Link from "next/link";
import { TESTFLIGHT_URL } from "@/lib/sandwiches";
import styles from "./home-navbar.module.css";

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.24 2.25h3.31l-7.23 8.26 8.51 11.24h-6.66l-5.21-6.82-5.97 6.82H1.68l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23Zm-1.16 17.52h1.83L7.08 4.13H5.12l11.96 15.64Z" />
    </svg>
  );
}

export function HomeNavbar() {
  return (
    <header className={styles.header}>
      <nav className={styles.inner} aria-label="Primary navigation">
        <Link href="/" className={styles.brand} aria-label="Bread home">
          <Image
            src="/logo.png"
            alt=""
            width={494}
            height={477}
            priority
            className={styles.logo}
          />
        </Link>

        <a
          href="https://x.com/breadappfun"
          className={styles.socialLink}
          target="_blank"
          rel="noreferrer"
          aria-label="Bread on X"
        >
          <XIcon />
        </a>

        <div className={styles.testflightCta}>
          <a
            href={TESTFLIGHT_URL}
            className={styles.testflightLink}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Join Bread on TestFlight"
          >
            <span>JOIN TESTFLIGHT</span>
          </a>

          <span className={styles.testflightPopover} aria-hidden="true">
            <span className={styles.qrFrame}>
              <Image
                src="/testflight-qr.svg"
                alt=""
                width={198}
                height={198}
                className={styles.qrCode}
              />
            </span>
            <span className={styles.popoverCopy}>Scan to get Bread</span>
          </span>
        </div>
      </nav>
    </header>
  );
}
