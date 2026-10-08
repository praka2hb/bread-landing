// Digital Asset Links: tells Android that the Bread app owns
// https://breadapp.fun, so /s/* App Links open the app (`autoVerify`) and
// Solana Mobile wallets can verify the MWA identity `uri` against the APK's
// signing certificate. Served from the exact domain, no redirects.
//
// ANDROID_SHA256_CERT_FINGERPRINTS is a comma-separated list of SHA-256 signing
// cert fingerprints ("AA:BB:..."). List every key that signs a shipped build:
// the Play app-signing key AND the separate Solana dApp Store key.
const PACKAGE_NAME = "com.breadapp.fun";

export const dynamic = "force-static";

export function GET() {
  const fingerprints = (process.env.ANDROID_SHA256_CERT_FINGERPRINTS ?? "")
    .split(",")
    .map((value) => value.trim().toUpperCase())
    .filter((value) => /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/.test(value));

  const statements = fingerprints.length
    ? [
        {
          relation: [
            "delegate_permission/common.handle_all_urls",
            "delegate_permission/common.get_login_creds",
          ],
          target: {
            namespace: "android_app",
            package_name: PACKAGE_NAME,
            sha256_cert_fingerprints: fingerprints,
          },
        },
      ]
    : [];

  return Response.json(statements, {
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}
