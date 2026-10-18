"use client";

import Image from "next/image";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { TESTFLIGHT_URL } from "@/lib/sandwiches";
import type { BrandKey } from "./brands";
import { Logo, LogoStack } from "./Logo";
import { Odometer } from "./Odometer";
import styles from "./landing.module.css";

const X_URL = "https://x.com/breadappfun";
const EASE = [0.22, 1, 0.36, 1] as const;

/* ───────────────────────── market data (illustrative) ───────────────────────── */

type Quote = { id: BrandKey; sym: string; name: string; price: number; chg: number };

const QUOTES: Quote[] = [
  { id: "NVDA", sym: "NVDA", name: "Nvidia", price: 182.4, chg: 2.14 },
  { id: "TSLA", sym: "TSLA", name: "Tesla", price: 412.86, chg: -1.32 },
  { id: "AAPL", sym: "AAPL", name: "Apple", price: 247.1, chg: 0.61 },
  { id: "META", sym: "META", name: "Meta", price: 716.3, chg: 1.08 },
  { id: "GOOGL", sym: "GOOGL", name: "Alphabet", price: 251.6, chg: 0.92 },
  { id: "AMD", sym: "AMD", name: "AMD", price: 233.08, chg: 4.4 },
  { id: "PLTR", sym: "PLTR", name: "Palantir", price: 178.2, chg: 3.71 },
  { id: "MA", sym: "MA", name: "Mastercard", price: 571.2, chg: -0.35 },
  { id: "AVGO", sym: "AVGO", name: "Broadcom", price: 349.9, chg: 1.66 },
  { id: "NFLX", sym: "NFLX", name: "Netflix", price: 1203.4, chg: -0.48 },
  { id: "HOOD", sym: "HOOD", name: "Robinhood", price: 139.7, chg: 5.2 },
  { id: "BTC", sym: "BTC", name: "Bitcoin", price: 108420, chg: 1.9 },
  { id: "ETH", sym: "ETH", name: "Ethereum", price: 3984.2, chg: 2.6 },
  { id: "SOL", sym: "SOL", name: "Solana", price: 196.4, chg: -3.1 },
  { id: "ARM", sym: "ARM", name: "Arm", price: 162.3, chg: 2.2 },
  { id: "SHOP", sym: "SHOP", name: "Shopify", price: 158.9, chg: 0.7 },
  { id: "MCD", sym: "MCD", name: "McDonald’s", price: 301.8, chg: -0.9 },
  { id: "SPOT", sym: "SPOT", name: "Spotify", price: 702.1, chg: 1.3 },
  { id: "NET", sym: "NET", name: "Cloudflare", price: 221.5, chg: 3.4 },
  { id: "QCOM", sym: "QCOM", name: "Qualcomm", price: 168.2, chg: -0.6 },
  { id: "NKE", sym: "NKE", name: "Nike", price: 68.9, chg: -1.7 },
  { id: "SBUX", sym: "SBUX", name: "Starbucks", price: 84.3, chg: 0.4 },
  { id: "PYPL", sym: "PYPL", name: "PayPal", price: 69.2, chg: 1.1 },
  { id: "ABNB", sym: "ABNB", name: "Airbnb", price: 124.6, chg: -0.3 },
];

const q = (id: BrandKey) => QUOTES.find((x) => x.id === id)!;

function fmtPrice(n: number) {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: n >= 10000 ? 0 : 2,
    maximumFractionDigits: n >= 10000 ? 0 : 2,
  });
}

function useJitter(base: number, enabled = true) {
  const [v, setV] = useState(base);
  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => {
      setV((prev) => {
        const next = prev * (1 + (Math.random() - 0.47) * 0.004);
        return Math.abs(next - base) / base > 0.03 ? base : next;
      });
    }, 2200 + Math.random() * 1600);
    return () => clearInterval(id);
  }, [base, enabled]);
  return v;
}

