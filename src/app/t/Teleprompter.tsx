"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SCRIPT, TOTAL_SECS } from "./script";
import styles from "./teleprompter.module.css";

/*
 * A teleprompter for the pitch.
 *   → / space / click   next section      ←   previous
 *   A  auto-scroll   + / −  speed   ↑ / ↓  text size
 *   M  mirror (for teleprompter glass)   F  full screen   R  reset timers
 */

const clock = (s: number) => {
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
};

/** One paragraph, with [click] cues drawn as pills. */
function Line({ text }: { text: string }) {
  return (
    <p className={styles.para}>
      {text.split(/(\[click\])/g).map((seg, i) =>
        seg === "[click]" ? (
          <span key={i} className={styles.click}>
            click
          </span>
        ) : (
          <span key={i}>{seg}</span>
        ),
      )}
    </p>
  );
}

export function Teleprompter() {
  const [at, setAt] = useState(0);
  const [size, setSize] = useState(56);
  const [mirror, setMirror] = useState(false);
  const [auto, setAuto] = useState(false);
  const [speed, setSpeed] = useState(40); // px per second
  const [started, setStarted] = useState<number | null>(null);
  const [sectionAt, setSectionAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const scroller = useRef<HTMLDivElement | null>(null);
  const refs = useRef<(HTMLElement | null)[]>([]);

  // timers start on the first move
  const go = useCallback((i: number) => {
    const next = Math.max(0, Math.min(SCRIPT.length - 1, i));
    const t = Date.now();
    setStarted((s) => s ?? t);
    setSectionAt(t);
    setAt(next);
  }, []);

  // keep the current section near the top third
  useEffect(() => {
    if (auto) return;
    const el = refs.current[at];
    const box = scroller.current;
    if (el && box) box.scrollTo({ top: el.offsetTop - box.clientHeight * 0.28, behavior: "smooth" });
  }, [at, auto]);

  // clocks
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  // auto-scroll, and follow which section is under the reading line
  useEffect(() => {
    if (!auto) return;
    let raf = 0;
    let last = performance.now();
    const step = (t: number) => {
      const box = scroller.current;
      if (box) {
        box.scrollTop += (speed * (t - last)) / 1000;
        const line = box.scrollTop + box.clientHeight * 0.3;
        let cur = 0;
        refs.current.forEach((el, i) => {
          if (el && el.offsetTop <= line) cur = i;
        });
        setAt((a) => {
          if (a !== cur) setSectionAt(Date.now());
          return cur;
        });
      }
      last = t;
      raf = requestAnimationFrame(step);
    };
    setStarted((s) => s ?? Date.now());
    setSectionAt((s) => s ?? Date.now());
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [auto, speed]);

  // keys
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key;
      if (k === "ArrowRight" || k === " " || k === "PageDown" || k === "Enter") {
        e.preventDefault();
        go(at + 1);
      } else if (k === "ArrowLeft" || k === "PageUp" || k === "Backspace") {
        e.preventDefault();
        go(at - 1);
      } else if (k === "ArrowUp") {
        e.preventDefault();
        setSize((s) => Math.min(120, s + 4));
      } else if (k === "ArrowDown") {
        e.preventDefault();
        setSize((s) => Math.max(28, s - 4));
      } else if (k === "a" || k === "A") setAuto((v) => !v);
      else if (k === "+" || k === "=") setSpeed((v) => Math.min(200, v + 10));
      else if (k === "-" || k === "_") setSpeed((v) => Math.max(10, v - 10));
      else if (k === "m" || k === "M") setMirror((v) => !v);
      else if (k === "r" || k === "R") {
        setStarted(null);
        setSectionAt(null);
      } else if (k === "f" || k === "F") {
        if (document.fullscreenElement) document.exitFullscreen();
        else document.documentElement.requestFullscreen();
      } else if (k === "Home") go(0);
      else if (k === "End") go(SCRIPT.length - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [at, go]);

  const total = started ? (now - started) / 1000 : 0;
  const inSection = sectionAt ? (now - sectionAt) / 1000 : 0;
  const target = SCRIPT[at].secs;
  const over = inSection > target;

  return (
    <div className={styles.root}>
      {/* status bar */}
      <header className={styles.bar}>
        <span className={styles.brand}>bread · pitch</span>
        <span>
          {at + 1}/{SCRIPT.length} <b className={styles.dim}>{SCRIPT[at].title}</b>
        </span>
        <span className={over ? styles.over : undefined}>
          section {clock(inSection)} / {clock(target)}
        </span>
        <span>
          total {clock(total)} / {clock(TOTAL_SECS)}
        </span>
        <span className={styles.dim}>{auto ? `auto ${speed}px/s` : "manual"}{mirror ? " · mirrored" : ""}</span>
      </header>

      <div className={styles.progress}>
        <div className={styles.fill} style={{ width: `${((at + 1) / SCRIPT.length) * 100}%` }} />
      </div>

      {/* the script */}
      <div
        ref={scroller}
        className={styles.scroller}
        onClick={() => go(at + 1)}
        style={{ transform: mirror ? "scaleX(-1)" : undefined }}
      >
        <div className={styles.page} style={{ fontSize: size }}>
          {SCRIPT.map((s, i) => (
            <section
              key={s.n}
              ref={(el) => {
                refs.current[i] = el;
              }}
              className={`${styles.section} ${i === at ? styles.current : i < at ? styles.done : ""}`}
            >
              <div className={styles.label}>
                {s.n} · {s.title} <span className={styles.secs}>~{s.secs}s</span>
              </div>
              {s.text.split("\n\n").map((p, j) => (
                <Line key={j} text={p} />
              ))}
            </section>
          ))}
          <div className={styles.tail} />
        </div>
      </div>

      {/* reading line */}
      <div className={styles.readline} />

      <footer className={styles.help}>
        → / space next · ← back · A auto-scroll · + − speed · ↑ ↓ size · M mirror · F full screen · R reset timers
      </footer>
    </div>
  );
}
