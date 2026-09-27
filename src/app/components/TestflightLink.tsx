"use client";

import posthog from "posthog-js";
import type { ReactNode } from "react";

export function TestflightLink({
  className,
  href,
  location,
  children,
}: {
  className: string;
  href: string;
  location: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      className={className}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Join Bread on TestFlight"
      onClick={() => posthog.capture("testflight_cta_clicked", { location })}
    >
      {children}
    </a>
  );
}
