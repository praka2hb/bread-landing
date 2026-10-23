"use client";

import Image from "next/image";
import {
  AnimatePresence,
  useMotionValue,
  animate,
  motion,
  useReducedMotion,
  useAnimate,
  useScroll,
  useTransform,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { TESTFLIGHT_URL } from "@/lib/sandwiches";
import type { BrandKey } from "./brands";
import { GlossyLogo, Logo, LogoStack } from "./Logo";
import { Odometer } from "./Odometer";
import { IntroducingBread } from "./IntroFeatures";
import { HowBread } from "./HowBread";
import { LeverageCarousel } from "./LeverageCarousel";
import styles from "./landing.module.css";

const X_URL = "https://x.com/breadappfun";

/*
 * One motion vocabulary for the whole page.
 * - ENTER: content arriving on screen. Decelerates, never overshoots.
 * - SETTLE: things reacting to a state change. Critically damped.
 */
const EASE = [0.16, 1, 0.3, 1] as const;
const ENTER = { duration: 0.7, ease: EASE };
const SETTLE = { type: "spring", stiffness: 420, damping: 42 } as const;

/** Fade-up on first view, the way every card on the page arrives. */
function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ ...ENTER, delay }}
    >
      {children}
    </motion.div>
  );
}

/* ───────────────────────── market data (illustrative) ───────────────────────── */

type Quote = { id: BrandKey; sym: string; name: string; price: number; chg: number };

const QUOTES: Record<"NVDA" | "AVGO" | "AMD", Quote> = {
  NVDA: { id: "NVDA", sym: "NVDA", name: "Nvidia", price: 182.4, chg: 2.14 },
  AVGO: { id: "AVGO", sym: "AVGO", name: "Broadcom", price: 349.9, chg: 1.66 },
  AMD: { id: "AMD", sym: "AMD", name: "AMD", price: 233.08, chg: 4.4 },
};

function fmtPrice(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function useJitter(base: number) {
  const [v, setV] = useState(base);
  useEffect(() => {
    const id = setInterval(() => {
      setV((prev) => {
        const next = prev * (1 + (Math.random() - 0.47) * 0.004);
        return Math.abs(next - base) / base > 0.03 ? base : next;
      });
    }, 2200 + Math.random() * 1600);
    return () => clearInterval(id);
  }, [base]);
  return v;
}

/* ───────────────────────── nav ───────────────────────── */

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
      <path d="M16.4 12.6c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8 1.6 0 2 .8 3.4.8 1.4 0 2.3-1.3 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9 0 0-2.7-1-2.7-4.1ZM13.9 4.9c.7-.9 1.2-2 1-3.2-1 .1-2.3.7-3 1.6-.7.8-1.2 2-1.1 3.1 1.2.1 2.3-.6 3.1-1.5Z" />
    </svg>
  );
}

/* ───────────────────────── hero (restored) ───────────────────────── */

/* ───────────────────────── logo ─────────────────────────
 * The app icon split in two: the green tile and the slice of bread on it. The slice
 * drops into the tile on load, pops up like toast when you hover, and flips when
 * tapped, shaking a few crumbs loose.
 */
const POP = { type: "spring", stiffness: 520, damping: 17, mass: 0.6 } as const;

function BreadMark() {
  const [scope, animateEl] = useAnimate();
  const reduce = useReducedMotion();
  const busy = useRef(false);

  useEffect(() => {
    if (reduce) return;
    animateEl(".slice", { y: [-26, 0], rotate: [-24, 0], opacity: [0, 1] }, { ...POP, delay: 0.25 });
    animateEl(".tile", { scaleY: [1, 0.9, 1], scaleX: [1, 1.06, 1] }, { duration: 0.32, delay: 0.42, ease: "easeOut" });
  }, [animateEl, reduce]);

  const hover = (on: boolean) => {
    if (reduce || busy.current) return;
    animateEl(".slice", on ? { y: -5, rotate: -9 } : { y: 0, rotate: 0 }, POP);
  };

  const flip = async () => {
    if (reduce || busy.current) return;
    busy.current = true;
    animateEl(".tile", { scaleY: [1, 0.86, 1], scaleX: [1, 1.08, 1] }, { duration: 0.28, ease: "easeOut" });
    [-14, 2, 15].forEach((dx, i) =>
      animateEl(
        `.crumb${i}`,
        { opacity: [0, 1, 0], x: [0, dx], y: [0, -12 - i * 3, 8], scale: [0.6, 1, 0.8] },
        { duration: 0.6, ease: "easeOut", delay: 0.05 + i * 0.03 },
      ),
    );
    await animateEl(".slice", { y: [0, -18, 0], rotate: [0, -360] }, { duration: 0.62, ease: [0.3, 0, 0.2, 1] });
    animateEl(".slice", { rotate: 0 }, { duration: 0 });
    busy.current = false;
  };

  return (
    <a
      ref={scope}
      href="#top"
      className={styles.navBrand}
      aria-label="Bread"
      onPointerEnter={() => hover(true)}
      onPointerLeave={() => hover(false)}
      onClick={flip}
    >
      <span className={styles.mark} aria-hidden="true">
        <span className={`tile ${styles.markTile}`} />
        {[0, 1, 2].map((i) => (
          <i key={i} className={`crumb${i} ${styles.markCrumb}`} />
        ))}
        <Image src="/landing/logo-slice.webp" alt="" width={192} height={169} className={`slice ${styles.markSlice}`} priority />
      </span>
      Bread
    </a>
  );
}

/* ───────────────────────── top bar ─────────────────────────
 * Not a sticky navbar: it sits at the top of the hero and scrolls away with it.
 */
function Nav() {
  return (
    <motion.header
      className={styles.nav}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE }}
    >
      <BreadMark />
      <div className={styles.navEnd}>
        <a href={TESTFLIGHT_URL} target="_blank" rel="noopener noreferrer" className={styles.navCta}>
          <AppleIcon />
          Get the app
        </a>
      </div>
    </motion.header>
  );
}