/* ───────────────────────── nav ───────────────────────── */

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <header className={`${styles.nav} ${scrolled ? styles.navScrolled : ""}`}>
      <nav className={styles.navInner} aria-label="Primary navigation">
        <a href="#top" className={styles.navBrand} aria-label="Bread home">
          <Image src="/logo.png" alt="" width={493} height={479} priority />
          <span>bread</span>
        </a>
        <div className={styles.navLinks}>
          <a href="#how">How it works</a>
          <a href="#feed">Feed</a>
          <a href="#markets">Markets</a>
          <a href={X_URL} target="_blank" rel="noreferrer">
            @breadappfun
          </a>
        </div>
        <div className={styles.navCta}>
          <a href={TESTFLIGHT_URL} target="_blank" rel="noopener noreferrer" className={styles.navBtn}>
            <AppleIcon /> Get the app
          </a>
          <span className={styles.qrPopover} aria-hidden="true">
            <Image src="/testflight-qr.svg" alt="" width={132} height={132} />
            <span>Scan with your iPhone camera</span>
          </span>
        </div>
      </nav>
    </header>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
      <path d="M16.4 12.6c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8 1.6 0 2 .8 3.4.8 1.4 0 2.3-1.3 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9 0 0-2.7-1-2.7-4.1ZM13.9 4.9c.7-.9 1.2-2 1-3.2-1 .1-2.3.7-3 1.6-.7.8-1.2 2-1.1 3.1 1.2.1 2.3-.6 3.1-1.5Z" />
    </svg>
  );
}

/* ───────────────────────── hero ───────────────────────── */

