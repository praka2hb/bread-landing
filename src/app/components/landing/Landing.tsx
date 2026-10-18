"use client";

import Image from "next/image";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
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

/*
 * One motion vocabulary for the whole page.
 * - ENTER: content arriving on screen. Decelerates, never overshoots.
 * - SETTLE: things reacting to a state change. Critically damped.
 */
const EASE = [0.16, 1, 0.3, 1] as const;
const ENTER = { duration: 0.7, ease: EASE };
const SETTLE = { type: "spring", stiffness: 420, damping: 42 } as const;

function useInView<T extends Element>(rootMargin = "-15% 0px") {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), { rootMargin });
    io.observe(node);
    return () => io.disconnect();
  }, [rootMargin]);
  return [ref, seen] as const;
}

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

function Nav() {
  return (
    <header className={styles.nav}>
      <nav className={styles.navPill} aria-label="Primary navigation">
        <a href="#top" className={styles.navIcon} aria-label="Bread home">
          <Image src="/logo.png" alt="" width={493} height={479} priority />
        </a>
        <a href={X_URL} target="_blank" rel="noreferrer" className={styles.navX} aria-label="Bread on X">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </a>
        <div className={styles.navGet}>
          <a href={TESTFLIGHT_URL} target="_blank" rel="noopener noreferrer" className={styles.glossy}>
            Join TestFlight
          </a>
          <span className={styles.navQr} aria-hidden="true">
            <Image src="/testflight-qr.svg" alt="" width={128} height={128} />
            <span>Point your iPhone camera here</span>
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

/* ───────────────────────── hero (restored) ───────────────────────── */

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

  return (
    <section ref={ref} className={styles.hero} id="top">
      <div className={styles.heroGlow} aria-hidden="true" />

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
          Paste a podcast, a post, a newsletter. Bread finds the trade inside it and turns it
          into a sandwich: a one‑tap basket of the stocks, perps and markets behind the idea.
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
              AI capex isn&apos;t slowing down. every hyperscaler just raised guidance again.{" "}
              <span className={styles.tweetHot}>chips are still the trade.</span>
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

        <motion.div className={styles.phoneWrap} style={{ rotate: phoneRotate }}>
          <Phone />
        </motion.div>

        <Float className={styles.fQuoteA} depth={30} delay={0.8}>
          <QuoteCard quote={QUOTES.NVDA} />
        </Float>
        <Float className={styles.fQuoteB} depth={46} delay={0.95}>
          <QuoteCard quote={QUOTES.AVGO} />
        </Float>
        <Float className={styles.fQuoteC} depth={22} delay={1.1}>
          <QuoteCard quote={QUOTES.AMD} />
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

const PHONE_LEGS: { id: "NVDA" | "AVGO" | "AMD"; w: number }[] = [
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
                <b>{QUOTES[l.id].sym}</b>
                <span>{QUOTES[l.id].name}</span>
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

/* ───────────────────────── manifesto ───────────────────────── */

const MANIFESTO =
  "Most financial ideas are borrowed from the internet. A creator on YouTube at minute 94. A thread on X at 2am. A Substack you saved and never opened. By the time it reaches you, it’s priced in. Bread puts the trade right next to the idea, while it’s still early.";

function ManifestoWord({
  word,
  progress,
  range,
}: {
  word: string;
  progress: MotionValue<number>;
  range: [number, number];
}) {
  const opacity = useTransform(progress, range, [0.18, 1]);
  const hot = /^(priced|early\.)/.test(word);
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
      </div>
    </section>
  );
}

/* ───────────────────────── how bread works: one phone, the real flow ───────────────────────── */

/** Mounts a demo only once its card is on screen, so its timeline plays where you can see it. */
function WhenSeen({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [played, setPlayed] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setPlayed(true);
          io.disconnect();
        }
      },
      { rootMargin: "-20% 0px" },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={className}>
      {played ? children : null}
    </div>
  );
}

const FLOW = [
  { title: "Say the idea", body: "Type a take, or paste a link from X, YouTube or Substack." },
  { title: "Bread builds the sandwich", body: "It picks the assets behind the idea and weights each one. Every leg is visible." },
  { title: "Tap buy", body: "Choose an amount. One tap buys every leg, and network fees are on us." },
  { title: "Watch it cook", body: "Your sandwich tracks live from the second you buy it." },
] as const;

const IDEA = "chips are still the AI trade";

const FLOW_LEGS: { id: "NVDA" | "AVGO" | "AMD"; w: number; price: string; pnl: string }[] = [
  { id: "NVDA", w: 40, price: "$182.40", pnl: "+21.30%" },
  { id: "AVGO", w: 35, price: "$349.90", pnl: "+16.84%" },
  { id: "AMD", w: 25, price: "$233.08", pnl: "+15.02%" },
];

function HowBreadWorks() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [step, setStep] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setStep(Math.min(FLOW.length - 1, Math.max(0, Math.floor(v * FLOW.length))));
  });

  // Clicking a step scrolls to the middle of its slice of the pinned section.
  const goTo = (i: number) => {
    const el = ref.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const travel = el.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + ((i + 0.5) / FLOW.length) * travel, behavior: "smooth" });
  };

  return (
    <section ref={ref} className={styles.flow} id="how">
      <div className={styles.flowSticky}>
        <div className={styles.flowCopy}>
          <h2 className={styles.h2}>How Bread works</h2>
          <ol className={styles.flowSteps}>
            {FLOW.map((s, i) => (
              <li key={s.title} className={i === step ? styles.flowStepOn : undefined}>
                <button type="button" onClick={() => goTo(i)}>
                  <span className={styles.flowNum}>{i + 1}</span>
                  <span>
                    <b>{s.title}</b>
                    <span>{s.body}</span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>

        <div className={styles.flowPhone}>
          <div className={styles.flowDots} aria-hidden="true">
            {FLOW.map((s, i) => (
              <i key={s.title} className={i <= step ? styles.flowDotOn : undefined} />
            ))}
          </div>
          <div className={styles.flowFrame}>
            <div className={styles.phoneIsland} />
            <div className={styles.appScreen}>
              <AppStatus />
              <AnimatePresence mode="wait" initial={false}>
                {step === 0 ? (
                  <motion.div
                    key="compose"
                    className={styles.appFill}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.25 }}
                  >
                    <ComposeScreen />
                  </motion.div>
                ) : (
                  <motion.div
                    key="sandwich"
                    className={styles.appFill}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={ENTER}
                  >
                    <SandwichScreen step={step} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <p className={styles.flowCaption} aria-live="polite">
            <b>{FLOW[step].title}</b>
            {FLOW[step].body}
          </p>
        </div>
      </div>
    </section>
  );
}

function AppStatus() {
  return (
    <div className={styles.appStatus}>
      <span>9:41</span>
      <span className={styles.phoneStatusIcons}>
        <i />
        <i />
        <i />
      </span>
    </div>
  );
}

function ComposeScreen() {
  const typed = useTyped(IDEA, 55);
  const done = typed.length === IDEA.length;
  return (
    <div className={styles.compose}>
      <div className={styles.composeHead}>
        <Image src="/logo.png" alt="" width={36} height={36} />
        <b>New sandwich</b>
      </div>
      <p className={styles.composeHint}>What do you want to long?</p>
      <div className={styles.composeSources}>
        <span>or paste a link</span>
        <LogoStack ids={["x", "youtube", "substack"]} size={22} />
      </div>
      <div className={styles.composer}>
        <span className={styles.composerText}>
          {typed}
          <i className={styles.composerCaret} />
        </span>
        <motion.span
          className={styles.composerSend}
          animate={done ? { scale: [1, 1.18, 1], rotate: [0, -12, 0] } : { scale: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <Image src="/sandwich-cutout.png" alt="" width={34} height={30} />
        </motion.span>
      </div>
    </div>
  );
}

function SandwichScreen({ step }: { step: number }) {
  return (
    <div className={styles.sw}>
      <div className={styles.swTop}>
        <span className={styles.swBack}>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 5 8 12l7 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>

      <div className={styles.swAuthor}>
        <span className={styles.swAvatar}>Y</span>
        <span>
          <b>you</b>
          <em>@you · now</em>
        </span>
      </div>
      <p className={styles.swPost}>{IDEA}</p>

      {/* tracking: the number and the curve, as the app draws them */}
      <AnimatePresence initial={false}>
        {step === 3 && (
          <motion.div
            className={styles.swMarket}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            transition={ENTER}
          >
            <div className={styles.swPnl}>
              <Odometer value="+18.42%" />
            </div>
            <svg viewBox="0 0 260 92" className={styles.swChart} preserveAspectRatio="none" aria-hidden="true">
              <line x1="0" x2="260" y1="70" y2="70" stroke="#cbd2dc" strokeDasharray="3 4" />
              <path
                className={styles.swLine}
                d="M0 70 L14 64 L26 72 L40 62 L54 66 L68 58 L80 63 L96 52 L110 55 L124 44 L138 48 L152 36 L168 40 L182 28 L198 33 L212 20 L228 24 L244 12 L260 16"
                fill="none"
                stroke="#35f046"
                strokeWidth="2.6"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </svg>
            <div className={styles.swAxis}>
              <span>Oct 18</span>
              <span>Since created</span>
            </div>
            <div className={styles.swRanges}>
              {["24H", "1W", "1M", "3M"].map((r) => (
                <span key={r} className={r === "1W" ? styles.swRangeOn : undefined}>
                  {r}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={styles.swLegs}>
        {FLOW_LEGS.map((leg, i) => (
          <motion.div
            key={leg.id}
            className={styles.swLeg}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SETTLE, delay: step === 1 ? 0.35 + i * 0.22 : 0 }}
          >
            <Logo id={leg.id} size={40} className={styles.swLogo} />
            <span className={styles.swLegName}>
              <b>{leg.id}</b>
              <em>{leg.w}%</em>
            </span>
            <span className={styles.swLegNums}>
              <b>{leg.price}</b>
              {step === 3 ? <em className={styles.swUp}>{leg.pnl}</em> : <em className={styles.swNew}>NEW</em>}
            </span>
          </motion.div>
        ))}
      </div>

      {step === 1 && (
        <motion.div
          className={styles.swBuy}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...ENTER, delay: 1.1 }}
        >
          BUY
        </motion.div>
      )}

      <AnimatePresence>{step === 2 && <BuySheet key="sheet" />}</AnimatePresence>
      <AnimatePresence>
        {step === 3 && (
          <motion.div
            className={styles.swToast}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ ...SETTLE, delay: 0.5 }}
          >
            <span>✓</span> You&apos;re in · $50.00 · 3 assets
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const AMOUNTS = [10, 25, 50, 100];

function BuySheet() {
  // 0: sheet up · 1: $50 picked · 2: BUY pressed · 3: bought
  const beat = useBeats([600, 1500, 1900]);
  const picked = beat >= 1;
  return (
    <>
      <motion.div
        className={styles.sheetScrim}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      <motion.div
        className={styles.buySheet}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={SETTLE}
      >
        <i className={styles.grabber} />
        <span className={styles.sheetLabel}>Amount</span>
        <span className={styles.sheetAmount}>
          <Odometer key={picked ? "50" : "0"} value={picked ? "$50.00" : "$0.00"} />
        </span>
        <div className={styles.sheetPills}>
          {AMOUNTS.map((a) => (
            <span key={a} className={picked && a === 50 ? styles.sheetPillOn : undefined}>
              ${a}
            </span>
          ))}
        </div>
        <ul className={styles.sheetSplit}>
          {FLOW_LEGS.map((l) => (
            <li key={l.id}>
              <Logo id={l.id} size={18} className={styles.swLogo} />
              {l.id}
              <b>{picked ? `$${((50 * l.w) / 100).toFixed(2)}` : "$0.00"}</b>
            </li>
          ))}
          <li className={styles.sheetFee}>
            Network fee
            <b>Free</b>
          </li>
        </ul>
        <motion.span
          className={`${styles.swBuy} ${beat >= 3 ? styles.swBought : ""}`}
          animate={beat === 2 ? { scale: 0.95 } : { scale: 1 }}
          transition={{ duration: 0.12 }}
        >
          {beat >= 3 ? "✓ Bought" : "BUY"}
        </motion.span>
      </motion.div>
    </>
  );
}

function useTyped(text: string, speed = 32) {
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

/** Steps a demo through its beats at the given offsets (ms). */
function useBeats(offsets: readonly number[]) {
  const [beat, setBeat] = useState(0);
  const key = offsets.join(",");
  useEffect(() => {
    const ids = key.split(",").map((ms, i) => setTimeout(() => setBeat(i + 1), Number(ms)));
    return () => ids.forEach(clearTimeout);
  }, [key]);
  return beat;
}

/* ───────────────────────── what bread enables (ugly.cash 2×2) ───────────────────────── */

function Enables() {
  return (
    <section className={styles.section} id="enables">
      <Reveal>
        <h2 className={styles.h2}>What Bread enables</h2>
      </Reveal>
      <div className={styles.two}>
        <Reveal className={styles.feature}>
          <Like2BuyCard />
          <h3>Like2Buy, right inside X</h3>
          <p>
            Like a post and Bread microbuys the assets behind it. Or DM it to @breadappfun and pick
            the size. You set the caps.
          </p>
        </Reveal>
        <Reveal className={styles.feature} delay={0.08}>
          <WhenSeen className={`${styles.card} ${styles.cardSky}`}>
            <ReplyDemo />
          </WhenSeen>
          <h3>Summon the bot</h3>
          <p>Reply @breadappfun under any post. It cooks the trade and replies with a sandwich you can buy.</p>
        </Reveal>
        <Reveal className={styles.feature}>
          <WhenSeen className={`${styles.card} ${styles.cardLime}`}>
            <LockScreen />
          </WhenSeen>
          <h3>Alerts that matter</h3>
          <p>A big move on your feed, a sandwich you&apos;re in, someone you follow taking a position.</p>
        </Reveal>
        <Reveal className={styles.feature} delay={0.08}>
          <WhenSeen className={`${styles.card} ${styles.cardLilac}`}>
            <CreatorCard />
          </WhenSeen>
          <h3>Creators get paid</h3>
          <p>When your call ends up on Bread, you earn a cut of every trade on it. Your profile is waiting to be claimed.</p>
        </Reveal>
      </div>
    </section>
  );
}

function Like2BuyCard() {
  const [ref, seen] = useInView<HTMLDivElement>("0px");
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (seen) v.play().catch(() => {});
    else v.pause();
  }, [seen]);
  return (
    <div ref={ref} className={`${styles.card} ${styles.cardPink}`}>
      <video
        ref={video}
        className={styles.l2bVideo}
        src="/landing/like2buy.mp4"
        poster="/landing/like2buy-poster.jpg"
        muted
        loop
        playsInline
        preload="metadata"
        aria-label="Screen recording: liking a post on X buys $5 of the asset, and DMing a post to @breadappfun buys $10"
      />
      <span className={styles.realTag}>real screen recording</span>
    </div>
  );
}

function XPost({ avatar, name, handle, children }: { avatar: string; name: string; handle: string; children: React.ReactNode }) {
  return (
    <div className={styles.xpost}>
      <Image src={avatar} alt="" width={34} height={34} className={styles.xAvatar} />
      <div>
        <div className={styles.xHead}>
          <b>{name}</b>
          <span>{handle}</span>
        </div>
        <div className={styles.xBody}>{children}</div>
      </div>
    </div>
  );
}

function ReplyDemo() {
  const reply = useTyped("@breadappfun cook this", 45);
  const beat = useBeats([1700]);
  return (
    <div className={styles.demo}>
      <XPost avatar="/landing/x-serenity.jpg" name="Serenity" handle="@aleabitoreddit">
        Now that <span className={styles.cashtag}>$MU</span> to <span className={styles.cashtag}>$SNDK</span> have pulled
        a major recovery. Good to have a reminder that the memory bottleneck hasn&apos;t changed!
      </XPost>
      <div className={styles.thread}>
        <XPost avatar="/avatar-degentrading.jpg" name="you" handle="@you">
          <span className={styles.cashtag}>{reply.slice(0, 12)}</span>
          {reply.slice(12)}
          {reply.length < 22 && <i className={styles.caret} />}
        </XPost>
        <AnimatePresence>
          {beat >= 1 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={SETTLE}>
              <XPost avatar="/logo.png" name="bread" handle="@breadappfun">
                cooked 🥪 memory is still the AI bottleneck. long MU, SNDK, WDC
                <span className={styles.botLink}>breadapp.fun/s/memory-bottleneck</span>
              </XPost>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

const NOTIFS = [
  { title: "🚨 MU is up 6% in 10 minutes", body: "Biggest move on your feed today.", t: "now", img: "/landing/mu.png" },
  { title: "Serenity’s Sandwich is up 12%", body: "Memory bottleneck. You’re in, +$3.10.", t: "2m ago", img: "/landing/x-serenity.jpg" },
  { title: "Altcoin Sherpa went long MU", body: "3 people you follow are in.", t: "5m ago", img: "/landing/sherpa.png" },
];

function LockScreen() {
  const beat = useBeats([300, 1200, 2100]);
  const shown = NOTIFS.slice(0, beat).reverse();
  return (
    <div className={styles.lock}>
      <span className={styles.lockDate}>Thursday, September 24</span>
      <span className={styles.lockTime}>9:41</span>
      <div className={styles.notifs}>
        <AnimatePresence initial={false}>
          {shown.map((n) => (
            <motion.div
              key={n.title}
              layout
              className={styles.notif}
              initial={{ opacity: 0, y: -24, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={SETTLE}
            >
              <Image src="/logo.png" alt="" width={32} height={32} className={styles.notifApp} />
              <span className={styles.notifText}>
                <b>{n.title}</b>
                {n.body}
              </span>
              <span className={styles.notifSide}>
                <em>{n.t}</em>
                <Image src={n.img} alt="" width={24} height={24} />
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function CreatorCard() {
  return (
    <div className={styles.profile}>
      <div className={styles.profileHead}>
        <Image src="/landing/x-serenity.jpg" alt="" width={44} height={44} />
        <span>
          <b>@aleabitoreddit</b>
          <em>shadow account · unclaimed</em>
        </span>
      </div>
      <div className={styles.profileStats}>
        <span>
          <b>12</b>ideas
        </span>
        <span>
          <b>$48k</b>volume
        </span>
        <span>
          <b className={styles.up}>+31%</b>pnl
        </span>
      </div>
      <div className={styles.fees}>
        <span>creator fees earned</span>
        <Odometer value="$1,240" className={styles.feesValue} />
      </div>
      <span className={styles.claim}>Claim profile</span>
    </div>
  );
}

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
    body: "“Will the Fed cut in December?” sits in the same basket as your stocks.",
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
  const rail = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);

  const onScroll = () => {
    const el = rail.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    const step = card ? card.offsetWidth + 16 : el.clientWidth;
    setPage(Math.round(el.scrollLeft / step));
  };

  const go = (dir: 1 | -1) => {
    const el = rail.current;
    const card = el?.firstElementChild as HTMLElement | null;
    if (!el || !card) return;
    el.scrollBy({ left: dir * (card.offsetWidth + 16), behavior: "smooth" });
  };

  return (
    <section className={styles.section} id="markets">
      <div className={styles.railHead}>
        <Reveal>
          <h2 className={styles.h2}>If it trades, it fits in a sandwich</h2>
        </Reveal>
        <div className={styles.railBtns}>
          <button type="button" onClick={() => go(-1)} aria-label="Previous">
            ←
          </button>
          <button type="button" onClick={() => go(1)} aria-label="Next">
            →
          </button>
        </div>
      </div>
      <div ref={rail} className={styles.rail} onScroll={onScroll}>
        {MARKETS.map((m, i) => (
          <Reveal key={m.title} className={styles.railItem} delay={Math.min(i, 3) * 0.06}>
            <div className={`${styles.card} ${styles.railCard} ${m.tone}`}>{m.visual}</div>
            <h3>{m.title}</h3>
            <p>{m.body}</p>
          </Reveal>
        ))}
      </div>
      <div className={styles.railDots} aria-hidden="true">
        {MARKETS.map((m, i) => (
          <i key={m.title} className={i === page ? styles.railDotOn : undefined} />
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
      <p>The internet made financial information free. Bread puts the trade right next to it.</p>
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
          <HowBreadWorks />
          <Enables />
          <Markets />
          <Statement />
          <GetIt />
        </div>
      </main>
      <Footer />
    </div>
  );
}
