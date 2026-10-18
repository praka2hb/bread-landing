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
import { Odometer } from "./Odometer";
import styles from "./landing.module.css";

const X_URL = "https://x.com/breadappfun";

/* ───────────────────────── menubar ───────────────────────── */

function useClock() {
  const [now, setNow] = useState<string>("");
  useEffect(() => {
    const tick = () =>
      setNow(
        new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
      );
    tick();
    const id = setInterval(tick, 15_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function MenuBar() {
  const clock = useClock();
  return (
    <header className={styles.menubar}>
      <nav className={styles.menubarInner} aria-label="Primary navigation">
        <div className={styles.menuLeft}>
          <a href="#top" className={styles.menuBrand}>
            bread
          </a>
          <a href="#how">how it works</a>
          <a href="#feed">feed</a>
          <a href="#markets">markets</a>
          <a href={X_URL} target="_blank" rel="noreferrer">
            x.com
          </a>
        </div>

        <a href="#top" className={styles.menuLogo} aria-label="Bread home">
          <Image src="/logo.png" alt="" width={493} height={479} priority />
        </a>

        <div className={styles.menuRight}>
          <span className={styles.menuStatus} aria-hidden="true">
            <WifiIcon />
            <BatteryIcon />
          </span>
          <span className={styles.menuClock} suppressHydrationWarning>
            {clock}
          </span>
          <div className={styles.getBread}>
            <a href={TESTFLIGHT_URL} target="_blank" rel="noopener noreferrer">
              <span className={styles.getBreadDot} />
              get bread
            </a>
            <span className={styles.qrPopover} aria-hidden="true">
              <Image src="/testflight-qr.svg" alt="" width={140} height={140} />
              <span>scan with your iPhone</span>
            </span>
          </div>
        </div>
      </nav>
    </header>
  );
}

function WifiIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
      <path d="M12 18.5a1.75 1.75 0 1 1 0 3.5 1.75 1.75 0 0 1 0-3.5Zm0-5.5c2 0 3.8.8 5.1 2.1l-1.6 1.6A5 5 0 0 0 12 15.3a5 5 0 0 0-3.5 1.4l-1.6-1.6A7.2 7.2 0 0 1 12 13Zm0-5c3.4 0 6.4 1.3 8.7 3.5l-1.6 1.6A10 10 0 0 0 12 10.3a10 10 0 0 0-7.1 2.8L3.3 11.5A12.3 12.3 0 0 1 12 8Zm0-5c4.7 0 8.9 1.8 12 4.8l-1.6 1.6A14.7 14.7 0 0 0 12 5.3 14.7 14.7 0 0 0 1.6 9.4L0 7.8A17 17 0 0 1 12 3Z" />
    </svg>
  );
}

function BatteryIcon() {
  return (
    <svg viewBox="0 0 28 14" width="24" height="12" fill="none">
      <rect x="0.5" y="0.5" width="23" height="13" rx="3.5" stroke="currentColor" opacity="0.45" />
      <rect x="2.5" y="2.5" width="16" height="9" rx="2" fill="currentColor" />
      <path d="M25.5 4.5v5c.9-.3 1.5-1.4 1.5-2.5s-.6-2.2-1.5-2.5Z" fill="currentColor" opacity="0.45" />
    </svg>
  );
}

/* ───────────────────────── hero ───────────────────────── */

type Ticker = { sym: string; name: string; price: number; color: string };

const TICKERS: Ticker[] = [
  { sym: "NVDA", name: "Nvidia", price: 182.4, color: "#76b900" },
  { sym: "TSLA", name: "Tesla", price: 412.86, color: "#e31937" },
  { sym: "GOLD", name: "Gold", price: 3961.2, color: "#d4a017" },
];

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function useJitter(base: number) {
  const [v, setV] = useState(base);
  useEffect(() => {
    const id = setInterval(() => {
      setV((prev) => {
        const next = prev * (1 + (Math.random() - 0.48) * 0.006);
        return Math.abs(next - base) / base > 0.04 ? base : next;
      });
    }, 2600 + Math.random() * 1400);
    return () => clearInterval(id);
  }, [base]);
  return v;
}

function TickerCard({ t, className }: { t: Ticker; className: string }) {
  const price = useJitter(t.price);
  const change = ((price - t.price) / t.price) * 100 + 1.2;
  const up = change >= 0;
  return (
    <div className={`${styles.tickerCard} ${className}`}>
      <div className={styles.tickerHead}>
        <span className={styles.tickerLogo} style={{ background: t.color }}>
          {t.sym[0]}
        </span>
        <span className={styles.tickerName}>{t.name}</span>
      </div>
      <Odometer value={`$${fmt(price)}`} className={styles.tickerPrice} />
      <div className={styles.tickerFoot}>
        <span style={{ color: up ? "var(--long)" : "var(--short)" }}>
          {up ? "▲" : "▼"} {Math.abs(change).toFixed(2)}%
        </span>
        <Sparkline up={up} />
      </div>
    </div>
  );
}

function Sparkline({ up }: { up: boolean }) {
  const d = up
    ? "M0 22 L8 18 L16 20 L24 13 L32 15 L40 9 L48 11 L56 4 L64 6"
    : "M0 6 L8 9 L16 7 L24 14 L32 12 L40 18 L48 16 L56 22 L64 20";
  return (
    <svg viewBox="0 0 64 26" width="64" height="26" className={styles.spark}>
      <path d={d} fill="none" stroke={up ? "var(--long)" : "var(--short)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Hero() {
  const ref = useRef<HTMLElement>(null);

  // heyclicky-style parallax: scraps drift opposite to the cursor at their own depth.
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

  return (
    <section ref={ref} className={styles.hero} id="top">
      <div className={styles.scraps} aria-hidden="true">
        <div className={`${styles.scrap} ${styles.scrapTweet}`} style={{ ["--d" as string]: 28 }}>
          <div className={styles.scrapInner}>
            <div className={styles.tweetHead}>
              <Image src="/avatar-jukan.jpg" alt="" width={28} height={28} />
              <b>jukan</b>
              <span>@jukan05 · 2h</span>
            </div>
            <p>memory is the new oil. HBM sold out thru 2027 👀</p>
          </div>
        </div>

        <div className={`${styles.scrap} ${styles.scrapYoutube}`} style={{ ["--d" as string]: 44 }}>
          <div className={styles.scrapInner}>
            <div className={styles.winBar}>
              <i /><i /><i />
              <span>podcast.mp4</span>
            </div>
            <div className={styles.ytThumb}>
              <Image src="/youtube-k4fzywme6u.jpg" alt="" fill sizes="240px" />
              <span className={styles.ytPlay}>▶</span>
              <span className={styles.ytTime}>1:42:07</span>
            </div>
          </div>
        </div>

        <div className={`${styles.scrap} ${styles.scrapNote}`} style={{ ["--d" as string]: 18 }}>
          <div className={styles.scrapInner}>
            <span className={styles.noteLabel}>substack · 2:14am</span>
            <p>“the market still hasn’t priced the grid buildout”</p>
          </div>
        </div>

        <div className={`${styles.scrap} ${styles.scrapIE}`} style={{ ["--d" as string]: 60 }}>
          <div className={styles.scrapInner}>
            <Image src="/internet-explorer-e.png" alt="" width={377} height={512} />
          </div>
        </div>

        <div className={`${styles.scrap} ${styles.scrapKao1}`} style={{ ["--d" as string]: 35 }}>
          <span className={styles.kaomoji}>( ˘▽˘)っ🥪</span>
        </div>
        <div className={`${styles.scrap} ${styles.scrapKao2}`} style={{ ["--d" as string]: 22 }}>
          <span className={styles.kaomoji}>¯\_(ツ)_/¯ buy?</span>
        </div>

        <div className={`${styles.scrap} ${styles.scrapSandwich}`} style={{ ["--d" as string]: 70 }}>
          <div className={styles.scrapInner}>
            <Image src="/sandwich-cutout.png" alt="" width={512} height={512} />
          </div>
        </div>

        <div className={`${styles.scrap} ${styles.scrapSticky}`} style={{ ["--d" as string]: 30 }}>
          <div className={styles.scrapInner}>long the
            <br />
            <b>vibes</b> ✏️
          </div>
        </div>
      </div>

      <div className={styles.heroCopy}>
        <motion.div
          className={styles.wordmarkWrap}
          initial={{ scale: 0.6, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 16, mass: 0.9 }}
        >
          <Image
            src="/breadtext.PNG"
            alt="Bread"
            width={2560}
            height={1088}
            priority
            className={styles.wordmark}
          />
        </motion.div>

        <motion.h1
          className={styles.heroTitle}
          initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: 0.25, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          the internet is full of alpha.
          <br />
          <em>now you can buy it.</em>
        </motion.h1>

        <motion.p
          className={styles.heroSub}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          paste a podcast, a tweet, a substack. bread turns the idea into a
          sandwich — a one-tap basket of the stocks, perps and markets behind it.
        </motion.p>

        <motion.div
          className={styles.heroCtas}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.6 }}
        >
          <a href={TESTFLIGHT_URL} className={styles.btnPrimary} target="_blank" rel="noopener noreferrer">
            <AppleIcon /> get it on iPhone
          </a>
          <a href="#how" className={styles.btnGhost}>
            how it works ↓
          </a>
        </motion.div>
        <span className={styles.heroFine}>free on testflight · no gas, ever</span>
      </div>

      <motion.div
        className={styles.heroStage}
        initial={{ opacity: 0, y: 80 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      >
        <PhoneSandwich />
        <TickerCard t={TICKERS[0]} className={styles.tickerA} />
        <TickerCard t={TICKERS[1]} className={styles.tickerB} />
        <TickerCard t={TICKERS[2]} className={styles.tickerC} />
      </motion.div>
    </section>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
      <path d="M16.4 12.6c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8 1.6 0 2 .8 3.4.8 1.4 0 2.3-1.3 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9 0 0-2.7-1-2.7-4.1ZM13.9 4.9c.7-.9 1.2-2 1-3.2-1 .1-2.3.7-3 1.6-.7.8-1.2 2-1.1 3.1 1.2.1 2.3-.6 3.1-1.5Z" />
    </svg>
  );
}

function PhoneSandwich() {
  return (
    <div className={styles.phone}>
      <div className={styles.phoneNotch} />
      <div className={styles.phoneScreen}>
        <div className={styles.phoneStatus}>
          <span>9:41</span>
          <span>●●● ◔</span>
        </div>
        <div className={styles.phoneAuthor}>
          <Image src="/avatar-degentrading.jpg" alt="" width={34} height={34} />
          <div>
            <b>degentrading</b>
            <span>from a 2h podcast · 14:32</span>
          </div>
        </div>
        <p className={styles.phoneThesis}>“the AI trade moves from chips to power”</p>
        <div className={styles.phonePnl}>
          <Odometer value="+18.42%" />
        </div>
        <svg viewBox="0 0 260 90" className={styles.phoneChart} preserveAspectRatio="none">
          <defs>
            <linearGradient id="pc" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#20e600" stopOpacity="0.3" />
              <stop offset="1" stopColor="#20e600" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path className={styles.chartFill} d="M0 70 L20 64 L40 68 L60 55 L80 58 L100 46 L120 50 L140 36 L160 40 L180 26 L200 30 L220 16 L240 20 L260 8 L260 90 L0 90Z" fill="url(#pc)" />
          <path className={styles.chartLine} d="M0 70 L20 64 L40 68 L60 55 L80 58 L100 46 L120 50 L140 36 L160 40 L180 26 L200 30 L220 16 L240 20 L260 8" fill="none" stroke="#20e600" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
        <ul className={styles.phoneLegs}>
          <li><span className={styles.legDot} style={{ background: "#ff6b00" }}>V</span>VST<em>40%</em></li>
          <li><span className={styles.legDot} style={{ background: "#0b5cff" }}>C</span>CEG<em>35%</em></li>
          <li><span className={styles.legDot} style={{ background: "#111" }}>G</span>GEV<em>25%</em></li>
        </ul>
        <div className={styles.phoneBuy}>buy this sandwich 🥪</div>
      </div>
    </div>
  );
}

/* ───────────────────────── manifesto (flip) ───────────────────────── */

const MANIFESTO =
  "every day someone on the internet calls the next big trade. on a podcast at minute 94. in a tweet at 2am. in a newsletter nobody finishes. by the time you find it, it’s priced in. bread reads it all, and hands you the trade.";

function ManifestoWord({
  word,
  progress,
  range,
}: {
  word: string;
  progress: MotionValue<number>;
  range: [number, number];
}) {
  const opacity = useTransform(progress, range, [0.14, 1]);
  const highlight = /priced|trade\.|bread/.test(word);
  return (
    <motion.span style={{ opacity }} className={highlight ? styles.manifestoHot : undefined}>
      {word}{" "}
    </motion.span>
  );
}

function Manifesto() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const words = MANIFESTO.split(" ");
  const scale = useTransform(scrollYProgress, [0.85, 1], [1, 0.94]);
  return (
    <section ref={ref} className={styles.manifesto}>
      <motion.div className={styles.manifestoSticky} style={{ scale }}>
        <span className={styles.eyebrowDark}>why bread</span>
        <p className={styles.manifestoText}>
          {words.map((w, i) => (
            <ManifestoWord
              key={i}
              word={w}
              progress={scrollYProgress}
              range={[(i / words.length) * 0.8, ((i + 1) / words.length) * 0.8]}
            />
          ))}
        </p>
      </motion.div>
    </section>
  );
}

/* ───────────────────────── how it works (soar 01/02/03) ───────────────────────── */

const STEPS = [
  {
    n: "01",
    title: "paste anything",
    body: "a youtube link, an x post, a substack, a reddit thread. if a human said it, bread can read it.",
  },
  {
    n: "02",
    title: "bread finds the alpha",
    body: "our models listen to the whole thing and pull out every tradable moment — timestamped, with the exact quote.",
  },
  {
    n: "03",
    title: "buy the sandwich",
    body: "each idea becomes a sandwich: the right stocks, perps or prediction markets, weighted and ready in one tap.",
  },
];

function HowItWorks() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [step, setStep] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setStep(Math.min(STEPS.length - 1, Math.floor(v * STEPS.length)));
  });
  const bar = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section ref={ref} className={styles.how} id="how">
      <div className={styles.howSticky}>
        <div className={styles.howLeft}>
          <span className={styles.eyebrow}>how a sandwich is made</span>
          <div className={styles.howNums}>
            {STEPS.map((s, i) => (
              <span key={s.n} className={i === step ? styles.howNumActive : undefined}>
                {s.n}
              </span>
            ))}
            <motion.i className={styles.howBar} style={{ width: bar }} />
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 18, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -18, filter: "blur(4px)" }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <h2 className={styles.howTitle}>{STEPS[step].title}</h2>
              <p className={styles.howBody}>{STEPS[step].body}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className={styles.howRight}>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              className={styles.howCard}
              initial={{ opacity: 0, y: 40, rotate: -2, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, y: -40, rotate: 2, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 220, damping: 24 }}
            >
              {step === 0 && <PasteDemo />}
              {step === 1 && <MomentsDemo />}
              {step === 2 && <SandwichDemo />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function useTyped(text: string, speed = 38) {
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

function PasteDemo() {
  const url = "youtube.com/watch?v=k4fzywme6u";
  const typed = useTyped(url);
  const done = typed.length === url.length;
  return (
    <div className={styles.demo}>
      <div className={styles.pasteBox}>
        <span className={styles.pasteIcon}>🔗</span>
        <span className={styles.pasteText}>
          {typed}
          <i className={styles.caret} />
        </span>
        <span className={`${styles.pasteGo} ${done ? styles.pasteGoReady : ""}`}>cook 🥪</span>
      </div>
      <div className={styles.sourceRow}>
        {["YouTube", "X", "Substack", "Reddit", "any link"].map((s, i) => (
          <motion.span
            key={s}
            className={styles.sourceChip}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.07 }}
          >
            {s}
          </motion.span>
        ))}
      </div>
      <div className={styles.thumbRow}>
        <div className={styles.thumb}>
          <Image src="/youtube-k4fzywme6u.jpg" alt="" fill sizes="320px" />
        </div>
        <div className={styles.thumbMeta}>
          <b>All-In style macro pod, ep. 212</b>
          <span>1h 42m · 3 hosts</span>
          <div className={styles.progress}>
            <motion.i
              initial={{ width: "0%" }}
              animate={{ width: done ? "100%" : "8%" }}
              transition={{ duration: 1.4, ease: "easeInOut" }}
            />
          </div>
          <span className={styles.progressLabel}>{done ? "listening…" : "waiting for a link"}</span>
        </div>
      </div>
    </div>
  );
}

