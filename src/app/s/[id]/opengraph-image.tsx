import { ImageResponse } from "next/og";
import { formatPercent, getSandwich } from "@/lib/sandwiches";

export const alt = "Bread sandwich thesis";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sandwich = await getSandwich(id);
  const pnl = sandwich?.pnlPct ?? null;
  const positive = (pnl ?? 0) >= 0;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: "#f4f2ed",
          color: "#111114",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 28, fontWeight: 800 }}>
          <span style={{ display: "flex", width: 18, height: 18, borderRadius: 999, background: "#dcf52b" }} />
          Bread sandwich
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ display: "flex", maxWidth: 1020, fontSize: 62, fontWeight: 850, lineHeight: 1.02, letterSpacing: -3 }}>
            {sandwich?.name ?? "A market thesis on Bread"}
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div style={{ display: "flex", color: "#66635d", fontSize: 26 }}>
              {sandwich?.legs.slice(0, 4).map((leg) => leg.symbol).join(" · ") || "Open in Bread"}
            </div>
            <div style={{ display: "flex", color: positive ? "#087f42" : "#cf176f", fontSize: 88, fontWeight: 900, letterSpacing: -6 }}>
              {formatPercent(pnl)}
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
