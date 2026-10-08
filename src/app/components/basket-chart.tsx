"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { BasketPoint } from "@/lib/basket-points";
import styles from "./basket-chart.module.css";

/**
 * The basket curve, as the app's `SandwichBasketChart` draws it.
 *
 * Shared by the sandwich detail screen and the episode page's call card, so a
 * call read inside its episode shows the same line as the same call read on its
 * own page. The host owns the box: pass a `className` that sets
 * `--basket-chart-height`, and the SVG reads that back off the element.
 */

const DEFAULT_HEIGHT = 160;
const PADDING_X = 10;
const PADDING_Y = 18;

/** Recent points get a time of day; older ones only need the date. */
const noopSubscribe = () => () => {};

// The axis label is in the viewer's timezone, which the server can't know — and
// Node and Safari even join the parts differently ("at" vs ","). Rendering it
// on the server guaranteed a hydration mismatch, so it renders client-only.
function useIsClient(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

function formatAxisLabel(timestamp: number): string {
  const ageMs = Date.now() - timestamp;
  if (ageMs < 3 * 24 * 60 * 60 * 1000) {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(timestamp));
  }
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
    new Date(timestamp),
  );
}

/** Catmull-Rom through the points, converted to cubic beziers. */
function buildLinePath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M${points[0].x},${points[0].y}`;

  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];
    const tension = 0.3;
    const cp1x = p1.x + ((p2.x - p0.x) * tension) / 3;
    const cp1y = p1.y + ((p2.y - p0.y) * tension) / 3;
    const cp2x = p2.x - ((p3.x - p1.x) * tension) / 3;
    const cp2y = p2.y - ((p3.y - p1.y) * tension) / 3;
    d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  return d;
}

export function BasketChart({
  points,
  onScrubIndex,
  scrubIndex,
  className = "",
}: {
  points: BasketPoint[];
  scrubIndex: number;
  onScrubIndex: (index: number) => void;
  /** Sets the box — notably `--basket-chart-height` — and the outer spacing. */
  className?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  // Both dimensions come from the element, so the layout — not this component —
  // decides how tall the chart is at each breakpoint.
  const [size, setSize] = useState({ width: 0, height: DEFAULT_HEIGHT });
  // Two charts on one page would otherwise both define `#basketDotGrid`, and
  // every `url(#…)` in the document would resolve to whichever mounted first.
  const gridId = `basketDotGrid-${useId().replace(/:/g, "")}`;

  useEffect(() => {
    const node = wrapRef.current;
    if (!node) return;
    const read = (rect: { width: number; height: number }) =>
      setSize({ width: rect.width, height: Math.max(rect.height, 1) });
    const observer = new ResizeObserver(([entry]) => read(entry.contentRect));
    observer.observe(node);
    read(node.getBoundingClientRect());
    return () => observer.disconnect();
  }, []);

  const { width, height } = size;

  // A minimum 2% visible range keeps a flat or brand-new basket from being
  // amplified into noise; the 15% padding keeps the line off the edges.
  const stats = useMemo(() => {
    if (points.length === 0) return { baseline: 100, highest: 101, spread: 2 };
    const values = points.map((point) => point.index);
    const highest = Math.max(...values, 100);
    const lowest = Math.min(...values, 100);
    const spread = Math.max(highest - lowest, 2);
    const padding = spread * 0.15;
    return { baseline: 100, highest: highest + padding, spread: spread + padding * 2 };
  }, [points]);

  const chartPoints = useMemo(() => {
    const plotWidth = Math.max(width - PADDING_X * 2, 1);
    const plotHeight = height - PADDING_Y * 2;
    return points.map((point, index) => ({
      x: PADDING_X + (plotWidth * index) / Math.max(points.length - 1, 1),
      y: PADDING_Y + ((stats.highest - point.index) / stats.spread) * plotHeight,
    }));
  }, [height, points, stats, width]);

  const baselineY =
    PADDING_Y + ((stats.highest - stats.baseline) / stats.spread) * (height - PADDING_Y * 2);
  const linePath = useMemo(() => buildLinePath(chartPoints), [chartPoints]);
  const lastPoint = chartPoints[chartPoints.length - 1] ?? null;
  const selected = scrubIndex >= 0 ? (chartPoints[scrubIndex] ?? null) : null;
  const displayPoint = points[scrubIndex >= 0 ? scrubIndex : points.length - 1] ?? null;
  const isClient = useIsClient();
  const positive = (displayPoint?.returnPct ?? 0) >= 0;

  const handlePointer = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (points.length === 0 || width === 0) return;
      const rect = event.currentTarget.getBoundingClientRect();
      const plotWidth = Math.max(rect.width - PADDING_X * 2, 1);
      const ratio = (event.clientX - rect.left - PADDING_X) / plotWidth;
      const index = Math.round(ratio * (points.length - 1));
      onScrubIndex(Math.max(0, Math.min(points.length - 1, index)));
    },
    [onScrubIndex, points.length, width],
  );

  return (
    <div className={`${styles.section} ${className}`}>
      <div
        ref={wrapRef}
        className={styles.wrap}
        onPointerMove={handlePointer}
        onPointerDown={handlePointer}
        onPointerLeave={() => onScrubIndex(-1)}
      >
        {width > 0 ? (
          <svg
            className={styles.svg}
            width="100%"
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label="Basket performance since the thesis was created"
          >
            <defs>
              <pattern id={gridId} x="0" y="0" width="18" height="18" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="1" fill="var(--app-chart-crosshair)" fillOpacity="0.1" />
              </pattern>
            </defs>
            <rect x="0" y="0" width={width} height={height} fill={`url(#${gridId})`} />
            <line
              x1="0"
              x2={width}
              y1={baselineY}
              y2={baselineY}
              stroke="var(--app-chart-crosshair)"
              strokeOpacity="0.14"
              strokeWidth="1.5"
              strokeDasharray="2 7"
              strokeLinecap="round"
            />
            {linePath ? (
              <path
                className={styles.line}
                d={linePath}
                fill="none"
                stroke={positive ? "var(--app-chart-positive)" : "var(--app-negative)"}
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength={1}
              />
            ) : null}
            {lastPoint ? (
              <>
                <circle
                  cx={lastPoint.x}
                  cy={lastPoint.y}
                  r="5"
                  fill={positive ? "var(--app-chart-positive)" : "var(--app-negative)"}
                />
                <circle cx={lastPoint.x} cy={lastPoint.y} r="3" fill="#ffffff" />
              </>
            ) : null}
            {selected && scrubIndex < points.length - 1 ? (
              <circle
                cx={selected.x}
                cy={selected.y}
                r="5"
                fill={positive ? "var(--app-chart-positive)" : "var(--app-negative)"}
                stroke="#ffffff"
                strokeWidth="2"
              />
            ) : null}
          </svg>
        ) : null}
      </div>
      <div className={styles.footer}>
        <span>{isClient && displayPoint ? formatAxisLabel(displayPoint.timestamp) : ""}</span>
        <span>Since created</span>
      </div>
    </div>
  );
}
