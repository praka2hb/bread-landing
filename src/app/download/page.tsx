import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import styles from "./download.module.css";

/*
 * breadapp.fun/download — the one link the decks' QR codes point at.
 * A phone is sent straight to its build: iOS to TestFlight, Android to the
 * Android build. Anything else (a laptop, an unknown agent) gets a small page
 * with both, so scanning or clicking never dead-ends.
 */

const IOS_URL = "https://testflight.apple.com/join/8UAWE67D";
/** The Android build (EAS APK). NEXT_PUBLIC_ANDROID_URL overrides it. */
const ANDROID_URL =
  process.env.NEXT_PUBLIC_ANDROID_URL ||
  "https://expo.dev/artifacts/eas/gndo7_QpE6LkvtRGQtEW2dD1qiPzfzRhFpcTmvlKATI.apk";

export const metadata: Metadata = {
  title: "Get Bread",
  description: "Download Bread for iPhone or Android.",
};

export default async function DownloadPage() {
  const ua = (await headers()).get("user-agent") ?? "";
  const isIos = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && /Mobile/i.test(ua));
  const isAndroid = /Android/i.test(ua);

  if (isIos) redirect(IOS_URL);
  if (isAndroid && ANDROID_URL) redirect(ANDROID_URL);

  return (
    <main className={styles.page}>
      <img src="/deck/img/bread-icon.png" alt="" className={styles.icon} />
      <h1 className={styles.title}>Get Bread</h1>
      <p className={styles.sub}>Every financial idea on your feed, tradable in one tap.</p>
      <div className={styles.links}>
        <a className={styles.link} href={IOS_URL}>
          iPhone · TestFlight
        </a>
        {ANDROID_URL ? (
          <a className={styles.link} href={ANDROID_URL}>
            Android
          </a>
        ) : (
          <span className={`${styles.link} ${styles.soon}`}>Android · coming soon</span>
        )}
      </div>
      <a className={styles.handle} href="https://x.com/breadappfun">
        @breadappfun
      </a>
    </main>
  );
}