function Hero() {
  const ref = useRef<HTMLElement>(null);

  // Cursor parallax: each floating piece drifts at its own depth (--d).
  useEffect(() => {
    const node = ref.current;
    if (!node || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
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
  }, []);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const stageY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const phoneRotate = useTransform(scrollYProgress, [0, 1], [0, -4]);

  return (
    <section ref={ref} className={styles.hero} id="top">
      <div className={styles.heroGlow} aria-hidden="true" />

      <div className={styles.heroCopy}>
        <motion.a
          href={X_URL}
          target="_blank"
          rel="noreferrer"
          className={styles.heroBadge}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <span className={styles.heroBadgeDot} />
          Now in beta on iPhone
          <span className={styles.heroBadgeArrow}>→</span>
        </motion.a>

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
              Now you can <span className={styles.highlight}>buy it.</span>
            </motion.span>
          </span>
        </h1>

        <motion.p
          className={styles.heroSub}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.7, ease: EASE }}
        >
          Paste a podcast, a post, a newsletter. Bread finds the trade inside it and
          turns it into a sandwich — a one‑tap basket of the stocks, perps and
          markets behind the idea.
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
      </div>

      <motion.div
        className={styles.heroStage}
        style={{ y: stageY }}
        initial={{ opacity: 0, y: 120 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 1.1, ease: EASE }}
      >
        {/* sources on the left */}
        <Float className={styles.fTweet} depth={26} delay={0.7}>
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
              AI capex isn&apos;t slowing down. every hyperscaler just raised guidance
              again. <span className={styles.tweetHot}>chips are still the trade.</span>
            </p>
            <div className={styles.tweetStats}>
              <span>♡ 4.2K</span>
              <span>↻ 812</span>
              <span>◷ 391K</span>
            </div>
          </div>
        </Float>

        <Float className={styles.fYoutube} depth={40} delay={0.85}>
          <div className={styles.yt}>
            <div className={styles.ytThumb}>
              <Image src="/youtube-k4fzywme6u.jpg" alt="" fill sizes="280px" />
              <span className={styles.ytTime}>1:42:07</span>
            </div>
            <div className={styles.ytMeta}>
              <Logo id="youtube" size={22} />
              <div>
                <b>Macro pod, ep. 212</b>
                <span>found 3 trades at 14:32</span>
              </div>
            </div>
          </div>
        </Float>

        <Float className={styles.fSubstack} depth={18} delay={1}>
          <div className={styles.note}>
            <Logo id="substack" size={22} />
            <p>&ldquo;the market still hasn&apos;t priced the next leg of AI&rdquo;</p>
          </div>
        </Float>

        {/* the phone */}
        <motion.div className={styles.phoneWrap} style={{ rotate: phoneRotate }}>
          <Phone />
        </motion.div>

        {/* markets on the right */}
        <Float className={styles.fQuoteA} depth={30} delay={0.8}>
          <QuoteCard quote={q("NVDA")} />
        </Float>
        <Float className={styles.fQuoteB} depth={46} delay={0.95}>
          <QuoteCard quote={q("AVGO")} />
        </Float>
        <Float className={styles.fQuoteC} depth={22} delay={1.1}>
          <QuoteCard quote={q("AMD")} />
        </Float>

        <Float className={styles.fToast} depth={56} delay={1.6}>
          <div className={styles.toast}>
            <span className={styles.toastIcon}>🥪</span>
            <div>
              <b>Sandwich bought</b>
              <span>$50.00 · 3 legs · no gas</span>
            </div>
          </div>
        </Float>
      </motion.div>
    </section>
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

const PHONE_LEGS: { id: BrandKey; w: number }[] = [
  { id: "NVDA", w: 40 },
  { id: "AVGO", w: 35 },
  { id: "AMD", w: 25 },
];

function Phone() {
  return (
    <div className={styles.phone}>
      <div className={styles.phoneIsland} />
      <div className={styles.phoneScreen}>
        <div className={styles.phoneStatus}>
          <span>9:41</span>
          <span className={styles.phoneStatusIcons}>
            <i />
            <i />
            <i />
          </span>
        </div>

        <div className={styles.phoneTop}>
          <span className={styles.phoneBack}>‹</span>
          <span>Sandwich</span>
          <span className={styles.phoneShare}>↗</span>
        </div>

        <div className={styles.phoneAuthor}>
          <Image src="/avatar-jukan.jpg" alt="" width={30} height={30} />
          <span>
            from <b>@jukan05</b> on <Logo id="x" size={16} />
          </span>
        </div>

        <h3 className={styles.phoneThesis}>Chips are still the AI trade</h3>

        <div className={styles.phonePnl}>
          <Odometer value="+18.42%" />
          <span>since posted</span>
        </div>

        <svg viewBox="0 0 260 96" className={styles.phoneChart} preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="phoneFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#20e600" stopOpacity="0.28" />
              <stop offset="1" stopColor="#20e600" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            className={styles.chartFill}
            d="M0 78 C18 74 24 70 38 72 S60 60 76 62 S98 50 112 54 S136 40 150 42 S172 30 188 34 S210 18 226 20 S248 8 260 6 L260 96 L0 96Z"
            fill="url(#phoneFill)"
          />
          <path
            className={styles.chartLine}
            d="M0 78 C18 74 24 70 38 72 S60 60 76 62 S98 50 112 54 S136 40 150 42 S172 30 188 34 S210 18 226 20 S248 8 260 6"
            fill="none"
            stroke="#18c400"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
        </svg>
        <div className={styles.phoneRange}>
          {["1D", "1W", "1M", "ALL"].map((r) => (
            <span key={r} className={r === "1W" ? styles.phoneRangeOn : undefined}>
              {r}
            </span>
          ))}
        </div>

        <ul className={styles.phoneLegs}>
          {PHONE_LEGS.map((l) => (
            <li key={l.id}>
              <Logo id={l.id} size={30} />
              <div>
                <b>{q(l.id).sym}</b>
                <span>{q(l.id).name}</span>
              </div>
              <em>{l.w}%</em>
            </li>
          ))}
        </ul>

        <div className={styles.phoneBuy}>Buy this sandwich</div>
      </div>
    </div>
  );
}

/* ───────────────────────── ticker wall ───────────────────────── */

function TickerWall() {
  const rowA = QUOTES.slice(0, 12);
  const rowB = QUOTES.slice(12);
  return (
    <section className={styles.wall} aria-label="Markets you can trade">
      <p className={styles.wallLabel}>
        Stocks, perps and prediction markets — <b>all in one sandwich.</b>
      </p>
      {[rowA, rowB].map((row, r) => (
        <div key={r} className={styles.wallRow}>
          <div className={`${styles.wallTrack} ${r ? styles.wallTrackReverse : ""}`}>
            {[...row, ...row].map((x, i) => (
              <span key={`${x.sym}${i}`} className={styles.chip} aria-hidden={i >= row.length}>
                <Logo id={x.id} size={30} />
                <b>{x.sym}</b>
                <span>${fmtPrice(x.price)}</span>
                <em className={x.chg >= 0 ? styles.up : styles.down}>
                  {x.chg >= 0 ? "+" : "−"}
                  {Math.abs(x.chg).toFixed(2)}%
                </em>
              </span>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

/* ───────────────────────── manifesto ───────────────────────── */

const MANIFESTO =
  "Every day someone on the internet calls the next big trade. On a podcast at minute 94. In a post at 2am. In a newsletter nobody finishes. By the time you find it, it’s priced in. Bread reads it all — and hands you the trade.";

function ManifestoWord({
  word,
  progress,
  range,
}: {
  word: string;
  progress: MotionValue<number>;
  range: [number, number];
}) {
  const opacity = useTransform(progress, range, [0.16, 1]);
  const hot = /priced|trade\.|Bread/.test(word);
  return (
    <motion.span style={{ opacity }} className={hot ? styles.manifestoHot : undefined}>
      {word}{" "}
    </motion.span>
  );
}

function Manifesto() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const words = MANIFESTO.split(" ");
  return (
    <section ref={ref} className={styles.manifesto}>
      <div className={styles.manifestoSticky}>
        <span className={styles.labelDark}>
          <i /> Why Bread
        </span>
        <p className={styles.manifestoText}>
          {words.map((w, i) => (
            <ManifestoWord
              key={i}
              word={w}
              progress={scrollYProgress}
              range={[(i / words.length) * 0.82, ((i + 1) / words.length) * 0.82]}
            />
          ))}
        </p>
      </div>
    </section>
  );
}

/* ───────────────────────── how it works ───────────────────────── */

const STEPS = [
  {
    n: "01",
    title: "Paste anything.",
    body: "A YouTube link, an X post, a Substack, a Reddit thread. If a human said it out loud, Bread can read it.",
  },
  {
    n: "02",
    title: "Bread finds the alpha.",
    body: "It listens to the whole thing and pulls out every tradable moment — timestamped, with the exact quote.",
  },
  {
    n: "03",
    title: "Buy the sandwich.",
    body: "Each idea becomes a sandwich: the right stocks, perps or prediction markets, weighted and ready in one tap.",
  },
];

function HowItWorks() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [step, setStep] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setStep(Math.min(STEPS.length - 1, Math.max(0, Math.floor(v * STEPS.length))));
  });

  return (
    <section ref={ref} className={styles.how} id="how">
      <div className={styles.howSticky}>
        <div className={styles.howLeft}>
          <span className={styles.label}>
            <i /> How a sandwich is made
          </span>
          <ol className={styles.howList}>
            {STEPS.map((s, i) => (
              <li key={s.n} className={i === step ? styles.howItemOn : styles.howItem}>
                <span className={styles.howNum}>{s.n}</span>
                <div>
                  <h2>{s.title}</h2>
                  <AnimatePresence initial={false}>
                    {i === step && (
                      <motion.p
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.45, ease: EASE }}
                      >
                        {s.body}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className={styles.howRight}>
          <div className={styles.howFrame}>
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                className={styles.howCard}
                initial={{ opacity: 0, y: 40, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -30, scale: 0.97 }}
                transition={{ type: "spring", stiffness: 220, damping: 26 }}
              >
                {step === 0 && <PasteDemo />}
                {step === 1 && <MomentsDemo />}
                {step === 2 && <SandwichDemo />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

function useTyped(text: string, speed = 34) {
  const [out, setOut] = useState("");
  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setOut(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return out;
}

const SOURCES: { id: BrandKey; label: string }[] = [
  { id: "youtube", label: "YouTube" },
  { id: "x", label: "X" },
  { id: "substack", label: "Substack" },
  { id: "reddit", label: "Reddit" },
  { id: "podcasts", label: "Podcasts" },
  { id: "tiktok", label: "TikTok" },
];

function PasteDemo() {
  const url = "youtube.com/watch?v=k4fzywme6u";
  const typed = useTyped(url);
  const done = typed.length === url.length;
  return (
    <div className={styles.demo}>
      <div className={styles.pasteBox}>
        <Logo id="youtube" size={30} />
        <span className={styles.pasteText}>
          {typed}
          <i className={styles.caret} />
        </span>
        <span className={`${styles.pasteGo} ${done ? styles.pasteGoReady : ""}`}>Cook</span>
      </div>
      <div className={styles.sourceRow}>
        {SOURCES.map((s, i) => (
          <motion.span
            key={s.label}
            className={styles.sourceChip}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 + i * 0.06 }}
          >
            <Logo id={s.id} size={20} />
            {s.label}
          </motion.span>
        ))}
      </div>
      <div className={styles.thumbRow}>
        <div className={styles.thumb}>
          <Image src="/youtube-k4fzywme6u.jpg" alt="" fill sizes="360px" />
        </div>
        <div className={styles.thumbMeta}>
          <b>Macro pod, ep. 212</b>
          <span>1h 42m · 3 hosts</span>
          <div className={styles.progress}>
            <motion.i
              initial={{ width: "0%" }}
              animate={{ width: done ? "100%" : "6%" }}
              transition={{ duration: 1.6, ease: "easeInOut" }}
            />
          </div>
          <span className={styles.progressLabel}>{done ? "Listening to all 102 minutes…" : "Waiting for a link"}</span>
        </div>
      </div>
    </div>
  );
}

const MOMENTS: { t: string; q: string; tag: string; side: "long" | "short" | "yes"; ids: BrandKey[] }[] = [
  { t: "14:32", q: "Every hyperscaler raised capex again. The chip trade isn’t done.", tag: "Long", side: "long", ids: ["NVDA", "AVGO", "AMD"] },
  { t: "38:05", q: "EV demand is rolling over. I’d be short into earnings.", tag: "Short", side: "short", ids: ["TSLA"] },
  { t: "1:07:44", q: "A December cut is way more likely than people think.", tag: "Yes", side: "yes", ids: [] },
];

function MomentsDemo() {
  return (
    <div className={styles.demo}>
      <div className={styles.momentsHead}>
        <span className={styles.liveDot} /> 3 trades found in 102 minutes
      </div>
      <ul className={styles.moments}>
        {MOMENTS.map((m, i) => (
          <motion.li
            key={m.t}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.12 + i * 0.18, duration: 0.5, ease: EASE }}
          >
            <span className={styles.momentTime}>{m.t}</span>
            <p>
              <mark className={styles.momentMark} style={{ animationDelay: `${0.45 + i * 0.18}s` }}>
                {m.q}
              </mark>
            </p>
            <div className={styles.momentFoot}>
              <span className={`${styles.momentTag} ${styles[`tag_${m.side}`]}`}>{m.tag}</span>
              {m.ids.length ? <LogoStack ids={m.ids} size={24} /> : <span className={styles.momentPm}>Fed cut · Dec</span>}
            </div>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

function SandwichDemo() {
  return (
    <div className={styles.demo}>
      <div className={styles.sandwichTop}>
        <Image src="/sandwich-cutout.png" alt="" width={64} height={64} className={styles.sandwichIcon} />
        <div>
          <b>Chips are still the AI trade</b>
          <span>from 14:32 · 3 legs · long</span>
        </div>
      </div>
      {PHONE_LEGS.map((l, i) => (
        <div key={l.id} className={styles.leg}>
          <Logo id={l.id} size={36} />
          <div className={styles.legName}>
            <b>{q(l.id).sym}</b>
            <span>{q(l.id).name}</span>
          </div>
          <div className={styles.legBar}>
            <motion.i
              initial={{ width: 0 }}
              animate={{ width: `${l.w}%` }}
              transition={{ delay: 0.2 + i * 0.12, duration: 0.8, ease: EASE }}
            />
          </div>
          <em>{l.w}%</em>
        </div>
      ))}
      <div className={styles.buyRow}>
        <div className={styles.buyAmount}>
          <span>Amount</span>
          <Odometer value="$50.00" />
        </div>
        <button className={styles.buyBtn} type="button">
          Buy sandwich
        </button>
      </div>
    </div>
  );
}

/* ───────────────────────── feed ───────────────────────── */

type Post = {
  u: string;
  img?: string;
  initial?: string;
  color?: string;
  src: BrandKey;
  thesis: string;
  pnl: number;
  legs: BrandKey[];
  extra?: string;
  points: number[];
};

const FEED: Post[] = [
  { u: "jukan05", img: "/avatar-jukan.jpg", src: "x", thesis: "Chips are still the AI trade", pnl: 18.42, legs: ["NVDA", "AVGO", "AMD"], points: [8, 10, 9, 14, 13, 18, 17, 22, 26] },
  { u: "degentrading", img: "/avatar-degentrading.jpg", src: "youtube", thesis: "Robinhood becomes the crypto bank", pnl: 21.4, legs: ["HOOD", "BTC"], points: [6, 9, 8, 12, 16, 15, 20, 24, 27] },
  { u: "macro_mo", initial: "M", color: "#ff2d87", src: "substack", thesis: "Short the EV hype into earnings", pnl: 9.03, legs: ["TSLA"], extra: "short", points: [24, 22, 23, 18, 19, 15, 12, 13, 10] },
  { u: "vzy", initial: "V", color: "#111214", src: "x", thesis: "Streaming wars are over. Netflix won.", pnl: -3.18, legs: ["NFLX", "SPOT"], points: [16, 18, 15, 17, 14, 15, 12, 13, 11] },
  { u: "pizzaguy", initial: "P", color: "#ff4500", src: "reddit", thesis: "Bitcoin to new highs by Q1", pnl: 12.6, legs: ["BTC", "ETH", "SOL"], points: [10, 9, 12, 11, 15, 14, 18, 17, 21] },
  { u: "techbro", initial: "T", color: "#0467df", src: "podcasts", thesis: "Ads + AI = the most boring 10x", pnl: 7.77, legs: ["META", "GOOGL"], points: [9, 11, 10, 12, 13, 12, 15, 16, 18] },
];

function Spark({ points, up }: { points: number[]; up: boolean }) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const d = points
    .map((p, i) => `${i ? "L" : "M"}${(i / (points.length - 1)) * 100} ${36 - ((p - min) / (max - min || 1)) * 30}`)
    .join(" ");
  const color = up ? "var(--up)" : "var(--down)";
  return (
    <svg viewBox="0 0 100 40" preserveAspectRatio="none" className={styles.feedSpark} aria-hidden="true">
      <path d={`${d} L100 40 L0 40Z`} fill={color} opacity="0.1" />
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function Feed() {
  return (
    <section className={styles.feed} id="feed">
      <div className={styles.sectionHead}>
        <span className={styles.label}>
          <i /> The feed
        </span>
        <h2>
          What the internet is <span className={styles.highlight}>cooking</span> today.
        </h2>
        <p>Every take becomes a live position you can copy in one tap — and everyone can see how it&apos;s doing.</p>
      </div>

      <div className={styles.feedGrid}>
        {FEED.map((f, i) => {
          const up = f.pnl >= 0;
          return (
            <motion.article
              key={f.u}
              className={styles.feedCard}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: (i % 3) * 0.08, duration: 0.7, ease: EASE }}
            >
              <div className={styles.feedUser}>
                {f.img ? (
                  <Image src={f.img} alt="" width={36} height={36} />
                ) : (
                  <span className={styles.feedAvatar} style={{ background: f.color }}>
                    {f.initial}
                  </span>
                )}
                <div>
                  <b>@{f.u}</b>
                  <span>via {f.src === "podcasts" ? "Podcasts" : f.src === "x" ? "X" : f.src[0].toUpperCase() + f.src.slice(1)}</span>
                </div>
                <Logo id={f.src} size={24} className={styles.feedSrc} />
              </div>
              <h3 className={styles.feedThesis}>{f.thesis}</h3>
              <Spark points={f.points} up={up} />
              <div className={styles.feedFoot}>
                <LogoStack ids={f.legs} size={28} />
                {f.extra && <span className={styles.feedShort}>{f.extra}</span>}
                <span className={`${styles.pnl} ${up ? styles.pnlUp : styles.pnlDown}`}>
                  {up ? "+" : "−"}
                  {Math.abs(f.pnl).toFixed(2)}%
                </span>
              </div>
            </motion.article>
          );
        })}
      </div>
      <p className={styles.fineprint}>Cards are illustrative examples of the Bread feed.</p>
    </section>
  );
}

/* ───────────────────────── markets bento ───────────────────────── */

const GRID_LOGOS: BrandKey[] = [
  "NVDA", "AAPL", "TSLA", "META", "GOOGL", "AMD", "PLTR",
  "NFLX", "AVGO", "BTC", "HOOD", "ARM", "SHOP", "MA",
  "SPOT", "NET", "QCOM", "NKE", "SBUX", "PYPL", "ABNB",
];

function Markets() {
  return (
    <section className={styles.markets} id="markets">
      <div className={styles.sectionHead}>
        <span className={styles.label}>
          <i /> Every market, one app
        </span>
        <h2>
          If it trades, it fits <br className={styles.brDesk} />
          in a sandwich.
        </h2>
      </div>

      <div className={styles.bento}>
        <Tile className={styles.tileStocks} dark>
          <div className={styles.logoGrid}>
            {GRID_LOGOS.map((id, i) => (
              <motion.span
                key={id}
                initial={{ opacity: 0, scale: 0.6 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: (i % 7) * 0.04 + Math.floor(i / 7) * 0.08, type: "spring", stiffness: 260, damping: 18 }}
              >
                <Logo id={id} size={52} />
              </motion.span>
            ))}
          </div>
          <div className={styles.tileText}>
            <h3>Stocks, 24/5.</h3>
            <p>NVDA at 3am on a Tuesday. Tokenized US equities that don&apos;t close for the night.</p>
          </div>
        </Tile>

        <Tile className={styles.tileShort}>
          <div className={styles.shortCard}>
            <div className={styles.shortHead}>
              <Logo id="TSLA" size={40} />
              <div>
                <b>TSLA</b>
                <span>Short · 2x</span>
              </div>
              <span className={styles.shortPnl}>+9.03%</span>
            </div>
            <svg viewBox="0 0 200 70" className={styles.shortChart} preserveAspectRatio="none" aria-hidden="true">
              <path d="M0 12 L20 16 L36 10 L54 22 L72 20 L90 34 L108 30 L126 44 L144 40 L162 54 L180 50 L200 62" fill="none" stroke="var(--down)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            </svg>
          </div>
          <div className={styles.tileText}>
            <h3>Short anything.</h3>
            <p>Bearish take? Bread routes it to perps so you can bet against it.</p>
          </div>
        </Tile>

        <Tile className={styles.tilePredict}>
          <div className={styles.predict}>
            <span className={styles.predictQ}>Will the Fed cut in December?</span>
            <div className={styles.predictBar}>
              <motion.i
                initial={{ width: 0 }}
                whileInView={{ width: "62%" }}
                viewport={{ once: true }}
                transition={{ duration: 1.1, ease: EASE }}
              />
            </div>
            <div className={styles.predictBtns}>
              <span className={styles.yes}>Yes 62¢</span>
              <span className={styles.no}>No 38¢</span>
            </div>
          </div>
          <div className={styles.tileText}>
            <h3>Prediction markets.</h3>
            <p>&ldquo;Will the Fed cut?&rdquo; is a trade now. Yes and No, right next to your stocks.</p>
          </div>
        </Tile>

        <Tile className={styles.tileGas} green>
          <div className={styles.gasVisual}>
            <div className={styles.signIn}>
              <span>Continue with email</span>
              <i>you@gmail.com</i>
            </div>
            <Image src="/money-jar.png" alt="" width={120} height={193} className={styles.jar} />
          </div>
          <div className={styles.tileText}>
            <h3>No gas. No seed phrase.</h3>
            <p>Sign in with email. We cover network fees. It just feels like an app.</p>
          </div>
        </Tile>
      </div>
    </section>
  );
}

function Tile({
  className,
  dark,
  green,
  children,
}: {
  className: string;
  dark?: boolean;
  green?: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      className={`${styles.tile} ${dark ? styles.tileDark : ""} ${green ? styles.tileGreen : ""} ${className}`}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/* ───────────────────────── CTA + footer ───────────────────────── */

function Cta() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const skyY = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);
  const sandwichY = useTransform(scrollYProgress, [0, 1], [120, -120]);
  const sandwichR = useTransform(scrollYProgress, [0, 1], [-16, 12]);

  return (
    <section ref={ref} className={styles.cta}>
      <div className={styles.ctaCard}>
        <motion.div className={styles.ctaSky} style={{ y: skyY }}>
          <Image src="/hero-sky-v2.png" alt="" fill sizes="100vw" />
        </motion.div>
        <motion.div className={styles.ctaSandwich} style={{ y: sandwichY, rotate: sandwichR }}>
          <Image src="/sandwich-cutout.png" alt="" width={320} height={320} />
        </motion.div>
        <div className={styles.ctaCopy}>
          <h2>
            Stop scrolling past alpha.
            <br />
            Start eating it.
          </h2>
          <div className={styles.ctaActions}>
            <a href={TESTFLIGHT_URL} className={styles.btnPrimary} target="_blank" rel="noopener noreferrer">
              <AppleIcon />
              <span className={styles.btnStack}>
                <small>Join the beta on</small>
                TestFlight
              </span>
            </a>
            <div className={styles.ctaQr}>
              <Image src="/testflight-qr.svg" alt="TestFlight QR code" width={84} height={84} />
              <span>
                Or scan
                <br />
                with iPhone
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerTop}>
        <div className={styles.footerBrand}>
          <Image src="/logo.png" alt="" width={493} height={479} />
          <p>Ideas become trades.</p>
        </div>
        <div className={styles.footerCols}>
          <div>
            <span>Product</span>
            <a href="#how">How it works</a>
            <a href="#feed">Feed</a>
            <a href="/sandwiches">Sandwiches</a>
          </div>
          <div>
            <span>Get Bread</span>
            <a href={TESTFLIGHT_URL} target="_blank" rel="noopener noreferrer">TestFlight</a>
            <a href="/download">Download</a>
          </div>
          <div>
            <span>Social</span>
            <a href={X_URL} target="_blank" rel="noreferrer">X / Twitter</a>
          </div>
        </div>
      </div>
      <Image src="/breadtext.PNG" alt="Bread" width={2560} height={1088} className={styles.footerWordmark} />
      <div className={styles.footerBottom}>
        <span>© {new Date().getFullYear()} Bread</span>
        <p>
          Prices, positions and returns shown are illustrative. Trading involves risk; nothing here is
          investment advice. Logos are trademarks of their respective owners.
        </p>
      </div>
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
        <TickerWall />
        <Manifesto />
        <div className={styles.curtain}>
          <HowItWorks />
          <Feed />
          <Markets />
          <Cta />
        </div>
      </main>
      <Footer />
    </div>
  );
}
