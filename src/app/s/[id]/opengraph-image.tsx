import { ImageResponse } from "next/og";

import { getSandwich, type SandwichLeg } from "./sandwich";

// X (Twitter), iMessage, WhatsApp etc. crawl this route for the link-preview
// image. We render the *thesis* — the sandwich name + summary + its basket —
// into a 1200×630 card (X's `summary_large_image` ratio) so the unfurl shows the
// idea itself, not a bare domain. Paired with `twitter.card = summary_large_image`
// in the page's generateMetadata, which Next wires to this file automatically.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Bread Sandwich thesis";
// Match the page's cache window so a viral link doesn't re-render per request.
export const revalidate = 300;

const NAVY = "#10223d";
const ACCENT = "#20e600";
const LIGHT = "#eaf0f7";
const MUTED = "#9fb0c7";

function clamp(text: string, max: number): string {
  const t = text.trim();
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
}

function legChip(leg: SandwichLeg): string {
  const ticker = leg.symbol ?? leg.underlyingSymbol ?? leg.label;
  const pct = `${(leg.weightBps / 100).toFixed(leg.weightBps % 100 === 0 ? 0 : 1)}%`;
  const short = leg.side?.toLowerCase() === "short" ? "↓ " : "";
  return `${short}${clamp(ticker, 12)} · ${pct}`;
}

type ImageParams = { params: Promise<{ id: string }> };

export default async function Image({ params }: ImageParams) {
  const { id } = await params;
  const sandwich = await getSandwich(id);

  const name = sandwich ? clamp(sandwich.name, 84) : "Bread Sandwich";
  const summary = sandwich?.summary
    ? clamp(sandwich.summary, 190)
    : "A sandwich portfolio on Bread. Open in the app to invest.";
  const pnl = sandwich?.pnlPct ?? null;
  const pnlPositive = (pnl ?? 0) >= 0;
  const legs = (sandwich?.legs ?? []).slice(0, 5);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          backgroundImage: `linear-gradient(150deg, ${NAVY}, #243a5e)`,
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        {/* Header: brand eyebrow + PnL pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: ACCENT,
              }}
            />
            <div
              style={{
                fontSize: 30,
                fontWeight: 700,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: ACCENT,
              }}
            >
              Bread Sandwich
            </div>
          </div>
          {pnl !== null ? (
            <div
              style={{
                display: "flex",
                fontSize: 32,
                fontWeight: 700,
                padding: "12px 26px",
                borderRadius: 999,
                color: pnlPositive ? ACCENT : "#ff5fa2",
                backgroundColor: pnlPositive
                  ? "rgba(32,230,0,0.14)"
                  : "rgba(255,45,135,0.16)",
              }}
            >
              {`${pnlPositive ? "+" : ""}${pnl.toFixed(2)}%`}
            </div>
          ) : null}
        </div>

        {/* Thesis: name + summary */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: 8 }}>
          <div
            style={{
              fontSize: 66,
              fontWeight: 800,
              lineHeight: 1.04,
              color: "#ffffff",
            }}
          >
            {name}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 30,
              lineHeight: 1.35,
              marginTop: 26,
              color: LIGHT,
            }}
          >
            {summary}
          </div>
        </div>

        {/* Basket legs + wordmark */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 26,
          }}
        >
          {legs.length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
              {legs.map((leg) => (
                <div
                  key={leg.id}
                  style={{
                    display: "flex",
                    fontSize: 26,
                    fontWeight: 600,
                    padding: "12px 22px",
                    borderRadius: 999,
                    color: LIGHT,
                    backgroundColor: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.16)",
                  }}
                >
                  {legChip(leg)}
                </div>
              ))}
            </div>
          ) : null}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 26,
              color: MUTED,
            }}
          >
            <div style={{ display: "flex" }}>breadapp.fun</div>
            {legs.length > 0 ? (
              <div style={{ display: "flex" }}>
                {`${sandwich?.legs.length ?? legs.length} positions`}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
