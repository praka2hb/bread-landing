"use client";

import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";

/* ═══════════════════════════════════════════════════════════════════
   GEOMETRY CONSTANTS (px)
   ═══════════════════════════════════════════════════════════════════ */

const FRIDGE_W = 320;
const FRIDGE_H = 470;
const DEPTH = 120;
const FRAME = 16;
const DOOR_THICK = 20;

/* ═══════════════════════════════════════════════════════════════════
   SCROLL ANIMATION MAP
   ═══════════════════════════════════════════════════════════════════ */

function useProgress(s: MotionValue<number>) {
  return {
    fridgeRotateY: useTransform(s, [0, 0.25, 0.7, 1], [23, 10, 10, 14]),
    fridgeRotateX: useTransform(s, [0, 0.3], [3, 4]),
    doorAngle: useTransform(s, [0.12, 0.32], [0, -118]),
    scrollHint: useTransform(s, [0, 0.06], [1, 0]),
  };
}

/* ═══════════════════════════════════════════════════════════════════
   FRIDGE DOOR
   ═══════════════════════════════════════════════════════════════════ */

function FridgeDoor({ angle }: { angle: MotionValue<number> }) {
  return (
    <motion.div
      style={{
        position: "absolute",
        inset: 0,
        transformOrigin: "left center",
        transformStyle: "preserve-3d",
        rotateY: angle,
      }}
    >
      {/* FRONT face */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translateZ(${DOOR_THICK / 2}px)`,
          backfaceVisibility: "hidden",
          borderRadius: 22,
          background:
            "linear-gradient(125deg,#ffffff 0%,#f0f1f2 46%,#dde0e2 100%)",
          boxShadow:
            "inset 0 2px 0 rgba(255,255,255,0.95), inset -6px 0 18px rgba(0,0,0,0.06), inset 0 -10px 22px rgba(0,0,0,0.05)",
        }}
      >
        <div
          className="absolute inset-0 rounded-[22px]"
          style={{
            background:
              "radial-gradient(ellipse at 30% 18%, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 55%)",
          }}
        />
        <div
          className="absolute inset-0 rounded-[22px]"
          style={{
            background:
              "linear-gradient(315deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0) 40%)",
          }}
        />
        {/* chrome handle */}
        <div
          className="absolute rounded-full"
          style={{
            right: 15,
            top: "23%",
            height: "54%",
            width: 13,
            background:
              "linear-gradient(90deg,#edf0f2 0%,#aab0b5 40%,#868c91 60%,#c6cbce 100%)",
            boxShadow:
              "3px 4px 8px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.85), inset 0 -1px 0 rgba(0,0,0,0.15)",
          }}
        />
      </div>

      {/* INNER face */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translateZ(${-DOOR_THICK / 2}px) rotateY(180deg)`,
          backfaceVisibility: "hidden",
          borderRadius: 18,
          background: "linear-gradient(180deg,#f3f2ef,#e8e6e1)",
          boxShadow: "inset 0 0 30px rgba(0,0,0,0.06)",
        }}
      />

      {/* edges */}
      <div
        style={{
          position: "absolute",
          top: 0, right: 0,
          height: "100%", width: DOOR_THICK,
          transformOrigin: "right center",
          transform: "rotateY(90deg)",
          background: "linear-gradient(180deg,#e6e4df,#cdcac3)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0, left: 0,
          width: "100%", height: DOOR_THICK,
          transformOrigin: "center top",
          transform: "rotateX(-90deg)",
          background: "linear-gradient(90deg,#eeece7,#dad7d0)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0, left: 0,
          width: "100%", height: DOOR_THICK,
          transformOrigin: "center bottom",
          transform: "rotateX(90deg)",
          background: "linear-gradient(90deg,#dedbd4,#c8c5be)",
        }}
      />
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   FRIDGE INTERIOR — clean empty cavity
   ═══════════════════════════════════════════════════════════════════ */

function FridgeInterior() {
  return (
    <div style={{ position: "absolute", inset: FRAME, transformStyle: "preserve-3d" }}>
      {/* back wall */}
      <div
        style={{
          position: "absolute", inset: 0,
          transform: `translateZ(${-DEPTH}px)`,
          background: "linear-gradient(180deg,#dedacf 0%,#cfcbc0 55%,#bbb7ac 100%)",
        }}
      />
      {/* AO vignette */}
      <div
        style={{
          position: "absolute", inset: 0,
          transform: `translateZ(${-DEPTH + 0.5}px)`,
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(0,0,0,0) 42%, rgba(0,0,0,0.18) 100%)",
        }}
      />
      {/* left wall */}
      <div
        style={{
          position: "absolute",
          left: 0, top: 0,
          height: "100%", width: DEPTH,
          transformOrigin: "left center",
          transform: "rotateY(90deg)",
          background: "linear-gradient(90deg,#d6d2c9 0%,#b4b0a6 100%)",
        }}
      />
      {/* right wall */}
      <div
        style={{
          position: "absolute",
          right: 0, top: 0,
          height: "100%", width: DEPTH,
          transformOrigin: "right center",
          transform: "rotateY(-90deg)",
          background: "linear-gradient(90deg,#b4b0a6 0%,#dedacf 100%)",
        }}
      />
      {/* ceiling */}
      <div
        style={{
          position: "absolute",
          top: 0, left: 0,
          width: "100%", height: DEPTH,
          transformOrigin: "center top",
          transform: "rotateX(-90deg)",
          background: "linear-gradient(180deg,#ebe7de 0%,#d2cec4 100%)",
        }}
      />
      {/* floor */}
      <div
        style={{
          position: "absolute",
          bottom: 0, left: 0,
          width: "100%", height: DEPTH,
          transformOrigin: "center bottom",
          transform: "rotateX(90deg)",
          background: "linear-gradient(180deg,#b6b2a8 0%,#a4a096 100%)",
        }}
      />
      {/* opening shadow lip */}
      <div
        style={{
          position: "absolute", inset: 0,
          transform: "translateZ(2px)",
          borderRadius: 4,
          boxShadow: "inset 0 0 36px 11px rgba(0,0,0,0.22)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════════
   MAIN
   ═══════════════════════════════════════════════════════════════════ */

export function FridgeStorySection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  const p = useProgress(scrollYProgress);

  return (
    <section ref={ref} className="relative" style={{ height: "400vh" }}>
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        {/* white background */}
        <div className="absolute inset-0" style={{ background: "#ffffff" }} />

        {/* ── fridge ── */}
        <div>
          <div style={{ perspective: 1700, perspectiveOrigin: "50% 42%" }}>
            {/* ground shadow */}
            <div
              className="absolute left-1/2 rounded-full"
              style={{
                bottom: -34,
                width: FRIDGE_W * 1.04,
                height: 36,
                transform: "translateX(-46%)",
                background:
                  "radial-gradient(ellipse,rgba(0,0,0,0.24) 0%,rgba(0,0,0,0.10) 46%,transparent 72%)",
                filter: "blur(3px)",
              }}
            />

            <motion.div
              style={{
                position: "relative",
                width: FRIDGE_W,
                height: FRIDGE_H,
                transformStyle: "preserve-3d",
                rotateX: p.fridgeRotateX,
                rotateY: p.fridgeRotateY,
              }}
            >
              {/* exterior side + top faces */}
              <div
                style={{
                  position: "absolute",
                  left: 0, top: 0,
                  height: "100%", width: DEPTH,
                  transformOrigin: "left center",
                  transform: "rotateY(90deg)",
                  background: "linear-gradient(90deg,#dcd9d2 0%,#bbb8b0 100%)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: 0, left: 0,
                  width: "100%", height: DEPTH,
                  transformOrigin: "center top",
                  transform: "rotateX(-90deg)",
                  background: "linear-gradient(180deg,#efede8 0%,#d5d2cb 100%)",
                }}
              />

              {/* front bezel strips */}
              <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: FRAME, background: "linear-gradient(180deg,#f6f5f2,#e4e1db)", borderTopLeftRadius: 18, borderTopRightRadius: 18, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)" }} />
              <div style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: FRAME, background: "linear-gradient(180deg,#e4e1db,#d3d0c9)", borderBottomLeftRadius: 18, borderBottomRightRadius: 18 }} />
              <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: FRAME, background: "linear-gradient(90deg,#f4f2ee,#e2dfd9)", borderTopLeftRadius: 18, borderBottomLeftRadius: 18 }} />
              <div style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: FRAME, background: "linear-gradient(90deg,#e2dfd9,#cfccc5)", borderTopRightRadius: 18, borderBottomRightRadius: 18 }} />

              <FridgeInterior />
              <FridgeDoor angle={p.doorAngle} />
            </motion.div>
          </div>
        </div>

        {/* scroll hint */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-gray-400"
          style={{ opacity: p.scrollHint, fontSize: 13 }}
        >
          <div className="flex flex-col items-center gap-1">
            <span>Scroll to explore</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default FridgeStorySection;
