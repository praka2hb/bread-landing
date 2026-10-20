"use client";

import { animate, motion, useMotionValue, useMotionValueEvent, useTransform, type AnimationPlaybackControls, type MotionValue } from "framer-motion";
import { useEffect, useRef } from "react";
import l from "./leverage.module.css";

/*
 * A port of bread-mobile's carousel LeverageRuler (src/components/leverage-ruler.tsx),
 * the one the perp order ticket uses. One value drives everything: the leverage
 * sitting under the fixed centre brackets. The strip moves with the finger point
 * for point, rubber-bands past 1x and the ceiling, and on release springs onto a
 * whole x with the finger's velocity, so a flick eases into its mark.
 */

const SETTLE = { type: "spring", damping: 24, stiffness: 200, mass: 0.55 } as const;
/** Fraction of the finger the strip still travels past either end. */
const RESISTANCE = 0.22;
/** A hard flick may carry at most this many x past where the finger let go. */
const MAX_CARRY = 1.5;
/** How far a flick's speed projects the strip, in seconds. */
const FLICK_PROJECTION_S = 0.09;
/** The pan claims the gesture after this much sideways travel. */
const ACTIVATE_PX = 6;
/** More vertical than this first and the page scrolls instead. */
const FAIL_Y_PX = 12;
/** Number size at the app's 96pt frame, scaled to ours. */
const NUMBER_FONT_RATIO = 34 / 96;

/** The app's selection haptic, where the web has one (Android). */
function tick() {
  try {
    navigator.vibrate?.(4);
  } catch {}
}

type Drag = {
  id: number;
  x0: number;
  y0: number;
  p0: number;
  active: boolean;
  slack: number;
  scale: number;
  samples: { t: number; x: number }[];
};