function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  // Cursor parallax: each floating piece drifts at its own depth (--d).
  useEffect(() => {
    const node = ref.current;
    if (!node || reduce) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        node.style.setProperty("--mx", String(e.clientX / window.innerWidth - 0.5));
        node.style.setProperty("--my", String(e.clientY / window.innerHeight - 0.5));
      });
    };
    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [reduce]);

  // ugly.cash-style: the phone keeps rising as you scroll out of the hero
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const stageY = useTransform(scrollYProgress, [0, 1], [0, -140]);
  const phoneRotate = useTransform(scrollYProgress, [0, 1], [0, -4]);

  // Soar's framed hero: leaving the hero, the paper card shrinks into a rounded frame
  // over the dark page, which is the manifesto's colour, so there is no hard cut.
  const { scrollYProgress: leave } = useScroll({ target: ref, offset: ["end end", "end start"] });
  const frameScale = useTransform(leave, [0, 1], [1, 0.9]);
  const frameRadius = useTransform(leave, [0, 0.4], [0, 48]);
  const frameDim = useTransform(leave, [0, 1], [0, 0.35]);

  // The demo: which post is cooked into the phone, its chart range, and the buy beat.
  const [src, setSrc] = useState(0);
  const [range, setRange] = useState<Range>("1W");
  const [touched, setTouched] = useState(false);

  // Until someone taps, the demo plays itself through the three posts, like Soar's hero.
  useEffect(() => {
    if (touched || reduce) return;
    const id = setInterval(() => {
      setSrc((n) => (n + 1) % HERO_CALLS.length);
      setRange("1W");
    }, 7000);
    return () => clearInterval(id);
  }, [touched, reduce]);

  const pick = (i: number) => {
    setTouched(true);
    setSrc(i);
    setRange("1W");
  };

  const call = HERO_CALLS[src];

  return (
    <div className={styles.heroShell}>
      <motion.section
        ref={ref}
        className={styles.hero}
        id="top"
        style={{ scale: frameScale, borderRadius: frameRadius }}
      >
        <div className={styles.heroGlow} aria-hidden="true" />
        <motion.div className={styles.heroDim} style={{ opacity: frameDim }} aria-hidden="true" />

        <div className={styles.heroFloats}>
          {!touched && (
            <span className={styles.tapHint} aria-hidden="true">
              tap a post to cook it
            </span>
          )}

          <Float className={styles.fTweet} depth={26} delay={0.7}>
            <SourceButton active={src === 0} onPick={() => pick(0)} label="Cook jukan's post on X">
              <div className={styles.tweet}>
                <div className={styles.tweetHead}>
                  <Image src="/avatar-jukan.jpg" alt="" width={36} height={36} />
                  <div>
                    <b>jukan</b>
                    <span>@jukan05 · 2h</span>
                  </div>
                  <Logo id="x" size={22} className={styles.tweetSource} />
                </div>
                <p>
                  AI capex isn&apos;t slowing down. every hyperscaler just raised guidance again.{" "}
                  <span className={styles.tweetHot}>chips are still the trade.</span>
                </p>
                <div className={styles.tweetStats}>
                  <span>♡ 4.2K</span>
                  <span>↻ 812</span>
                  <span>◷ 391K</span>
                </div>
              </div>
            </SourceButton>
          </Float>

          <Float className={styles.fYoutube} depth={40} delay={0.85}>
            <SourceButton active={src === 1} onPick={() => pick(1)} label="Cook the Karp and Jensen video on YouTube">
              <div className={styles.yt}>
                <div className={styles.ytThumb}>
                  <Image src="/landing/yt-karp-jensen.jpg" alt="" fill sizes="280px" />
                  <span className={styles.ytTime}>1:42:07</span>
                </div>
                <div className={styles.ytMeta}>
                  <Logo id="youtube" size={22} />
                  <div>
                    <b>Karp × Jensen</b>
                    <span>found 3 trades at 34:10</span>
                  </div>
                </div>
              </div>
            </SourceButton>
          </Float>

          <Float className={styles.fSubstack} depth={18} delay={1}>
            <SourceButton active={src === 2} onPick={() => pick(2)} label="Cook The Margin Call on Substack">
              <div className={styles.note}>
                <Logo id="substack" size={22} />
                <p>&ldquo;nobody&apos;s noticed Robinhood is quietly turning into a crypto bank&rdquo;</p>
              </div>
            </SourceButton>
          </Float>

          <div aria-hidden="true">
            <Float className={styles.fQuoteA} depth={30} delay={0.8}>
              <QuoteCard quote={QUOTES.NVDA} />
            </Float>
            <Float className={styles.fQuoteB} depth={46} delay={0.95}>
              <QuoteCard quote={QUOTES.AVGO} />
            </Float>
            <Float className={styles.fQuoteC} depth={22} delay={1.1}>
              <QuoteCard quote={QUOTES.AMD} />
            </Float>

            {/* Duolingo-style props: small, slower, behind the cards */}
            <Float className={styles.pSandwich} depth={12} delay={1.25}>
              <Image src="/sandwich-cutout.png" alt="" width={160} height={142} className={styles.heroSandwich} />
            </Float>
            <Float className={styles.pTileA} depth={10} delay={1.35}>
              <TickerChip id="NVDA" chg={4.82} spark={[3, 4, 3.6, 5, 4.7, 6.2, 5.8, 7.4]} />
            </Float>
            <Float className={styles.pTileB} depth={14} delay={1.45}>
              <Logo id="TSLA" size={40} className={styles.heroTile} />
            </Float>
            <Float className={styles.pTileC} depth={8} delay={1.55}>
              <TickerChip id="BTC" coin chg={2.31} spark={[5, 4.4, 5.2, 4.9, 6, 5.6, 6.6, 7]} />
            </Float>
            <Float className={styles.pCoin} depth={16} delay={1.65}>
              <span className={styles.heroCoin}>$</span>
            </Float>
          </div>
        </div>

        <div className={styles.heroCopy}>
          <h1 className={styles.heroTitle}>
            {["The internet is", "full of alpha."].map((line, i) => (
              <span key={line} className={styles.lineMask}>
                <motion.span
                  initial={{ y: "105%" }}
                  animate={{ y: 0 }}
                  transition={{ delay: 0.08 + i * 0.09, duration: 0.9, ease: EASE }}
                >
                  {line}
                </motion.span>
              </span>
            ))}
            <span className={styles.lineMask}>
              <motion.span
                initial={{ y: "105%" }}
                animate={{ y: 0 }}
                transition={{ delay: 0.26, duration: 0.9, ease: EASE }}
              >
                Now you can <span className={styles.heroGreen}>buy it.</span>
              </motion.span>
            </span>
          </h1>

          <motion.p
            className={styles.heroSub}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.7, ease: EASE }}
          >
            Paste a post or a podcast. Bread finds the play, long or short. One tap and you’re in.
          </motion.p>

          <motion.div
            className={styles.heroCtas}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.7, ease: EASE }}
          >
            <a href={TESTFLIGHT_URL} className={styles.btnPrimary} target="_blank" rel="noopener noreferrer">
              <AppleIcon />
              <span className={styles.btnStack}>
                <small>Download on</small>
                TestFlight
              </span>
            </a>
            <a href="#how" className={styles.btnGhost}>
              See how it works
            </a>
          </motion.div>

          {/* what Bread actually reads, so the line under the buttons says something true */}
          <motion.div
            className={styles.heroSources}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.7, ease: EASE }}
          >
            <span>Paste from</span>
            {(
              [
                ["x", "X"],
                ["youtube", "YouTube"],
                ["substack", "Substack"],
                ["podcasts", "Podcasts"],
              ] as const
            ).map(([id, name]) => (
              <span key={id} className={styles.heroSource}>
                <Logo id={id} size={18} />
                {name}
              </span>
            ))}
          </motion.div>
        </div>

        <motion.div
          className={styles.heroStage}
          style={{ y: stageY }}
          initial={{ opacity: 0, y: 120 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 1.1, ease: EASE }}
        >
          {/* small screens hide the floating posts, so they get pills to pick one */}
          <div className={styles.srcPills} role="group" aria-label="Pick a post to cook">
            {HERO_CALLS.map((c, i) => (
              <button
                key={c.key}
                type="button"
                className={i === src ? styles.srcPillOn : styles.srcPill}
                aria-pressed={i === src}
                onClick={() => pick(i)}
              >
                <Logo id={c.via} size={18} />
                {c.viaName}
              </button>
            ))}
          </div>
          <motion.div className={styles.phoneWrap} style={{ rotate: phoneRotate }}>
            <Phone
              call={call}
              range={range}
              onRange={(r) => {
                setTouched(true);
                setRange(r);
              }}
              onTouch={() => setTouched(true)}
              onBuy={() => setTouched(true)}
            />
          </motion.div>
        </motion.div>
      </motion.section>
    </div>
  );
}

