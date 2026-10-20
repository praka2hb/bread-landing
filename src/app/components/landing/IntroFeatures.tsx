"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { TESTFLIGHT_URL } from "@/lib/sandwiches";
import type { BrandKey } from "./brands";
import { Logo, LogoStack } from "./Logo";
import s from "./intro.module.css";

const EASE = [0.16, 1, 0.3, 1] as const;
/** Flip's `note-settle`: lift 6px, unblur, land. */
const SETTLE = { duration: 0.6, ease: EASE };


/** Flips true the first time the element is on screen, and stays true. */
function useSeenOnce<T extends Element>(rootMargin = "-10% 0px") {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [rootMargin]);
  return [ref, seen] as const;
}


/* ═════════════════════════ Introducing Bread (Flip) ═════════════════════════ */

const INTRO = [
  {
    key: "sandwich",
    title: "Sandwiches, first.",
    body: "Any post, podcast or take becomes a basket you can buy.",
  },
  {
    key: "feed",
    title: "A feed that trades.",
    body: "See who called it, where, and how it’s done since.",
  },
  {
    key: "dm",
    title: "DM2Buy on X.",
    body: "DM any post to @sandwichplis and Bread buys the idea behind it.",
  },
  {
    key: "alerts",
    title: "Alerts that matter.",
    body: "Big moves, your sandwiches, people you follow.",
  },
] as const;

type IntroKey = (typeof INTRO)[number]["key"];

/**
 * Bread's marks for the four cards: solid white glyphs on an ink chip, each with
 * one Bread-green accent. 20px grid, no outlines, no per-icon badges.
 */
