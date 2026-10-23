"use client";

import { useEffect } from "react";
import { TESTFLIGHT_URL } from "@/lib/sandwiches";

// Long enough for iOS to switch to Bread (or for the "Open in Bread?" prompt to
// be answered); short enough that someone without the app isn't left waiting.
const FALLBACK_DELAY_MS = 2500;

/**
 * Sends an iPhone visitor on a shared link to the app, or to TestFlight.
 *
 * With Bread installed, a TAPPED https link opens the app through Universal
 * Links and this page never loads. It does load when the link is pasted into
 * Safari (Universal Links never fire from the address bar) or when the app
 * isn't installed. So we try the bread:// scheme and watch what Safari does:
 *
 *  - App installed: Safari shows "Open this page in bread?", which BLURS the
 *    page while it stays `visible`. Visibility alone can't tell, so any blur
 *    means "Bread answered" and the fallback is cancelled — whether they tap
 *    Open (lands on the sandwich) or Cancel (stays on this page).
 *  - No app: iOS silently ignores the unknown scheme; the page keeps focus,
 *    and after the delay the visitor goes to the TestFlight invite.
 *
 * (Measured in iOS 26 Safari; before this, the timer fired behind the prompt
 * and left Safari on TestFlight while the app was open.)
 *
 * Runs once per link per tab: coming Back from TestFlight must show the page,
 * not bounce again. Desktop keeps the web page.
 *
 * Android: a verified App Link opens the app before this page loads, but X and
 * other in-app browsers never hand App Links off. So we fire an intent:// URL
 * for the bread:// link; Chrome opens Bread if it's installed, otherwise it
 * loads `browser_fallback_url` — this same page — instead of the Play Store.
 */
export function AppHandoff({ appLink }: { appLink: string }) {
  useEffect(() => {
    if (/Android/i.test(navigator.userAgent)) {
      const key = `bread:handoff:${appLink}`;
      try {
        if (sessionStorage.getItem(key)) return;
        sessionStorage.setItem(key, "1");
      } catch {
        // Storage blocked: still hand off once.
      }
      window.location.href = toAndroidIntent(appLink, window.location.href);
      return;
    }

    const isIOS =
      /iPhone|iPad|iPod/.test(navigator.userAgent) ||
      // iPadOS reports itself as a Mac.
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (!isIOS) return;

    const key = `bread:handoff:${appLink}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // Storage blocked (private mode): still hand off, just without the guard.
    }

    let appResponded = false;
    const onHidden = () => {
      if (document.visibilityState === "hidden") appResponded = true;
    };
    const onResponded = () => {
      appResponded = true;
    };
    document.addEventListener("visibilitychange", onHidden);
    window.addEventListener("pagehide", onResponded);
    window.addEventListener("blur", onResponded);

    window.location.href = appLink;

    const timer = window.setTimeout(() => {
      if (!appResponded && document.visibilityState === "visible" && document.hasFocus()) {
        window.location.href = TESTFLIGHT_URL;
      }
    }, FALLBACK_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onHidden);
      window.removeEventListener("pagehide", onResponded);
      window.removeEventListener("blur", onResponded);
    };
  }, [appLink]);

  return null;
}

const ANDROID_PACKAGE = "com.breadapp.fun";

// bread://sandwich?x=1 → intent://sandwich?x=1#Intent;scheme=bread;package=…;end
function toAndroidIntent(appLink: string, fallbackUrl: string): string {
  const [scheme, rest] = appLink.split("://");
  return (
    `intent://${rest}#Intent;scheme=${scheme};package=${ANDROID_PACKAGE};` +
    `S.browser_fallback_url=${encodeURIComponent(fallbackUrl)};end`
  );
}