function SourceButton({
  active,
  onPick,
  label,
  children,
}: {
  active: boolean;
  onPick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={active ? styles.srcBtnOn : styles.srcBtn}
      aria-pressed={active}
      aria-label={label}
      onClick={onPick}
    >
      {children}
      {active && <span className={styles.srcCooking}>in the phone →</span>}
    </button>
  );
}

function Float({
  className,
  depth,
  delay,
  children,
}: {
  className: string;
  depth: number;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      className={`${styles.float} ${className}`}
      style={{ ["--d" as string]: depth }}
      initial={{ opacity: 0, scale: 0.9, y: 24 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 180, damping: 20 }}
    >
      <div className={styles.floatInner}>{children}</div>
    </motion.div>
  );
}

/**
 * A live ticker chip floating behind the cards: logo, ticker, a small sparkline and a
 * change that ticks like the app's prices, so the props say something instead of
 * being bare logos.
 */
function TickerChip({ id, chg, spark, coin = false }: { id: BrandKey; chg: number; spark: number[]; coin?: boolean }) {
  const live = useJitter(chg);
  const max = Math.max(...spark);
  const min = Math.min(...spark);
  const pts = spark
    .map((v, i) => `${(i / (spark.length - 1)) * 40},${16 - ((v - min) / (max - min)) * 14 + 1}`)
    .join(" ");
  return (
    <div className={styles.tickerChip}>
      <GlossyLogo id={id} size={30} coin={coin} />
      <b>{id}</b>
      <svg viewBox="0 0 40 18" width="40" height="18" aria-hidden="true">
        <polyline points={pts} fill="none" stroke="#35f046" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className={styles.up}>+{live.toFixed(2)}%</span>
    </div>
  );
}

function QuoteCard({ quote }: { quote: Quote }) {
  const price = useJitter(quote.price);
  const chg = quote.chg + ((price - quote.price) / quote.price) * 100;
  const up = chg >= 0;
  return (
    <div className={styles.quote}>
      <Logo id={quote.id} size={36} />
      <div className={styles.quoteName}>
        <b>{quote.sym}</b>
        <span>{quote.name}</span>
      </div>
      <div className={styles.quotePrice}>
        <Odometer value={`$${fmtPrice(price)}`} />
        <span className={up ? styles.up : styles.down}>
          {up ? "+" : "−"}
          {Math.abs(chg).toFixed(2)}%
        </span>
      </div>
    </div>
  );
}

/* ───────────────────────── the interactive hero phone ───────────────────────── */

const RANGES = ["24H", "1W", "ALL"] as const;
type Range = (typeof RANGES)[number];

type HeroLeg = { id: BrandKey; w: number; price: string; chg: number };

type HeroCall = {
  key: string;
  via: BrandKey;
  viaName: string;
  who: string;
  avatar: string;
  title: string;
  when: string;
  likes: number;
  /** The idea the sandwich was cooked from. The same card is shown on the detail
   *  screen, in the buy sheet and on the receipt, so all three always agree. */
  idea: Idea;
  /** A single-asset idea trades as a leveraged long perp instead of a basket. */
  perp?: { leverage: number; maxLeverage: number; mark: number; oi: string };
  legs: HeroLeg[];
  pnl: Record<Range, number>;
  seed: number;
};

type Idea =
  | { kind: "x"; handle: string; name: string; avatar: string; text: string }
  | { kind: "youtube"; title: string; channel: string; thumb: string; duration: string; at: string; quote: string }
  | { kind: "substack"; publication: string; author: string; avatar: string; text: string };

// Illustrative sandwiches, one per post floating around the phone (tweet, video, note).
const HERO_CALLS: HeroCall[] = [
  {
    key: "chips",
    via: "x",
    viaName: "X",
    who: "@jukan05",
    avatar: "/avatar-jukan.jpg",
    title: "chips are still the AI trade",
    when: "11:31 PM · 10/12/26",
    likes: 24,
    idea: {
      kind: "x",
      handle: "@jukan05",
      name: "jukan",
      avatar: "/avatar-jukan.jpg",
      text: "AI capex isn’t slowing down. every hyperscaler just raised guidance again. chips are still the trade.",
    },
    legs: [
      { id: "NVDA", w: 40, price: "$182.40", chg: 4.82 },
      { id: "AVGO", w: 35, price: "$349.90", chg: 3.66 },
      { id: "AMD", w: 25, price: "$233.08", chg: 6.4 },
    ],
    pnl: { "24H": 2.94, "1W": 12.6, ALL: 78.4 },
    seed: 7,
  },
  {
    key: "software",
    via: "youtube",
    viaName: "YouTube",
    who: "@degentrading",
    avatar: "/avatar-degentrading.jpg",
    title: "AI’s next leg is software",
    when: "9:04 AM · 10/15/26",
    likes: 61,
    idea: {
      kind: "youtube",
      title: "Karp × Jensen: the software layer is next",
      channel: "Macro pod, ep. 212",
      thumb: "/landing/yt-karp-jensen.jpg",
      duration: "1:42:07",
      at: "34:10",
      quote: "“The money moves from the chips to the software that runs on them.”",
    },
    legs: [
      { id: "PLTR", w: 40, price: "$178.20", chg: 9.71 },
      { id: "NET", w: 30, price: "$221.50", chg: 4.12 },
      { id: "SNOW", w: 30, price: "$236.40", chg: 5.84 },
    ],
    pnl: { "24H": 4.41, "1W": 21.3, ALL: 139.2 },
    seed: 31,
  },
  {
    key: "hood",
    via: "substack",
    viaName: "Substack",
    who: "@margincall",
    avatar: "/landing/x-saint.jpg",
    title: "robinhood becomes the crypto bank",
    when: "2:14 AM · 10/17/26",
    likes: 9,
    idea: {
      kind: "substack",
      publication: "The Margin Call",
      author: "@margincall",
      avatar: "/landing/x-saint.jpg",
      text: "Nobody’s noticed Robinhood is quietly turning into a crypto bank. Deposits, staking, a card: the pieces are already there.",
    },
    // one company, so one leg: a leveraged long instead of a basket
    legs: [{ id: "HOOD", w: 100, price: "$139.70", chg: 7.2 }],
    perp: { leverage: 3, maxLeverage: 10, mark: 139.7, oi: "$41.2M" },
    pnl: { "24H": 6.9, "1W": 18.4, ALL: 96.6 },
    seed: 19,
  },
];

