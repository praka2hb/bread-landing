// Universal Links: tells iOS that Bread owns https://breadapp.fun/s/*, so a
// tapped share link opens the app instead of this site. Apple fetches it
// without following redirects, so it must be served from the exact domain in
// the app's `associatedDomains`.
//
// APPLE_APP_ID_PREFIX is the Team ID, or the full "<TeamID>.<bundleId>" app ID.
const BUNDLE_ID = "com.breadapp.fun";

export const dynamic = "force-static";

export function GET() {
  const prefix = process.env.APPLE_APP_ID_PREFIX?.trim() || "REPLACE_WITH_APPLE_TEAM_ID";
  const appID = prefix.endsWith(`.${BUNDLE_ID}`) ? prefix : `${prefix}.${BUNDLE_ID}`;

  return Response.json(
    {
      applinks: {
        details: [{ appIDs: [appID], components: [{ "/": "/s/*" }] }],
      },
    },
    { headers: { "Cache-Control": "public, max-age=3600" } },
  );
}