const MOMENTS = [
  { t: "14:32", q: "the bottleneck isn’t GPUs anymore, it’s power. utilities are the trade.", tag: "LONG · power" },
  { t: "38:05", q: "I’d be short the regional banks into the CRE refinancing wall.", tag: "SHORT · banks" },
  { t: "1:07:44", q: "fed cuts in december is way more likely than people think.", tag: "YES · fed cut" },
];

function MomentsDemo() {
  return (
    <div className={styles.demo}>
      <div className={styles.momentsHead}>
        <span className={styles.liveDot} /> 3 moments found
      </div>
      <ul className={styles.moments}>
        {MOMENTS.map((m, i) => (
          <motion.li
            key={m.t}
            initial={{ opacity: 0, x: 24, filter: "blur(4px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            transition={{ delay: 0.15 + i * 0.22, duration: 0.45 }}
          >
            <span className={styles.momentTime}>{m.t}</span>
            <p>
              <mark className={styles.momentMark} style={{ animationDelay: `${0.5 + i * 0.22}s` }}>
                {m.q}
              </mark>
            </p>
            <span className={`${styles.momentTag} ${m.tag.startsWith("SHORT") ? styles.momentTagShort : ""}`}>
              {m.tag}
            </span>
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
        <Image src="/sandwich-cutout.png" alt="" width={72} height={72} className={styles.sandwichIcon} />
        <div>
          <b>power is the new compute</b>
          <span>from 14:32 · 3 legs · long</span>
        </div>
      </div>
      {[
        { s: "VST", n: "Vistra", w: 40, c: "#ff6b00" },
        { s: "CEG", n: "Constellation", w: 35, c: "#0b5cff" },
        { s: "GEV", n: "GE Vernova", w: 25, c: "#111" },
      ].map((l, i) => (
        <div key={l.s} className={styles.leg}>
          <span className={styles.legDot} style={{ background: l.c }}>{l.s[0]}</span>
          <div className={styles.legName}>
            <b>{l.s}</b>
            <span>{l.n}</span>
          </div>
          <div className={styles.legBar}>
            <motion.i
              style={{ background: l.c }}
              initial={{ width: 0 }}
              animate={{ width: `${l.w}%` }}
              transition={{ delay: 0.2 + i * 0.12, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <em>{l.w}%</em>
        </div>
      ))}
      <div className={styles.buyRow}>
        <span className={styles.buyAmount}>
          <Odometer value="$50.00" />
        </span>
        <button className={styles.buyBtn} type="button">
          buy sandwich
        </button>
      </div>
    </div>
  );
}

/* ───────────────────────── dictionary ───────────────────────── */

function Dictionary() {
  return (
    <section className={styles.dictSection}>
      <motion.div
        className={styles.dict}
        initial={{ opacity: 0, y: 40, rotate: -1.5 }}
        whileInView={{ opacity: 1, y: 0, rotate: -1.5 }}
        viewport={{ once: true, margin: "-120px" }}
        transition={{ type: "spring", stiffness: 160, damping: 20 }}
      >
        <Image src="/sandwich-cutout.png" alt="" width={220} height={220} className={styles.dictSandwich} />
        <div className={styles.dictWord}>
          sandwich <span>/ˈsæn.wɪtʃ/</span>
        </div>
        <div className={styles.dictPos}>noun</div>
        <p className={styles.dictDef}>
          <mark>a tradable position built around one idea</mark> — a single
          asset, a basket, or a perp — with the reasoning behind every leg.
        </p>
        <p className={styles.dictEx}>“she turned a 3-hour podcast into a sandwich and was up 12% by friday.”</p>
      </motion.div>
    </section>
  );
}

/* ───────────────────────── feed wall (heyclicky) ───────────────────────── */

const FEED = [
  { u: "vzy", a: "V", c: "#20e600", src: "x.com", thesis: "I wanna long looksmaxxing", pnl: "-6.18%", legs: "LLY · NVO · ELF" },
  { u: "jukan", img: "/avatar-jukan.jpg", src: "x.com", thesis: "HBM is sold out through 2027", pnl: "+21.40%", legs: "MU · SK HYNIX · AMAT" },
  { u: "degentrading", img: "/avatar-degentrading.jpg", src: "youtube", thesis: "utilities are the AI trade now", pnl: "+18.42%", legs: "VST · CEG · GEV" },
  { u: "macro_mo", a: "M", c: "#ff2d87", src: "substack", thesis: "the fed cuts before christmas", pnl: "+9.03%", legs: "YES · TLT" },
  { u: "pizzaguy", a: "P", c: "#00bfff", src: "reddit", thesis: "short the CRE refinancing wall", pnl: "+4.77%", legs: "KRE short" },
  { u: "goldbug", a: "G", c: "#f6c451", src: "youtube", thesis: "central banks keep buying gold", pnl: "+12.6%", legs: "GOLD · GDX" },
];

function Feed() {
  return (
    <section className={styles.feed} id="feed">
      <div className={styles.marquee} aria-hidden="true">
        <div className={styles.marqueeTrack}>
          {Array.from({ length: 2 }).map((_, k) => (
            <span key={k}>
              ideas become trades <b>ideas become trades</b> ideas become trades ideas become trades{" "}
            </span>
          ))}
        </div>
      </div>
      <span className={styles.stamp}>no gas<br />ever!</span>

      <div className={styles.feedGrid}>
        {FEED.map((f, i) => (
          <motion.article
            key={f.u}
            className={styles.feedCard}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: (i % 3) * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -6, rotate: i % 2 ? 0.8 : -0.8 }}
          >
            <div className={styles.winBar}>
              <i /><i /><i />
              <span>{f.src}</span>
            </div>
            <div className={styles.feedBody}>
              <div className={styles.feedUser}>
                {f.img ? (
                  <Image src={f.img} alt="" width={30} height={30} />
                ) : (
                  <span className={styles.feedAvatar} style={{ background: f.c }}>{f.a}</span>
                )}
                <b>@{f.u}</b>
              </div>
              <p className={styles.feedThesis}>{f.thesis}</p>
              <div className={styles.feedFoot}>
                <span className={styles.feedLegs}>{f.legs}</span>
                <span className={f.pnl.startsWith("-") ? styles.pnlDown : styles.pnlUp}>{f.pnl}</span>
              </div>
            </div>
          </motion.article>
        ))}
      </div>
      <p className={styles.fineprint}>cards are illustrative examples of the bread feed.</p>
    </section>
  );
}

/* ───────────────────────── bento (flip) ───────────────────────── */

function Bento() {
  return (
    <section className={styles.bentoSection} id="markets">
      <div className={styles.sectionHead}>
        <span className={styles.eyebrow}>every market, one feed</span>
        <h2>
          if it trades, <em>it fits in a sandwich.</em>
        </h2>
      </div>
      <div className={styles.bento}>
        <BentoCard title="stocks, 24/5" body="NVDA at 3am on a tuesday. tokenized equities that never close for the night." className={styles.bentoA}>
          <div className={styles.bentoTickers}>
            {["NVDA", "AAPL", "TSLA", "META", "AMZN", "MSFT", "PLTR", "COIN"].map((s) => (
              <span key={s}>{s}</span>
            ))}
          </div>
        </BentoCard>
        <BentoCard title="shorts, too" body="bearish take? bread routes it to perps so you can bet against it." className={styles.bentoB}>
          <div className={styles.bentoShort}>
            <span>SHORT</span>
            <b>-4.2%</b>
          </div>
        </BentoCard>
        <BentoCard title="prediction markets" body="“will the fed cut?” is a trade now. YES and NO, right next to your stocks." className={styles.bentoC}>
          <div className={styles.bentoYesNo}>
            <span className={styles.yes}>YES 62¢</span>
            <span className={styles.no}>NO 38¢</span>
          </div>
        </BentoCard>
        <BentoCard title="no gas, no seed phrase" body="sign in with email. we cover the network fees. it just feels like an app." className={styles.bentoD}>
          <div className={styles.bentoJar}>
            <Image src="/money-jar.png" alt="" width={120} height={193} />
          </div>
        </BentoCard>
      </div>
    </section>
  );
}

function BentoCard({
  title,
  body,
  className,
  children,
}: {
  title: string;
  body: string;
  className: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      className={`${styles.bentoCard} ${className}`}
      initial={{ opacity: 0, y: 30, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className={styles.bentoVisual}>{children}</div>
      <h3>{title}</h3>
      <p>{body}</p>
    </motion.div>
  );
}

/* ───────────────────────── sky CTA + footer ───────────────────────── */

function SkyCta() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const cloudY = useTransform(scrollYProgress, [0, 1], ["-8%", "12%"]);
  const sandwichY = useTransform(scrollYProgress, [0, 1], [80, -80]);
  const sandwichR = useTransform(scrollYProgress, [0, 1], [-18, 14]);

  return (
    <section ref={ref} className={styles.skySection}>
      <div className={styles.sky}>
        <motion.div className={styles.skyImg} style={{ y: cloudY }}>
          <Image src="/hero-sky-v2.png" alt="" fill sizes="100vw" />
        </motion.div>
        <motion.div className={styles.skySandwich} style={{ y: sandwichY, rotate: sandwichR }}>
          <Image src="/sandwich-cutout.png" alt="" width={260} height={260} />
        </motion.div>
        <div className={styles.skyCopy}>
          <span className={styles.skyPill}>beta · iPhone</span>
          <h2>
            stop scrolling past alpha.
            <br />
            <em>start eating it.</em>
          </h2>
          <div className={styles.skyActions}>
            <a href={TESTFLIGHT_URL} className={styles.btnPrimary} target="_blank" rel="noopener noreferrer">
              <AppleIcon /> join the testflight
            </a>
            <div className={styles.skyQr}>
              <Image src="/testflight-qr.svg" alt="TestFlight QR code" width={96} height={96} />
              <span>or scan</span>
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
      <div className={styles.footerLinks}>
        <span>© {new Date().getFullYear()} bread</span>
        <a href={X_URL} target="_blank" rel="noreferrer">x / twitter</a>
        <a href="/sandwiches">sandwiches</a>
        <a href={TESTFLIGHT_URL} target="_blank" rel="noopener noreferrer">testflight</a>
      </div>
      <Image src="/breadtext.PNG" alt="" width={2560} height={1088} className={styles.footerWordmark} />
      <p className={styles.fineprint}>
        prices and positions shown are illustrative. trading involves risk; not
        investment advice.
      </p>
    </footer>
  );
}

/* ───────────────────────── page ───────────────────────── */

export function Landing() {
  return (
    <div className={styles.page}>
      <div className={styles.grain} aria-hidden="true" />
      <MenuBar />
      <main>
        <Hero />
        <Manifesto />
        <div className={styles.curtain}>
          <HowItWorks />
          <Dictionary />
          <Feed />
          <Bento />
          <SkyCta />
        </div>
      </main>
      <Footer />
    </div>
  );
}