/** The idea a sandwich came from, drawn the way its platform draws it. */
function IdeaCard({ idea, size = "full" }: { idea: Idea; size?: "full" | "compact" }) {
  const compact = size === "compact";
  if (idea.kind === "youtube") {
    return (
      <div className={`${styles.idea} ${styles.ideaYt} ${compact ? styles.ideaCompact : ""}`}>
        <div className={styles.ytShot}>
          <Image src={idea.thumb} alt="" fill sizes="160px" />
          <span className={styles.ytShotPlay} aria-hidden="true">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="#fff">
              <path d="M8 5.5v13l11-6.5z" />
            </svg>
          </span>
          <span className={styles.ytShotDur}>{idea.duration}</span>
          <span className={styles.ytShotBar} aria-hidden="true" />
        </div>
        <div className={styles.ytInfo}>
          <b>{idea.title}</b>
          <span>
            <Logo id="youtube" size={13} /> {idea.channel}
          </span>
          <em className={styles.ytAt}>▶ at {idea.at}</em>
        </div>
        {!compact && <p className={styles.ideaQuote}>{idea.quote}</p>}
      </div>
    );
  }
  if (idea.kind === "x") {
    return (
      <div className={`${styles.idea} ${compact ? styles.ideaCompact : ""}`}>
        <div className={styles.ideaHead}>
          <Image src={idea.avatar} alt="" width={22} height={22} />
          <b>{idea.name}</b>
          <span>{idea.handle}</span>
          <Logo id="x" size={14} className={styles.ideaMark} />
        </div>
        <p className={styles.ideaText}>{idea.text}</p>
      </div>
    );
  }
  return (
    <div className={`${styles.idea} ${styles.ideaSub} ${compact ? styles.ideaCompact : ""}`}>
      <div className={styles.ideaHead}>
        <Logo id="substack" size={22} />
        <b>{idea.publication}</b>
        <span>{idea.author}</span>
      </div>
      <p className={styles.ideaText}>{idea.text}</p>
    </div>
  );
}

const CHART_N = 56;
const CHART_W = 280;
const CHART_H = 110;

function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A deterministic, believable winner: it starts at 0% and ends exactly on the range's
 * PnL, but gets there like a real chart does: choppy, with a proper drawdown in the
 * middle and a few sharp red days, not a ruler line. Built in units of the final
 * return so a +139% run is as choppy as a +4% day.
 */
function series(seed: number, end: number) {
  const rnd = mulberry32(seed);
  const dipAt = 0.38 + rnd() * 0.22; // where the big pullback hits
  const dipLen = 0.1 + rnd() * 0.08;
  let raw = [0];
  for (let i = 1; i < CHART_N; i++) {
    const t = i / (CHART_N - 1);
    let step = 1 + (rnd() - 0.5) * 6.5;
    if (t > dipAt && t < dipAt + dipLen) step -= 3.4; // the drawdown
    if (rnd() < 0.08) step -= 4; // the odd sharp red day
    raw.push(raw[i - 1] + step);
  }
  // one light pass keeps the chop but takes off single-sample spikes
  raw = raw.map((v, i) => (i === 0 || i === raw.length - 1 ? v : v * 0.6 + (raw[i - 1] + raw[i + 1]) * 0.2));
  const last = raw[CHART_N - 1] || 1;
  const unit = raw.map((v) => v / last);
  // it may give back gains, but never trades under the entry: the hero only shows profit
  return unit.map((v, i) => (i === 0 ? 0 : Math.max(v, 0.015 + 0.01 * Math.sin(i))) * end);
}

type Pt = [number, number];

/**
 * A smooth line through the points (Catmull-Rom as cubic Béziers). The x controls
 * land on thirds of each segment, so x is linear in the segment parameter and
 * `pointAt` can read the exact spot on the curve under the cursor.
 */
function chartPaths(values: number[]) {
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 0);
  const span = max - min || 1;
  const y = (v: number) => 12 + (1 - (v - min) / span) * (CHART_H - 24);
  const pts: Pt[] = values.map((v, i) => [(i / (values.length - 1)) * CHART_W, y(v)]);
  const segs = pts.slice(0, -1).map((p1, i) => {
    const p0 = pts[i - 1] ?? p1;
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    return { p1, c1, c2, p2 };
  });
  const f = (n: number) => n.toFixed(1);
  const line =
    `M${f(pts[0][0])} ${f(pts[0][1])}` +
    segs.map(({ c1, c2, p2 }) => ` C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`).join("");

  /** Point on the curve, and the value under it, at t in [0, 1] across the chart. */
  const pointAt = (t: number) => {
    const u = Math.min(0.999999, Math.max(0, t)) * segs.length;
    const i = Math.floor(u);
    const k = u - i;
    const { p1, c1, c2, p2 } = segs[i];
    const m = 1 - k;
    const py = m * m * m * p1[1] + 3 * m * m * k * c1[1] + 3 * m * k * k * c2[1] + k * k * k * p2[1];
    const px = p1[0] + (p2[0] - p1[0]) * k;
    const v = min + (1 - (py - 12) / (CHART_H - 24)) * span;
    return { x: px, y: py, v };
  };

  return { line, pts, pointAt };
}

const fmtPct = (v: number) => `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(2)}%`;

const RANGE_LABEL: Record<Range, string> = { "24H": "Today", "1W": "This week", ALL: "Since entry" };

function VerifiedIcon({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-label="verified">
      <path
        fill="#1d9bf0"
        d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91C2.63 9.33 1.75 10.57 1.75 12s.88 2.67 2.19 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34z"
      />
      <path fill="#fff" d="m10.54 16.2-3.74-3.74 1.41-1.42 2.33 2.33 5.13-5.13 1.41 1.41z" />
    </svg>
  );
}

