"use client";

import { useEffect, useRef, useState } from "react";

export function ScrollScale({
  children,
  range = 0.12,
  className = "",
}: {
  children: React.ReactNode;
  range?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1 - range);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight || 1;
        // progress: 0 when bottom of el at bottom of viewport, 1 when top of el at top
        const total = rect.height + vh;
        const traveled = vh - rect.top;
        const p = Math.max(0, Math.min(1, traveled / total));
        // ease in-out: scale from (1-range) → 1 → (1-range*0.3)
        const s =
          p < 0.5
            ? 1 - range + (range) * (p / 0.5)
            : 1 - range * 0.3 * ((p - 0.5) / 0.5);
        setScale(s);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [range]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        transform: `scale(${scale})`,
        transition: "transform 60ms linear",
        willChange: "transform",
      }}
    >
      {children}
    </div>
  );
}

export function StickyFeatures({
  items,
}: {
  items: {
    eyebrow: string;
    title: string;
    body: string;
    image: string;
  }[];
}) {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const panels = section.querySelectorAll<HTMLElement>("[data-panel]");
        const vh = window.innerHeight || 1;
        const focus = vh * 0.5;
        let best = 0;
        let bestDist = Infinity;
        panels.forEach((p, i) => {
          const r = p.getBoundingClientRect();
          const center = r.top + r.height / 2;
          const dist = Math.abs(center - focus);
          if (dist < bestDist) {
            bestDist = dist;
            best = i;
          }
        });
        setActive(best);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <>
      {/* Mobile: stacked cards, each with inline image */}
      <div className="mx-auto flex max-w-md flex-col gap-16 px-6 lg:hidden">
        {items.map((it, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-accent-deep/30 bg-accent/15 px-3 py-1 text-xs font-medium uppercase tracking-wider text-accent-deep">
              <span className="font-mono">0{i + 1}</span>
              <span>{it.eyebrow}</span>
            </div>
            <h3 className="text-center text-3xl font-semibold leading-[1.1] tracking-tight text-navy sm:text-4xl">
              {it.title}
            </h3>
            <p className="mt-4 max-w-md text-center text-base leading-relaxed text-muted">
              {it.body}
            </p>
            <div className="mt-8 phone-frame w-[240px] glow-soft sm:w-[280px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={it.image} alt={it.title} className="block h-auto w-full" />
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: sticky split */}
      <div
        ref={sectionRef}
        className="relative mx-auto hidden max-w-6xl grid-cols-2 gap-20 px-6 lg:grid"
      >
        <div>
          <div className="flex flex-col">
            {items.map((it, i) => (
              <div
                key={i}
                data-panel
                className="flex min-h-[80vh] flex-col justify-center py-12"
              >
                <div
                  className={`mb-5 inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wider transition ${
                    active === i
                      ? "border-accent-deep/30 bg-accent/15 text-accent-deep"
                      : "border-border bg-card text-muted"
                  }`}
                >
                  <span className="font-mono">0{i + 1}</span>
                  <span>{it.eyebrow}</span>
                </div>
                <h3 className="max-w-md text-4xl font-semibold leading-[1.1] tracking-tight text-navy sm:text-5xl">
                  {it.title}
                </h3>
                <p className="mt-5 max-w-md text-lg leading-relaxed text-muted">
                  {it.body}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="sticky top-0 flex h-screen items-center justify-center">
            <div className="relative h-[640px] w-[300px]">
              {items.map((it, i) => {
                const isActive = active === i;
                const offset = i - active;
                return (
                  <div
                    key={i}
                    className="absolute inset-0 transition-all duration-500 ease-out"
                    style={{
                      opacity: isActive ? 1 : 0,
                      transform: `translateY(${offset * 24}px) scale(${
                        isActive ? 1 : 0.94
                      })`,
                      pointerEvents: isActive ? "auto" : "none",
                    }}
                  >
                    <div className="phone-frame h-full w-full glow-soft">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={it.image}
                        alt={it.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                );
              })}
              <div className="absolute -right-10 top-1/2 flex -translate-y-1/2 flex-col gap-2">
                {items.map((_, i) => (
                  <div
                    key={i}
                    className={`h-8 w-1 rounded-full transition ${
                      active === i ? "bg-accent" : "bg-border"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
