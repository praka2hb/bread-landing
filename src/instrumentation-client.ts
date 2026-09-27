import posthog from "posthog-js";

// Runs after the document loads, before React hydration. Without a key set
// (local dev, previews) nothing initialises, so local traffic stays out of
// the analytics data.
const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;

if (posthogKey) {
  posthog.init(posthogKey, {
    // Proxied through our own domain (see the /ingest rewrites in
    // next.config.ts) so ad blockers don't drop the events.
    api_host: "/ingest",
    // Where the dashboard lives — only used for links out of the toolbar.
    // Swap to https://eu.posthog.com if the project is on PostHog EU cloud.
    ui_host: "https://us.posthog.com",
    defaults: "2026-08-30",
    // Pageviews on client-side navigation are captured via history changes,
    // which `defaults` already turns on.
    person_profiles: "identified_only",
  });
}