function Phone({
  call,
  range,
  onRange,
  onTouch,
  onBuy,
}: {
  call: HeroCall;
  range: Range;
  onRange: (r: Range) => void;
  onTouch: () => void;
  onBuy: (amount: string) => void;
}) {
  const reduce = useReducedMotion();
  const [booted, setBooted] = useState(false);
  /** cursor position across the chart, 0 to 1, while scrubbing */
  const [scrub, setScrub] = useState<number | null>(null);
  const [sheet, setSheet] = useState(false);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  // Soar-style boot: the screen wakes from a blurred skeleton
  useEffect(() => {
    const id = setTimeout(() => setBooted(true), reduce ? 0 : 1300);
    return () => clearTimeout(id);
  }, [reduce]);

  const values = series(call.seed + RANGES.indexOf(range) * 101, call.pnl[range]);
  const { line, pts, pointAt } = chartPaths(values);
  const hover = scrub == null ? null : pointAt(scrub);
  const pnl = hover == null ? call.pnl[range] : hover.v;
  const up = call.pnl[range] >= 0;
  const color = up ? APP_GREEN : APP_RED;

  const onScrub = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const t = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    setScrub(t);
  };

  return (
    <div className={styles.phone}>
      <div className={styles.phoneIsland} />
      <div className={styles.phoneScreen}>
        <motion.div
          className={styles.app}
          initial={false}
          animate={booted ? { filter: "blur(0px)", opacity: 1 } : { filter: "blur(10px)", opacity: 0.5 }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <div className={styles.appStatus}>
            <span>9:41</span>
            <span className={styles.phoneStatusIcons}>
              <i />
              <i />
              <i />
            </span>
          </div>

          <div className={styles.appNav}>
            <span className={styles.appRound}>‹</span>
            <div className={styles.appUserSlot}>
              <motion.div
                key={`user-${call.key}`}
                className={styles.appUser}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: EASE }}
              >
                <Image src={call.avatar} alt="" width={20} height={20} />
                <b>{call.who}</b>
                <VerifiedIcon size={13} />
              </motion.div>
            </div>
            <span className={styles.appRound}>•••</span>
          </div>

          <div className={styles.appHeadSlot}>
            <motion.div
              key={`head-${call.key}`}
              initial={{ opacity: 0, y: 8, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.3, ease: EASE }}
            >
              <p className={styles.appThesis}>{call.title}</p>
              <span className={styles.appWhen}>{call.when}</span>
              <IdeaCard idea={call.idea} size="compact" />
            </motion.div>
          </div>

          <div className={styles.appActions}>
            <button
              type="button"
              className={liked ? styles.appLiked : undefined}
              aria-pressed={liked}
              aria-label="Like"
              onClick={() => {
                onTouch();
                setLiked((v) => !v);
              }}
            >
              <motion.span animate={liked ? { scale: [1, 1.4, 1] } : { scale: 1 }} transition={{ duration: 0.35 }}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                  <path d="M12 20.3S3.5 15.2 3.5 9.1A4.6 4.6 0 0 1 12 6.6a4.6 4.6 0 0 1 8.5 2.5c0 6.1-8.5 11.2-8.5 11.2z" />
                </svg>
              </motion.span>
              {call.likes + (liked ? 1 : 0)}
            </button>
            <span aria-hidden="true">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M7 4h10a3 3 0 0 1 3 3v6M17 20H7a3 3 0 0 1-3-3v-6M12 9v6M9 12h6" />
              </svg>
            </span>
            <button
              type="button"
              className={saved ? styles.appSaved : undefined}
              aria-pressed={saved}
              aria-label="Bookmark"
              onClick={() => {
                onTouch();
                setSaved((v) => !v);
              }}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                <path d="M6 3.5h12v17l-6-4.5-6 4.5z" />
              </svg>
            </button>
            <span aria-hidden="true">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 3.2v12M7.4 7.6L12 3.2l4.6 4.4M5 12.5v6.3c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2v-6.3" />
              </svg>
            </span>
          </div>

          <svg
            viewBox={`0 0 ${CHART_W} ${CHART_H}`}
            className={styles.appChart}
            preserveAspectRatio="none"
            onPointerMove={onScrub}
            onPointerDown={onScrub}
            onPointerLeave={() => setScrub(null)}
            role="img"
            aria-label={`${call.title}: ${fmtPct(call.pnl[range])}, ${RANGE_LABEL[range]}`}
          >
            <defs>
              <linearGradient id="appArea" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor={color} stopOpacity="0.32" />
                <stop offset="0.7" stopColor={color} stopOpacity="0.06" />
                <stop offset="1" stopColor={color} stopOpacity="0" />
              </linearGradient>
              {/* everything left of the cursor stays lit; the rest is the dimmed copy below */}
              <clipPath id="appLit">
                <rect x="-10" y="-10" height={CHART_H + 20} width={(hover ? hover.x : CHART_W) + 10} />
              </clipPath>
            </defs>

            {hover && (
              <g aria-hidden="true">
                <path d={`${line} L${CHART_W} ${CHART_H} L0 ${CHART_H} Z`} fill="url(#appArea)" opacity="0.3" />
                <path d={line} fill="none" stroke={color} strokeOpacity="0.22" strokeWidth="3" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
              </g>
            )}

            <g clipPath="url(#appLit)">
              <motion.path
                initial={{ d: `${line} L${CHART_W} ${CHART_H} L0 ${CHART_H} Z`, opacity: 0 }}
                animate={{ d: `${line} L${CHART_W} ${CHART_H} L0 ${CHART_H} Z`, opacity: 1 }}
                transition={{ d: { duration: 0.6, ease: EASE }, opacity: { duration: 0.8, delay: 1.8 } }}
                fill="url(#appArea)"
              />
              <motion.path
                initial={{ d: line, pathLength: 0 }}
                animate={{ d: line, pathLength: 1 }}
                transition={{ d: { duration: 0.6, ease: EASE }, pathLength: { duration: 1.4, delay: 1.2, ease: EASE } }}
                fill="none"
                stroke={color}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            </g>

            {hover ? (
              <circle cx={hover.x} cy={hover.y} r="5" fill={color} stroke="#fff" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
            ) : (
              <g>
                <circle className={styles.appPing} cx={pts[CHART_N - 1][0] - 3} cy={pts[CHART_N - 1][1]} r="5" fill={color} />
                <circle cx={pts[CHART_N - 1][0] - 3} cy={pts[CHART_N - 1][1]} r="4.5" fill={color} stroke="#fff" strokeWidth="2" vectorEffect="non-scaling-stroke" />
              </g>
            )}
          </svg>
          <div className={styles.appAxis}>
            <span>{scrub == null ? "Oct 12 at 13:30" : "drag to explore"}</span>
            <span>{RANGE_LABEL[range]}</span>
          </div>

          <div className={styles.appRange} role="group" aria-label="Chart range">
            {RANGES.map((r) => (
              <button key={r} type="button" className={r === range ? styles.appRangeOn : undefined} aria-pressed={r === range} onClick={() => onRange(r)}>
                {r}
              </button>
            ))}
          </div>

          <div className={styles.appSplit}>
            {call.perp ? (
              <b>
                Long <span>{call.perp.leverage}×</span>
              </b>
            ) : (
              <b>
                Split <span>({call.legs.length})</span>
              </b>
            )}
            <span className={styles.appPnl} style={{ color: pnl >= 0 ? APP_GREEN : APP_RED }}>
              {pnl >= 0 ? "▲" : "▼"}{" "}
              {scrub == null ? <Odometer value={`${Math.abs(call.pnl[range]).toFixed(2)}%`} /> : `${Math.abs(pnl).toFixed(2)}%`}
            </span>
          </div>

          <div className={styles.appLegsSlot}>
            <motion.ul
              key={`legs-${call.key}`}
              className={styles.appLegs}
              initial="hide"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.05 } }, hide: {} }}
            >
              {call.legs.map((l) => (
                <motion.li key={l.id} variants={{ hide: { opacity: 0, x: 12 }, show: { opacity: 1, x: 0 } }} transition={{ duration: 0.3, ease: EASE }}>
                  <Logo id={l.id} size={38} className={styles.appLegLogo} />
                  <div>
                    <b>{l.id}</b>
                    <span>{call.perp ? `Long · ${call.perp.leverage}× perp` : `${l.w}%`}</span>
                  </div>
                  <div className={styles.appLegPrice}>
                    <b>{l.price}</b>
                    <span style={{ color: l.chg >= 0 ? APP_GREEN : APP_RED }}>{fmtPct(l.chg)}</span>
                  </div>
                </motion.li>
              ))}
            </motion.ul>
          </div>

          <motion.button
            type="button"
            className={call.perp ? styles.appLong : styles.appBuy}
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              onTouch();
              setSheet(true);
            }}
          >
            {call.perp ? "LONG" : "BUY"}
          </motion.button>
        </motion.div>

        <AnimatePresence>
          {sheet && (
            <BuySheet
              key="sheet"
              call={call}
              onClose={() => setSheet(false)}
              onBought={(amount) => onBuy(amount)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {!booted && (
            <motion.div
              className={styles.phoneBoot}
              exit={{ opacity: 0, scale: 1.04, filter: "blur(8px)" }}
              transition={{ duration: 0.5, ease: EASE }}
              aria-hidden="true"
            >
              <Image src="/logo.png" alt="" width={72} height={70} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"] as const;
const AVAILABLE = 250;

/** The app's green (`#35F046`, BRAND_GREEN in bread-mobile) and its red. */
const APP_GREEN = "#35F046";
const APP_RED = "#FF1F4B";

type Stage = "entry" | "buying" | "done";

/** The app's buy sheet: amount, the post it came from, keypad, slide to buy. */
function BuySheet({
  call,
  onClose,
  onBought,
}: {
  call: HeroCall;
  onClose: () => void;
  onBought: (amount: string) => void;
}) {
  const [amt, setAmt] = useState("");
  const [stage, setStage] = useState<Stage>("entry");
  const typedByUser = useRef(false);

  const press = (k: (typeof KEYS)[number], fromUser = true) => {
    if (fromUser) typedByUser.current = true;
    setAmt((a) => {
      if (k === "⌫") return a.slice(0, -1);
      if (k === ".") return a.includes(".") ? a : (a || "0") + ".";
      if (a.includes(".") && a.split(".")[1].length >= 2) return a;
      if (a === "0") return k;
      const next = a + k;
      return Number(next) > AVAILABLE ? a : next;
    });
  };

  // if nobody types, the sheet demos itself: $25, then waits on the slider
  useEffect(() => {
    const ids = [
      setTimeout(() => !typedByUser.current && press("2", false), 900),
      setTimeout(() => !typedByUser.current && press("5", false), 1250),
    ];
    return () => ids.forEach(clearTimeout);
  }, []);

  const value = Number(amt || 0);
  const amountLabel = `$${value.toFixed(2)}`;
  const perp = call.perp;
  const [lev, setLev] = useState(perp?.leverage ?? 1);
  const liq = perp ? perp.mark * (1 - 0.9 / lev) : 0;

  // Like the app: the slider reports "buying" while the order lands, then the
  // receipt takes the whole screen.
  const complete = () => {
    setStage("buying");
    setTimeout(() => {
      setStage("done");
      onBought(amountLabel);
    }, 1100);
  };

  return (
    <>
      <motion.div
        className={styles.sheetDim}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => stage === "entry" && onClose()}
      />
      <motion.div
        className={styles.buySheet}
        role="dialog"
        aria-label={`Buy ${call.title}`}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 380, damping: 38 }}
      >
        <span className={styles.sheetGrab} />
        {perp && (
          <div className={styles.perpHead}>
            <Logo id={call.legs[0].id} size={34} className={styles.appLegLogo} />
            <div>
              <b>{call.legs[0].id}-PERP</b>
              <span>{perp.oi} OI</span>
            </div>
            <div className={styles.perpMark}>
              <b>${perp.mark.toFixed(2)}</b>
              <span style={{ color: APP_GREEN }}>{fmtPct(call.legs[0].chg)}</span>
            </div>
          </div>
        )}
        <motion.div
          key={amt}
          className={value ? styles.sheetAmountOn : styles.sheetAmount}
          initial={{ scale: amt ? 1.08 : 1 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 600, damping: 22 }}
        >
          ${amt || "0"}
        </motion.div>

        {perp ? (
          <>
            <span className={styles.perpSize}>
              Leveraged size <b>${(value * lev).toLocaleString("en-US", { maximumFractionDigits: 0 })}</b>
            </span>
            <div className={styles.perpRuler}>
              <LeverageCarousel value={lev} max={perp.maxLeverage} onChange={setLev} disabled={stage !== "entry"} />
            </div>
            {/* the app's risk row: liquidation on the left, the auto-close link on the right */}
            <div className={styles.perpRisk}>
              <span className={styles.perpLiq}>
                Liq. <b>${liq.toFixed(2)}</b>
              </span>
              <span className={styles.perpSlTp}>Add SL/TP</span>
            </div>
          </>
        ) : (
          /* the same idea card the detail screen shows, so the sheet can't disagree with it */
          <div className={styles.sheetIdea}>
            <IdeaCard idea={call.idea} size="compact" />
          </div>
        )}

        <div className={styles.keypad}>
          {KEYS.map((k) => (
            <motion.button
              key={k}
              type="button"
              whileTap={{ scale: 0.82, backgroundColor: "rgba(11,11,12,0.06)" }}
              onClick={() => stage === "entry" && press(k)}
              aria-label={k === "⌫" ? "Delete" : k}
            >
              {k === "⌫" ? (
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
                  <path d="M8 5h12v14H8l-6-7z M11.5 9.5l5 5M16.5 9.5l-5 5" />
                </svg>
              ) : (
                k
              )}
            </motion.button>
          ))}
        </div>

        <span className={styles.sheetAvail}>${AVAILABLE.toFixed(2)} available</span>
        <SlideToBuy disabled={!value} stage={stage} label={amountLabel} verb={perp ? "LONG" : "BUY"} onComplete={complete} />
      </motion.div>

      <AnimatePresence>
        {stage === "done" && <BuySuccess key="success" call={call} amount={amountLabel} leverage={perp ? lev : null} onClose={onClose} />}
      </AnimatePresence>
    </>
  );
}

/*
 * bread-mobile's SlideToConfirm: 4px padding, a square-ish thumb, the fill follows
 * the thumb, completes past 82%, and the same spring the app uses
 * (damping 22, stiffness 280, mass 0.75). A tap also confirms, since a website
 * visitor won't always think to drag.
 */
const SLIDE_SPRING = { type: "spring", damping: 22, stiffness: 280, mass: 0.75 } as const;
const SLIDE_THRESHOLD = 0.82;
const THUMB = 52;

function SlideToBuy({
  disabled,
  stage,
  label,
  verb = "BUY",
  onComplete,
}: {
  disabled: boolean;
  stage: Stage;
  label: string;
  verb?: "BUY" | "LONG";
  onComplete: () => void;
}) {
  const track = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const [max, setMax] = useState(200);
  const fill = useTransform(x, (v) => v + THUMB + 4);
  const textOpacity = useTransform(x, [0, max * 0.55], [1, 0]);
  const busy = stage !== "entry";

  useEffect(() => {
    const el = track.current;
    if (el) setMax(el.clientWidth - THUMB - 8);
  }, []);

  const finish = () => {
    animate(x, max, SLIDE_SPRING);
    onComplete();
  };

  return (
    <div ref={track} className={`${styles.slide} ${disabled ? styles.slideOff : ""} ${busy ? styles.slideBusy : ""}`}>
      <motion.span className={styles.slideFill} style={{ width: busy ? "100%" : fill }} />
      <motion.span className={styles.slideText} style={{ opacity: busy ? 1 : textOpacity }}>
        {busy ? (
          <>
            <i className={styles.spinner} aria-hidden="true" /> {verb === "LONG" ? "OPENING LONG…" : "BUYING…"}
          </>
        ) : disabled ? (
          verb
        ) : (
          `SLIDE TO ${verb} ${label}`
        )}
      </motion.span>
      {!busy && (
        <motion.button
          type="button"
          className={styles.slideThumb}
          style={{ x }}
          drag={disabled ? false : "x"}
          dragConstraints={{ left: 0, right: max }}
          dragElastic={0.04}
          dragMomentum={false}
          onTap={() => {
            if (!disabled && x.get() < 8) finish();
          }}
          onDragEnd={() => {
            if (x.get() >= max * SLIDE_THRESHOLD) finish();
            else animate(x, 0, SLIDE_SPRING);
          }}
          onKeyDown={(e) => {
            if (!disabled && (e.key === "Enter" || e.key === " ")) finish();
          }}
          aria-label={disabled ? "Enter an amount first" : `Slide to buy ${label}`}
          disabled={disabled}
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 6 6 6-6 6" />
          </svg>
        </motion.button>
      )}
    </div>
  );
}

/* bread-mobile's BURST_LAYOUT: where each coin lands, its tilt, blur and delay. */
const BURST_LAYOUT = [
  { x: 0.18, y: 0.13, s: 0.15, r: -25, blur: 4, d: 40 },
  { x: 0.88, y: 0.18, s: 0.17, r: 22, blur: 4.5, d: 120 },
  { x: 0.08, y: 0.36, s: 0.14, r: -35, blur: 3, d: 0 },
  // the app seats this one at y 0.42; in a phone this small that lands on the amount
  { x: 0.86, y: 0.3, s: 0.16, r: 15, blur: 0, d: 80 },
  { x: -0.06, y: 0.44, s: 0.2, r: -12, blur: 5, d: 160 },
  { x: 1.04, y: 0.52, s: 0.18, r: 28, blur: 5.5, d: 200 },
];

/** Hero pop: the app's HeroToken / HeroBasket spring. */
const HERO_POP = { type: "spring", damping: 9, stiffness: 130, mass: 0.7 } as const;
/** Burst coins: the app's BurstPiece spring. */
const BURST_POP = { type: "spring", damping: 10, stiffness: 110, mass: 0.8 } as const;

/**
 * The app's BuySuccessSheet, sized for the hero phone: the basket's coins pop out
 * of the trade and fan at the top, blurred coins burst to their seats, the verb
 * swaps from "buying" to "You bought", then the receipt and actions fade up.
 */
function BuySuccess({
  call,
  amount,
  leverage = null,
  onClose,
}: {
  call: HeroCall;
  amount: string;
  leverage?: number | null;
  onClose: () => void;
}) {
  const verbPast = leverage ? `You ${leverage.toFixed(1).replace(/\.0$/, "")}× longed` : "You bought";
  const W = 296;
  const H = 636;
  const cx = W / 2;
  const cy = H * 0.22;
  const coins = call.legs.map((l) => l.id);
  const spread = (coins.length - 1) * 38;
  const pnl = call.pnl.ALL;

  return (
    <motion.div
      className={styles.success}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.18 } }}
      transition={{ duration: 0.22 }}
      role="status"
      aria-label={`${verbPast} ${amount} of ${call.title}`}
    >
      {/* burst: each coin starts at the hero and springs out to its seat */}
      {BURST_LAYOUT.map((b, i) => {
        const size = b.s * W;
        const left = b.x * W - size / 2;
        const top = b.y * H - size / 2;
        return (
          <motion.span
            key={i}
            className={styles.successBurst}
            style={{ left, top, width: size, height: size, filter: b.blur ? `blur(${b.blur}px)` : undefined }}
            initial={{ x: cx - (left + size / 2), y: cy - (top + size / 2), scale: 0.1, rotate: 0, opacity: 0 }}
            animate={{ x: 0, y: 0, scale: 1, rotate: b.r, opacity: 1 }}
            transition={{ ...BURST_POP, delay: b.d / 1000 }}
          >
            <Logo id={coins[i % coins.length]} size={size} className={styles.successCoin} />
          </motion.span>
        );
      })}

      {/* hero basket: the legs fan out, each on its own 70ms delay */}
      <div className={styles.successHero}>
        {coins.map((id, i) => (
          <motion.span
            key={id}
            className={styles.successHeroCoin}
            style={{ zIndex: i }}
            initial={{ x: 0, y: 44, scale: 0.3, rotate: 0, opacity: 0 }}
            animate={{
              x: i * 38 - spread / 2,
              y: i % 2 ? 4 : -4,
              scale: 1,
              rotate: -12 + i * (coins.length > 1 ? 24 / (coins.length - 1) : 0),
              opacity: 1,
            }}
            transition={{ ...HERO_POP, delay: i * 0.07 }}
          >
            <Logo id={id} size={66} className={styles.successCoin} />
          </motion.span>
        ))}
      </div>

      <div className={styles.successCopy}>
        <span className={styles.successVerb}>
          <motion.span initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.14 }}>
            {leverage ? "going long" : "buying"}
          </motion.span>
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.06, duration: 0.28 }}>
            {verbPast}
          </motion.span>
        </span>
        <motion.b
          className={styles.successAmount}
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ ...HERO_POP, delay: 0.1 }}
        >
          {amount}
        </motion.b>

        <motion.div
          className={styles.successPill}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.3 }}
        >
          <LogoStack ids={coins} size={22} />
          <span style={{ color: pnl >= 0 ? APP_GREEN : APP_RED }}>{fmtPct(pnl)}</span>
        </motion.div>

        <motion.div
          className={styles.successIdea}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.32 }}
        >
          <IdeaCard idea={call.idea} size="compact" />
        </motion.div>
        <motion.span
          className={styles.successBy}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.36, duration: 0.3 }}
        >
          By buying this sandwich on Bread
        </motion.span>
      </div>

      {/* ActionsFade: share row + close arrive 220ms after the receipt */}
      <motion.div
        className={styles.successActions}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22 + 0.3, duration: 0.32 }}
      >
        <span className={styles.successShareLabel}>Share</span>
        <div className={styles.successShare} aria-hidden="true">
          <span className={styles.shareX}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </span>
          <span className={styles.shareIg}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" strokeWidth="2">
              <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.3" cy="6.7" r="1" fill="#fff" stroke="none" />
            </svg>
          </span>
          <span className={styles.shareMore}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <circle cx="5" cy="12" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="19" cy="12" r="2" />
            </svg>
          </span>
        </div>
        <button type="button" className={styles.successClose} onClick={onClose}>
          Close
        </button>
      </motion.div>
    </motion.div>
  );
}


