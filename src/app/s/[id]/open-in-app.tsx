"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * Tries to hand off to the native app via the bread:// scheme. On a real device
 * with Bread installed, the OS intercepts the navigation and opens the app on
 * the shared sandwich. If nothing handles it (no app / desktop), we stay on this
 * web page — so the button doubles as a manual "Open in app" and a download CTA.
 *
 * We attempt the handoff once on mount (most messengers open links in an in-app
 * browser where a user gesture already happened), and also expose the button for
 * an explicit retry. Note: once Universal Links are configured, the https share
 * URL itself will open the app directly and this bounce becomes a no-op fallback.
 */
export function OpenInApp({ appLink }: { appLink: string }) {
  const [tried, setTried] = useState(false);

  useEffect(() => {
    // Defer slightly so the page paints (and the preview/OG is already resolved)
    // before we attempt the scheme jump.
    const t = setTimeout(() => {
      setTried(true);
      window.location.href = appLink;
    }, 600);
    return () => clearTimeout(t);
  }, [appLink]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <a
        href={appLink}
        onClick={() => setTried(true)}
        className="inline-flex items-center justify-center rounded-full bg-navy px-7 py-3.5 text-base font-semibold text-white transition hover:opacity-90"
      >
        Open in Bread
      </a>
      <Link
        href="/"
        className="inline-flex items-center justify-center rounded-full border border-border bg-card px-7 py-3.5 text-base font-semibold text-navy transition hover:bg-soft"
      >
        {tried ? "Don’t have the app? Get Bread" : "Get the app"}
      </Link>
    </div>
  );
}