function IntroIcon({ k }: { k: IntroKey }) {
  const common = { width: 18, height: 18, viewBox: "0 0 20 20", fill: "none", "aria-hidden": true } as const;
  const INK = "#0b0b0c";
  const GREEN = "#35f046";
  if (k === "sandwich")
    return (
      <svg {...common}>
        <path d="M3.2 8.4C3.2 5.3 6.2 3.2 10 3.2s6.8 2.1 6.8 5.2z" fill="#fff" />
        <rect x="2.6" y="9.6" width="14.8" height="2.4" rx="1.2" fill={GREEN} />
        <path d="M3.2 13.2h13.6v.5a2.8 2.8 0 0 1-2.8 2.8H6a2.8 2.8 0 0 1-2.8-2.8z" fill="#fff" />
      </svg>
    );
  if (k === "feed")
    return (
      <svg {...common}>
        <rect x="3" y="3" width="14" height="8" rx="2.4" fill="#fff" />
        <path d="M5.4 8.6 8 6.4l1.9 1.4 3-2.6" stroke={INK} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="14.3" cy="5" r="1.15" fill={GREEN} stroke={INK} strokeWidth="0.6" />
        <rect x="3" y="13" width="14" height="4" rx="2" fill="#fff" fillOpacity="0.38" />
      </svg>
    );
  if (k === "dm")
    return (
      <svg {...common}>
        <path d="M17.4 2.7 2.7 8.3c-.5.2-.5.9 0 1.1l5.1 2.2 2.2 5.1c.2.5.9.5 1.1 0z" fill="#fff" />
        <path d="M7.9 11.6 17.4 2.7" stroke={GREEN} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  return (
    <svg {...common}>
      <path d="M10 2.8c-2.9 0-5 2.1-5 5v3.1l-1.3 2.2c-.4.6 0 1.4.8 1.4h11c.8 0 1.2-.8.8-1.4L15 10.9V7.8c0-2.9-2.1-5-5-5z" fill="#fff" />
      <path d="M8.1 16.1h3.8a1.9 1.9 0 0 1-3.8 0z" fill="#fff" />
      <circle cx="14.8" cy="5.2" r="3" fill={GREEN} stroke={INK} strokeWidth="1.6" />
    </svg>
  );
}

export function IntroducingBread() {
  return (
    <section className={s.intro} id="intro">
      <motion.div
        className={s.introHead}
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={SETTLE}
      >
        <h2>
          <span>Introducing Bread</span>
          <span className={s.introSub}>Trade Any Financial Idea</span>
        </h2>
        <a href={TESTFLIGHT_URL} target="_blank" rel="noopener noreferrer" className={s.introCta}>
          <Image src="/logo.png" alt="" width={44} height={44} />
          Get Bread
        </a>
      </motion.div>

      <div className={s.introGrid}>
        {INTRO.map((c, i) => (
          <motion.figure
            key={c.key}
            className={s.introItem}
            initial="hide"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={{ hide: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }}
            transition={{ ...SETTLE, delay: i * 0.08 }}
          >
            <div className={s.introCard}>
              {c.key === "sandwich" && <VignetteSandwich />}
              {c.key === "feed" && <VignetteFeed />}
              {c.key === "dm" && <VignetteDm />}
              {c.key === "alerts" && <VignetteAlerts />}
            </div>
            <figcaption>
              <span className={s.introIcon} aria-hidden="true">
                <IntroIcon k={c.key} />
              </span>
              <span>
                <b>{c.title}</b> {c.body}
              </span>
            </figcaption>
          </motion.figure>
        ))}
      </div>
    </section>
  );
}

/** A phone rising out of the bottom of the card, Flip style. */
function PeekPhone({ children }: { children: React.ReactNode }) {
  return (
    <div className={s.peek}>
      <div className={s.peekIsland} />
      <div className={s.peekScreen}>{children}</div>
    </div>
  );
}

/** The app's sandwich detail screen, as it looks in Bread, at card size. */
const MINI_LEGS: { id: BrandKey; w: number; price: string; chg: string; spark: string }[] = [
  { id: "NVDA", w: 40, price: "$182.40", chg: "+92.1%", spark: "M0 14 L6 12 L12 13 L18 9 L24 10 L30 6 L36 7 L42 3 L48 2" },
  { id: "AVGO", w: 35, price: "$349.90", chg: "+71.6%", spark: "M0 13 L6 14 L12 10 L18 11 L24 8 L30 9 L36 5 L42 6 L48 3" },
  { id: "AMD", w: 25, price: "$233.08", chg: "+64.3%", spark: "M0 12 L6 10 L12 12 L18 8 L24 9 L30 10 L36 6 L42 4 L48 4" },
];

// a believable climb with a pullback, drawn in the app's chart style
const MINI_LINE =
  "M0 62 C8 60 12 64 20 58 S34 50 42 53 S56 44 64 46 S78 34 86 40 S100 48 108 44 S120 30 130 32 S146 22 156 26 S170 12 180 14";

function VignetteSandwich() {
  // its own observer: these pieces must not wait on the card's variant state
  const [ref, seen] = useSeenOnce<HTMLDivElement>("-40px 0px");
  const inView = { inherit: false, initial: "hide", animate: seen ? "show" : "hide" } as const;

  return (
    <div ref={ref} className={s.vSlot}>
    <PeekPhone>
      <div className={s.miniNav}>
        <span className={s.miniRound}>‹</span>
        <span className={s.miniUser}>
          <Image src="/avatar-jukan.jpg" alt="" width={16} height={16} />
          @jukan05
          <svg viewBox="0 0 24 24" width="11" height="11" aria-hidden="true">
            <path
              fill="#1d9bf0"
              d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91C2.63 9.33 1.75 10.57 1.75 12s.88 2.67 2.19 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34z"
            />
            <path fill="#fff" d="m10.54 16.2-3.74-3.74 1.41-1.42 2.33 2.33 5.13-5.13 1.41 1.41z" />
          </svg>
        </span>
        <span className={s.miniRound}>•••</span>
      </div>
      <p className={s.miniThesis}>chips are still the AI trade</p>
      <span className={s.miniWhen}>11:31 PM · 10/12/26</span>

      <motion.div
        className={s.miniPnl}
        {...inView}
        variants={{ hide: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}
        transition={{ ...SETTLE, delay: 0.2 }}
      >
        <b>+78.40%</b>
        <span>+$1,960.00 since entry</span>
      </motion.div>

      <svg viewBox="0 0 180 70" className={s.miniChart} preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="miniArea" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#35F046" stopOpacity="0.22" />
            <stop offset="1" stopColor="#35F046" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${MINI_LINE} L180 70 L0 70 Z`} fill="url(#miniArea)" />
        <motion.path
          d={MINI_LINE}
          fill="none"
          stroke="#35F046"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          {...inView}
          variants={{ hide: { pathLength: 0.15 }, show: { pathLength: 1 } }}
          transition={{ duration: 1.4, delay: 0.3, ease: EASE }}
        />
        <circle cx="179" cy="14" r="3" fill="#35F046" className={s.miniDot} />
      </svg>
      <div className={s.miniAxis}>
        <span>Oct 12 at 13:30</span>
        <span>Since entry</span>
      </div>
      <div className={s.miniRange}>
        <span>24H</span>
        <span>1W</span>
        <b>ALL</b>
      </div>
      <div className={s.miniSplit}>
        <b>
          Split <span>(3)</span>
        </b>
        <em>▲ 78.40%</em>
      </div>
      {MINI_LEGS.map((l, i) => (
        <motion.div
          key={l.id}
          className={s.miniLeg}
          {...inView}
          variants={{ hide: { opacity: 0, x: 10 }, show: { opacity: 1, x: 0 } }}
          transition={{ ...SETTLE, delay: 0.4 + i * 0.08 }}
        >
          <Logo id={l.id} size={24} className={s.miniLogo} />
          <span>
            <b>{l.id}</b>
            {l.w}%
          </span>
          {/* each asset's own graph since entry */}
          <svg viewBox="0 0 48 16" className={s.miniSpark} preserveAspectRatio="none" aria-hidden="true">
            <path d={l.spark} fill="none" stroke="#35F046" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          </svg>
          <span className={s.miniPrice}>
            <b>{l.price}</b>
            <em>{l.chg}</em>
          </span>
        </motion.div>
      ))}
      <span className={s.miniBuy}>BUY</span>
    </PeekPhone>
    </div>
  );
}

const FEED_ROWS = [
  { u: "@jukan05", img: "/avatar-jukan.jpg", t: "chips are still the AI trade", ids: ["NVDA", "AVGO", "AMD"] as BrandKey[], p: "+78.4%" },
  { u: "@degentrading", img: "/avatar-degentrading.jpg", t: "AI’s next leg is software", ids: ["PLTR", "NET", "SNOW"] as BrandKey[], p: "+139.2%" },
  { u: "@margincall", img: "/landing/x-saint.jpg", t: "robinhood becomes the crypto bank", ids: ["HOOD"] as BrandKey[], p: "+96.6%" },
  { u: "@aleabitoreddit", img: "/landing/x-serenity.jpg", t: "memory is still the bottleneck", ids: ["NVDA", "AMD"] as BrandKey[], p: "+31.0%" },
];

function VignetteFeed() {
  // two copies stacked so the list can scroll forever without a seam
  const rows = [...FEED_ROWS, ...FEED_ROWS];
  return (
    <div className={s.feedTilt}>
      <div className={s.feedWin}>
        <div className={s.winBar}>
          <i />
          <i />
          <i />
          <span>Trending</span>
        </div>
        <div className={s.feedScroll}>
          <div className={s.feedTrack}>
            {rows.map((r, i) => (
              <div key={i} className={s.feedRow}>
                <Image src={r.img} alt="" width={26} height={26} />
                <div>
                  <b>{r.u}</b>
                  <p>{r.t}</p>
                  <span className={s.feedFoot}>
                    <LogoStack ids={r.ids} size={16} />
                    <em>{r.p}</em>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** DM2Buy, as it looks in X: send a post to @sandwichplis and it buys the idea behind it. */
function VignetteDm() {
  return (
    <PeekPhone>
      <div className={s.xdm}>
        <div className={s.xdmHead}>
          <span className={s.xdmBack}>←</span>
          <Image src="/landing/sandwichplis.webp" alt="" width={26} height={26} className={s.xdmAvatar} />
          <b>sandwich maker</b>
          <span className={s.xdmIcons} aria-hidden="true">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
            </svg>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="6" width="13" height="12" rx="2" />
              <path d="m16 10 5-3v10l-5-3" />
            </svg>
          </span>
        </div>

        <div className={s.xdmThread}>
          {/* the post you shared into the DM */}
          <div className={s.xdmShared}>
            <div className={s.xdmMedia}>
              <Image src="/landing/yt-karp-jensen.jpg" alt="" fill sizes="160px" />
            </div>
            <div className={s.xdmPost}>
              <span>
                <Image src="/landing/x-serenity.jpg" alt="" width={14} height={14} />
                <b>Serenity</b> @aleabitoreddit · 1d
              </span>
              <p>🚨 MEMORY IS STILL THE AI BOTTLENECK. $MU $SNDK</p>
            </div>
          </div>
          <span className={s.xdmSent}>Sent</span>

          <span className={s.xdmOnIt}>On it…</span>
          <div className={s.xdmReply}>
            <p>AI memory demand is outrunning supply.</p>
            <p>
              Bullish <b>$MU</b>
              <br />
              <u>breadapp.fun/s/memory-bottleneck</u>
            </p>
            <p className={s.xdmBought}>Bought $10 of $MU for you ✓</p>
          </div>
        </div>

        <div className={s.xdmComposer} aria-hidden="true">
          <span className={s.xdmPlus}>+</span>
          <span className={s.xdmInput}>Message</span>
        </div>
      </div>
    </PeekPhone>
  );
}

const ALERTS = [
  { t: "🚨 MU is up 6% in 10 minutes", b: "Biggest move on your feed today.", img: "/landing/mu.png" },
  { t: "Serenity’s Sandwich is up 12%", b: "Memory bottleneck. You’re in, +$3.10.", img: "/landing/x-serenity.jpg" },
  { t: "Altcoin Sherpa went long MU", b: "3 people you follow are in.", img: "/landing/sherpa.png" },
];

function VignetteAlerts() {
  return (
    <div className={s.alerts}>
      <span className={s.alertsTime}>9:41</span>
      {ALERTS.map((a, i) => (
        <div key={a.t} className={s.alert} style={{ animationDelay: `${i * 0.9}s` }}>
          <Image src="/logo.png" alt="" width={26} height={26} />
          <span>
            <b>{a.t}</b>
            {a.b}
          </span>
          <Image src={a.img} alt="" width={20} height={20} className={s.alertFace} />
        </div>
      ))}
    </div>
  );
}