/* ───────────────────────── manifesto ───────────────────────── */

// The problem, and only the problem: the "Introducing Bread" section below is the answer.
// It's about turning an idea into a trade, not about speed. A leading * marks the
// word the paragraph lands on.
const MANIFESTO =
  "You’ve seen a hundred great calls this year. A podcast at minute 94. A thread at 2am. A Substack you meant to read. You believed most of them. You traded none of them. They’re still sitting in your *bookmarks.";

/**
 * How far the reader is through `ref` (0 at its top reaching the viewport top, 1 at
 * its bottom reaching the viewport bottom), read straight from layout on each
 * scroll frame. Deliberately not framer's useScroll + per-word useTransform: those
 * get handed to native scroll timelines, which lit words out of order and froze
 * them in some browsers. One number, one source of truth, strictly in order.
 */
function useSectionProgress(ref: React.RefObject<HTMLElement | null>) {
  const [p, setP] = useState(0);
  useEffect(() => {
    let raf = 0;
    const read = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const dist = r.height - window.innerHeight;
      const next = dist > 0 ? Math.min(1, Math.max(0, -r.top / dist)) : r.top <= 0 ? 1 : 0;
      setP((prev) => (Math.abs(prev - next) < 0.0005 ? prev : next));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [ref]);
  return p;
}

/** Words light up in reading order; the last 15% of the scroll is a beat of rest on the full line. */
const MANIFESTO_SPAN = 0.85;

function Manifesto() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const progress = useSectionProgress(ref);
  const words = MANIFESTO.split(" ");
  // each word gets a window a little wider than its slot, so neighbours overlap and it reads as a sweep
  const lit = (progress / MANIFESTO_SPAN) * words.length;
  return (
    <section ref={ref} className={styles.manifesto}>
      <div className={styles.manifestoSticky}>
        <p className={styles.manifestoText}>
          {words.map((w, i) => {
            const lands = w.startsWith("*");
            const k = reduce ? 1 : Math.min(1, Math.max(0, (lit - i) / 1.6));
            return (
              <span key={i} style={{ opacity: 0.18 + 0.82 * k }} className={lands ? styles.manifestoLand : undefined}>
                {lands ? w.slice(1) : w}{" "}
              </span>
            );
          })}
        </p>
      </div>
    </section>
  );
}
/* ───────────────────────── what bread enables (ugly.cash 2×2) ───────────────────────── */