export function LeverageCarousel({
  value,
  max: rawMax,
  onChange,
  disabled = false,
  height = 64,
  slot = 52,
  accent = "#35F046",
  demoTo,
  demoDelay = 0,
}: {
  value: number;
  max: number;
  onChange: (next: number) => void;
  disabled?: boolean;
  height?: number;
  slot?: number;
  accent?: string;
  /** Scenes that play themselves glide to this mark once, as if dragged. */
  demoTo?: number;
  demoDelay?: number;
}) {
  // whole-x cells only, so the top of the range has to be one of them
  const max = Math.max(1, Math.floor(rawMax));
  const clamp = (p: number) => Math.min(max, Math.max(1, p));
  const committed = Math.round(clamp(value));

  const frame = useRef<HTMLDivElement>(null);
  const pos = useMotionValue(committed);
  const stripX = useTransform(pos, (p) => -(p - 1) * slot);

  const drag = useRef<Drag | null>(null);
  const anim = useRef<AnimationPlaybackControls | null>(null);
  const settling = useRef(false);
  const touched = useRef(false);
  const lastDetent = useRef(committed);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // The mark under the centre is reported as the strip moves, so the size and
  // liquidation figures track the drag instead of jumping when it ends.
  useMotionValueEvent(pos, "change", (p) => {
    const d = Math.round(clamp(p));
    if (d === lastDetent.current) return;
    lastDetent.current = d;
    if (drag.current?.active) tick();
    onChangeRef.current(d);
  });

  // stay parked on the controlled value when the owner changes it
  useEffect(() => {
    if (drag.current?.active || settling.current) return;
    if (Math.abs(pos.get() - committed) < 1e-3) return;
    anim.current?.stop();
    anim.current = animate(pos, committed, SETTLE);
  }, [committed, pos]);

  const settle = (target: number, velocity: number) => {
    anim.current?.stop();
    settling.current = true;
    anim.current = animate(pos, target, {
      ...SETTLE,
      velocity,
      onComplete: () => {
        settling.current = false;
      },
    });
  };

  // a self-playing scene drags itself once, unless someone got there first
  useEffect(() => {
    if (demoTo == null) return;
    const id = setTimeout(() => {
      if (touched.current) return;
      anim.current?.stop();
      settling.current = true;
      anim.current = animate(pos, clamp(demoTo), {
        duration: 1.5,
        ease: [0.22, 1, 0.36, 1],
        onComplete: () => {
          settling.current = false;
        },
      });
    }, demoDelay * 1000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoTo, demoDelay]);

  // the frame may sit inside a scaled phone; finger pixels are screen pixels
  const screenScale = () => {
    const el = frame.current;
    if (!el || !el.offsetWidth) return 1;
    return el.getBoundingClientRect().width / el.offsetWidth;
  };

  const resist = (p: number) => {
    if (p > max) return max + (p - max) * RESISTANCE;
    if (p < 1) return 1 - (1 - p) * RESISTANCE;
    return p;
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || max <= 1 || (e.pointerType === "mouse" && e.button !== 0)) return;
    touched.current = true;
    anim.current?.stop();
    settling.current = false;
    drag.current = {
      id: e.pointerId,
      x0: e.clientX,
      y0: e.clientY,
      p0: pos.get(),
      active: false,
      slack: 0,
      scale: screenScale(),
      samples: [{ t: e.timeStamp, x: e.clientX }],
    };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x0;
    const dy = e.clientY - d.y0;
    if (!d.active) {
      if (Math.abs(dy) > FAIL_Y_PX && Math.abs(dy) > Math.abs(dx)) {
        drag.current = null;
        return;
      }
      if (Math.abs(dx) < ACTIVATE_PX) return;
      // start from here, so the strip doesn't jump the activation distance
      d.active = true;
      d.slack = dx;
      frame.current?.setPointerCapture(e.pointerId);
    }
    pos.set(resist(d.p0 - (dx - d.slack) / d.scale / slot));
    d.samples.push({ t: e.timeStamp, x: e.clientX });
    while (d.samples.length > 2 && e.timeStamp - d.samples[0].t > 90) d.samples.shift();
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    if (!d.active) {
      // a tap brings the tapped number to the centre
      const r = frame.current!.getBoundingClientRect();
      const offset = (e.clientX - (r.left + r.width / 2)) / d.scale / slot;
      settle(Math.round(clamp(pos.get() + offset)), 0);
      return;
    }
    const first = d.samples[0];
    const last = d.samples[d.samples.length - 1];
    const dt = (last.t - first.t) / 1000;
    const vx = dt > 0 ? (last.x - first.x) / dt / d.scale : 0;
    const velocity = -vx / slot; // x per second
    const carry = Math.max(-MAX_CARRY, Math.min(MAX_CARRY, velocity * FLICK_PROJECTION_S));
    settle(Math.round(clamp(pos.get() + carry)), velocity);
  };

  const onPointerCancel = () => {
    const d = drag.current;
    drag.current = null;
    if (d?.active) settle(Math.round(clamp(pos.get())), 0);
  };

  // trackpads: a horizontal two-finger swipe scrubs the strip too
  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    let idle: ReturnType<typeof setTimeout>;
    const onWheel = (e: WheelEvent) => {
      if (disabled || Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      touched.current = true;
      anim.current?.stop();
      settling.current = true;
      pos.set(resist(pos.get() + e.deltaX / screenScale() / slot));
      clearTimeout(idle);
      idle = setTimeout(() => settle(Math.round(clamp(pos.get())), 0), 120);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      clearTimeout(idle);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, max, slot]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const step = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
    let target: number | null = step ? committed + step : null;
    if (e.key === "Home") target = 1;
    if (e.key === "End") target = max;
    if (target == null) return;
    e.preventDefault();
    touched.current = true;
    settle(Math.round(clamp(target)), 0);
  };

  if (max <= 1) {
    return (
      <div className={l.static} style={{ color: accent }}>
        1x
      </div>
    );
  }

  const font = Math.round(height * NUMBER_FONT_RATIO);
  const cells = Array.from({ length: max }, (_, i) => i + 1);

  return (
    <div
      ref={frame}
      className={l.frame}
      style={{ height, ["--slot" as string]: `${slot}px` }}
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label="Leverage"
      aria-valuemin={1}
      aria-valuemax={max}
      aria-valuenow={committed}
      aria-valuetext={`${committed}x`}
      aria-disabled={disabled || undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onKeyDown={onKeyDown}
    >
      {/* rails and the strip fade toward both sides instead of cutting a number in half */}
      <div className={l.masked} aria-hidden="true">
        <span className={l.railTop} />
        <span className={l.railBottom} />
        <motion.div className={l.strip} style={{ x: stripX }}>
          {cells.map((i) => (
            <span key={i}>
              {/* a tick marks the boundary before each number, so every number sits in its own cell */}
              <span className={l.tickTop} style={{ left: (i - 1) * slot - slot / 2 - 1 }} />
              <span className={l.tickBottom} style={{ left: (i - 1) * slot - slot / 2 - 1 }} />
              <Cell index={i} pos={pos} slot={slot} font={font} accent={accent} />
            </span>
          ))}
          <span className={l.tickTop} style={{ left: (max - 1) * slot + slot / 2 - 1 }} />
          <span className={l.tickBottom} style={{ left: (max - 1) * slot + slot / 2 - 1 }} />
        </motion.div>
      </div>

      {/* the fixed selection: a short accent bracket down each side of the centre cell */}
      <span className={l.bracketTop} style={{ marginLeft: -slot / 2 - 1.5, background: accent }} aria-hidden="true" />
      <span className={l.bracketTop} style={{ marginLeft: slot / 2 - 1.5, background: accent }} aria-hidden="true" />
      <span className={l.bracketBottom} style={{ marginLeft: -slot / 2 - 1.5, background: accent }} aria-hidden="true" />
      <span className={l.bracketBottom} style={{ marginLeft: slot / 2 - 1.5, background: accent }} aria-hidden="true" />
    </div>
  );
}

/**
 * One number on the strip. Its emphasis is read from the shared position, so it
 * grows and greens continuously as it nears the centre. The green is a second copy
 * cross-faded over the grey one, like the app, so only opacity and transform animate.
 */
function Cell({
  index,
  pos,
  slot,
  font,
  accent,
}: {
  index: number;
  pos: MotionValue<number>;
  slot: number;
  font: number;
  accent: string;
}) {
  const dist = useTransform(pos, (p) => Math.abs(index - p));
  const opacity = useTransform(dist, [0, 1, 2, 3], [1, 0.55, 0.32, 0.18]);
  const scale = useTransform(dist, [0, 1, 2], [1, 0.8, 0.68]);
  const greenOpacity = useTransform(dist, [0, 1], [1, 0]);
  const fontSize = index >= 100 ? font * 0.82 : font;
  return (
    <motion.span
      className={l.cell}
      style={{ left: (index - 1) * slot - slot * 0.7, width: slot * 1.4, opacity, scale }}
    >
      <span className={l.num} style={{ fontSize }}>
        {index}x
      </span>
      <motion.span className={l.numGreen} style={{ fontSize, color: accent, opacity: greenOpacity }}>
        {index}x
      </motion.span>
    </motion.span>
  );
}