/* ───────────────────────── every market (carousel) ───────────────────────── */

const MARKETS: { title: string; body: string; tone: string; visual: React.ReactNode }[] = [
  {
    title: "US stocks, 24/5",
    body: "Tokenized equities that keep trading after the bell. Markets close, Solana doesn’t.",
    tone: styles.cardWhite,
    visual: <LogoGrid ids={["NVDA", "AAPL", "TSLA", "META", "GOOGL", "AMD", "PLTR", "NFLX", "COIN"]} />,
  },
  {
    title: "Shorts, through perps",
    body: "A bearish call routes to perps, so you can be right about things going down.",
    tone: styles.cardInk,
    visual: (
      <div className={styles.shortViz}>
        <Logo id="TSLA" size={44} />
        <b>Short · 2x</b>
        <span>+9.03%</span>
      </div>
    ),
  },
  {
    title: "Prediction markets",
    body: "“Will the Fed cut in December?” sits in the same sandwich as your stocks.",
    tone: styles.cardSky,
    visual: (
      <div className={styles.predictViz}>
        <span>Will the Fed cut in December?</span>
        <div>
          <b className={styles.yes}>Yes 62¢</b>
          <b className={styles.no}>No 38¢</b>
        </div>
      </div>
    ),
  },
  {
    title: "Crypto, side by side",
    body: "The majors held right alongside everything else, from one balance.",
    tone: styles.cardLilac,
    visual: <LogoGrid ids={["BTC", "ETH", "SOL", "XRP", "DOGE", "HOOD"]} />,
  },
  {
    title: "No gas, no seed phrase",
    body: "Sign in with email. We cover the network fees. It just feels like an app.",
    tone: styles.cardGreen,
    visual: <Image src="/money-jar.png" alt="" width={120} height={193} className={styles.jar} />,
  },
];

function LogoGrid({ ids }: { ids: BrandKey[] }) {
  return (
    <div className={styles.logoGrid}>
      {ids.map((id, i) => (
        <motion.span
          key={id}
          initial={{ opacity: 0, scale: 0.7 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ ...SETTLE, delay: i * 0.04 }}
        >
          <Logo id={id} size={48} />
        </motion.span>
      ))}
    </div>
  );
}

function Markets() {
  return (
    <section className={styles.section} id="markets">
      <Reveal>
        <h2 className={styles.h2}>If it trades, it fits in a sandwich</h2>
      </Reveal>
      <div className={styles.marketGrid}>
        {MARKETS.map((m, i) => (
          <Reveal key={m.title} className={styles.railItem} delay={(i % 3) * 0.06}>
            <div className={`${styles.card} ${styles.railCard} ${m.tone}`}>{m.visual}</div>
            <h3>{m.title}</h3>
            <p>{m.body}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ───────────────────────── statement + get it ───────────────────────── */

function Statement() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const x = useTransform(scrollYProgress, [0, 1], ["6%", "-6%"]);
  return (
    <section ref={ref} className={styles.statement}>
      <motion.h2 style={{ x }}>
        Billions must <span className={styles.highlight}>trade.</span>
      </motion.h2>
    </section>
  );
}

function GetIt() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const skyY = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);
  const sandwichY = useTransform(scrollYProgress, [0, 1], [60, -60]);
  const sandwichR = useTransform(scrollYProgress, [0, 1], [-10, 8]);

  return (
    <section ref={ref} className={styles.get}>
      <div className={styles.getCard}>
        <motion.div className={styles.getSky} style={{ y: skyY }}>
          <Image src="/hero-sky-v2.png" alt="" fill sizes="100vw" />
        </motion.div>
        <div className={styles.getCopy}>
          <h2>Get Bread on your iPhone.</h2>
          <p>Live on TestFlight. Free to join.</p>
          <div className={styles.getActions}>
            <a href={TESTFLIGHT_URL} className={styles.btnLight} target="_blank" rel="noopener noreferrer">
              <AppleIcon />
              Join on TestFlight
            </a>
            <span className={styles.getQr}>
              <Image src="/testflight-qr.svg" alt="QR code to join Bread on TestFlight" width={88} height={88} />
            </span>
          </div>
        </div>
        <motion.div className={styles.getSandwich} style={{ y: sandwichY, rotate: sandwichR }}>
          <Image src="/sandwich-cutout.png" alt="" width={640} height={567} />
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className={styles.footer}>
      <Image src="/breadtext.PNG" alt="Bread" width={2560} height={1088} className={styles.footerWordmark} />
      <div className={styles.footerRow}>
        <span>© {new Date().getFullYear()} Bread</span>
        <nav aria-label="Footer">
          <a href="/sandwiches">Sandwiches</a>
          <a href="/download">Download</a>
          <a href={X_URL} target="_blank" rel="noreferrer">
            X
          </a>
        </nav>
      </div>
      <p className={styles.fine}>
        Examples on this page are illustrative. Trading involves risk and nothing here is investment
        advice. Logos belong to their owners.
      </p>
    </footer>
  );
}

/* ───────────────────────── page ───────────────────────── */

export function Landing() {
  return (
    <div className={styles.page}>
      <Nav />
      <main>
        <Hero />
        <Manifesto />
        <div className={styles.sheet}>
          <IntroducingBread />
          <HowBread />
          <Markets />
          <Statement />
          <GetIt />
        </div>
      </main>
      <Footer />
    </div>
  );
}
