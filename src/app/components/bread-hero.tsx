"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import Image from "next/image";
import styles from "./bread-hero.module.css";

type Coin = {
  k: string;
  m: string[];
  tk: string;
  nm: string;
  kind: string;
  side: "long" | "short";
  c: string;
  pxv: number;
  unit: "usd" | "cent";
  pred?: boolean;
  image?: string;
};

type ThesisCard = {
  id: string;
  username: string;
  handle: string;
  thesis: string;
  avatar: string;
  accent: string;
  positionClass: "cardLeft" | "cardRight" | "cardBottom";
};

const POOL: Coin[] = [
  {
    k: "hims",
    m: [
      "looksmaxxing",
      "looksmax",
      "hair",
      "skincare",
      "grooming",
      "telehealth",
      "hims",
    ],
    tk: "HIMS",
    nm: "HIMS",
    kind: "Tokenized stock",
    side: "long",
    c: "#22C55E",
    pxv: 24.8,
    unit: "usd",
    image: "https://cdn.ondo.finance/tokens/logos/himson_160x160.png",
  },
  {
    k: "abbv",
    m: [
      "botox",
      "filler",
      "fillers",
      "jawline",
      "aesthetics",
      "abbvie",
      "allergan",
      "looksmaxxing",
    ],
    tk: "ABBV",
    nm: "AbbVie",
    kind: "Tokenized stock",
    side: "long",
    c: "#5B7CFA",
    pxv: 171.6,
    unit: "usd",
    image: "https://www.tokens.xyz/logos/xstocks/ABBVx.png",
  },
  {
    k: "reta",
    m: [
      "retatrutide",
      "fda",
      "approval",
      "pipeline",
      "glp1",
      "glp-1",
      "weight loss",
      "looksmaxxing",
    ],
    tk: "RETA",
    nm: "FDA approves Retatrutide this year?",
    kind: "Prediction market",
    side: "long",
    c: "#7C3AED",
    pxv: 19,
    unit: "cent",
    pred: true,
    image:
      "https://polymarket-upload.s3.us-east-2.amazonaws.com/fda-approves-mercks-clesrovimab-infant-rsv-prevention-mk1654-UwIlSPqRRYN3.jpg",
  },
];

const DEFAULT_FILL = ["hims", "abbv", "reta"] as const;
const ALLOC: Record<number, number[]> = {
  3: [42, 33, 25],
  4: [38, 27, 20, 15],
  5: [34, 25, 18, 13, 10],
};
const LEVS = [1.5, 2, 2, 3];
const SEED_PROMPT = "I wanna long looksmaxxing";
const GROW_MS = 4200;
const LOOKSMAXXING_PRESET = ["hims", "abbv", "reta"] as const;
const THESIS_CARDS: ThesisCard[] = [
  {
    id: "looksmax-main",
    username: "vzy010",
    handle: "@vzy010",
    thesis: "I wanna long looksmaxxing",
    avatar: "V",
    accent: "#2bff66",
    positionClass: "cardLeft",
  },
];

const rnd = (a: number, b: number) => a + Math.random() * (b - a);

function fmtPrice(v: number, unit: Coin["unit"]) {
  if (unit === "cent") return `${Math.max(0, Math.round(v))}c`;
  if (v >= 1000) return `$${Math.round(v).toLocaleString()}`;
  if (v >= 1) return `$${v.toFixed(2)}`;
  if (v >= 0.01) return `$${v.toFixed(3)}`;
  return `$${v.toFixed(7)}`;
}

const fmtPct = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;

function buildChart() {
  const W = 300;
  const H = 82;

  // Fixed elegant upward curve with natural dips — always profitable
  const keyPoints: [number, number][] = [
    [0, 62],
    [14, 58],
    [30, 54],
    [42, 60], // small dip
    [56, 50],
    [72, 46],
    [90, 52], // dip
    [108, 42],
    [126, 36],
    [138, 40], // small dip
    [156, 32],
    [174, 28],
    [186, 34], // dip
    [198, 26],
    [216, 22],
    [234, 18],
    [246, 22], // small dip
    [258, 16],
    [276, 14],
    [288, 12],
    [300, 10],
  ];

  // Build smooth cubic bezier path through key points
  let line = `M ${keyPoints[0][0]} ${keyPoints[0][1]}`;
  for (let i = 1; i < keyPoints.length; i++) {
    const [x0, y0] = keyPoints[i - 1];
    const [x1, y1] = keyPoints[i];
    const cpx = (x0 + x1) / 2;
    line += ` C ${cpx} ${y0}, ${cpx} ${y1}, ${x1} ${y1}`;
  }

  const lastPt = keyPoints[keyPoints.length - 1];

  return {
    line,
    area: `${line} L ${W} ${H} L 0 ${H} Z`,
    dot: { x: lastPt[0], y: lastPt[1] },
    base: keyPoints[0][1],
    W,
    H,
  };
}

function buildSandwichFromCoins(final: Coin[]) {
  const allocs = ALLOC[final.length] ?? ALLOC[3];

  let weighted = 0;
  const items = final.map((coin, index) => {
    const pct = allocs[index];
    const chg = Number(rnd(-19, 27).toFixed(2));
    weighted += (pct / 100) * chg;

    let tag: string | null = null;
    let tagType: "yes" | "short" | "lev" | null = null;

    if (coin.pred) {
      tag = "YES side";
      tagType = "yes";
    } else if (coin.side === "short") {
      tag = `${LEVS[(index + 1) % LEVS.length]}x short`;
      tagType = "short";
    } else if (Math.random() < 0.55) {
      tag = `${LEVS[index % LEVS.length]}x long`;
      tagType = "lev";
    }

    return { ...coin, pct, chg, up: chg >= 0, tag, tagType };
  });

  const ret = Number(weighted.toFixed(2));
  const retUp = ret >= 0;

  return {
    items,
    ret,
    retStr: `${retUp ? "+" : ""}${ret.toFixed(2)}%`,
    retUp,
    chart: buildChart(),
  };
}

function generate(raw: string) {
  const normalized = raw
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (
    normalized.includes("long looksmaxxing") ||
    normalized === "looksmaxxing" ||
    normalized.includes("glp-1 aesthetics flywheel")
  ) {
    const presetCoins = LOOKSMAXXING_PRESET.map((key) =>
      POOL.find((coin) => coin.k === key),
    ).filter((coin): coin is Coin => Boolean(coin));

    return buildSandwichFromCoins(presetCoins);
  }

  const fallbackCoins = DEFAULT_FILL.map((key) =>
    POOL.find((coin) => coin.k === key),
  ).filter((coin): coin is Coin => Boolean(coin));

  return buildSandwichFromCoins(fallbackCoins);
}

type Sandwich = ReturnType<typeof generate>;

type HeroPhase =
  | "idle"
  | "typing"
  | "ready"
  | "pressing"
  | "loading"
  | "done";

function createSeedSandwich() {
  let seed = generate(SEED_PROMPT);
  for (let attempt = 0; !seed.retUp && attempt < 12; attempt++) {
    seed = generate(SEED_PROMPT);
  }
  return seed;
}

function PhoneStatusBar() {
  return (
    <div className={styles.mockStatusBar} aria-hidden="true">
      <span>3:33</span>
      <span className={styles.mockStatusIcons}>
        <svg viewBox="0 0 18 12">
          <rect x="0" y="7" width="3" height="5" rx="1" />
          <rect x="5" y="5" width="3" height="7" rx="1" />
          <rect x="10" y="2" width="3" height="10" rx="1" />
          <rect x="15" y="0" width="3" height="12" rx="1" opacity=".24" />
        </svg>
        <svg viewBox="0 0 18 12" fill="none">
          <path d="M2 4.6C6.3.8 11.7.8 16 4.6M5 7.5c2.4-2 5.6-2 8 0M8.1 10.2c.5-.5 1.3-.5 1.8 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <svg viewBox="0 0 25 12" fill="none">
          <rect x=".7" y=".7" width="21" height="10.6" rx="3" stroke="currentColor" strokeWidth="1.4" opacity=".45" />
          <rect x="2.7" y="2.5" width="16.5" height="7" rx="1.5" fill="currentColor" />
          <path d="M23 4v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity=".45" />
        </svg>
      </span>
    </div>
  );
}

function NewSandwichScreen({ phase, value }: { phase: HeroPhase; value: string }) {
  const agentEnabled = phase === "ready" || phase === "pressing";

  return (
    <div className={`${styles.mockScreenView} ${styles.mockComposer}`}>
      <PhoneStatusBar />
      <div className={styles.mockComposerHeader}>
        <span className={styles.mockBack} aria-hidden="true">‹</span>
        <strong>New Sandwich</strong>
      </div>

      <div className={styles.mockPromptRow}>
        <span className={styles.mockCreatorAvatar} aria-hidden="true">V</span>
        <div className={styles.mockPromptField}>
          <span className={styles.mockYoutube} aria-hidden="true">
            <svg viewBox="0 0 24 18">
              <rect width="24" height="18" rx="5" fill="currentColor" />
              <path d="m10 5 6 4-6 4V5Z" fill="white" />
            </svg>
          </span>
          <span className={value ? styles.mockPromptText : styles.mockPromptPlaceholder}>
            {value || "Paste a link or write your thesis"}
          </span>
          {phase === "typing" ? <span className={styles.mockPromptCaret} /> : null}
        </div>
      </div>

      <div className={styles.mockComposerControls}>
        <div className={styles.mockQuickActions} aria-hidden="true">
          <span>@</span>
          <span>$</span>
        </div>
        <div className={styles.mockAgentControl}>
          <span>Sandwich Agent</span>
          <span className={`${styles.mockToggle}${agentEnabled ? ` ${styles.mockToggleOn}` : ""}`}>
            <i />
          </span>
        </div>
        <span
          className={`${styles.mockContinue}${agentEnabled ? ` ${styles.mockContinueReady}` : ""}${phase === "pressing" ? ` ${styles.mockContinuePressed}` : ""}`}
        >
          Continue
        </span>
      </div>
    </div>
  );
}

function SandwichLoadingScreen() {
  return (
    <div className={`${styles.mockScreenView} ${styles.mockLoading}`}>
      <PhoneStatusBar />
      <div className={styles.mockLoadingContent}>
        <div className={styles.mockLoader} aria-hidden="true">
          <span>🥪</span>
          <i />
        </div>
        <strong>Building your sandwich</strong>
        <span>Finding the best ways to back your thesis…</span>
        <div className={styles.mockLoadingPills} aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
      </div>
    </div>
  );
}

function SandwichResultScreen({ thesis }: { thesis: string }) {
  return (
    <div className={`${styles.mockScreenView} ${styles.mockResult}`}>
      <PhoneStatusBar />
      <div className={styles.mockResultContent}>
        <span className={styles.mockResultBack} aria-hidden="true">‹</span>

        <div className={styles.mockCreatorRow}>
          <span className={styles.mockCreatorAvatar} aria-hidden="true">V</span>
          <strong>vzy</strong>
          <span className={styles.mockVerified} aria-label="Verified">✓</span>
          <span className={styles.mockAge}>200d ago</span>
        </div>

        <p className={styles.mockThesis}>{thesis || SEED_PROMPT}</p>

        <div className={styles.mockSocialActions} aria-hidden="true">
          <span>♡ <small>2</small></span>
          <span>◯</span>
          <span>♧</span>
          <span>⇧</span>
        </div>

        <div className={styles.mockPerformance}>
          <strong>-6.18%</strong>
          <svg viewBox="0 0 290 125" preserveAspectRatio="none" aria-label="Three month sandwich performance chart">
            <path className={styles.mockChartBaseline} d="M0 82H290" />
            <path
              className={styles.mockChartLine}
              d="M0 89 8 94 17 83 27 96 37 107 47 91 58 88 69 94 80 86 87 102 101 100 112 102 124 98 132 113 142 108 151 96 160 94 171 83 181 76 190 79 199 69 207 78 216 63 225 72 233 54 242 47 251 55 260 58 271 69 282 66 290 77"
            />
          </svg>
          <div className={styles.mockAxis}><span>Jul 17</span><span>Since created</span></div>
        </div>

        <div className={styles.mockPeriods} aria-hidden="true">
          <span>24H</span><span>1W</span><span>1M</span><strong>3M</strong>
        </div>

        <div className={styles.mockPositions}>
          <div className={styles.mockPosition}>
            <span className={`${styles.mockAssetLogo} ${styles.mockLilly}`}>Lilly</span>
            <span className={styles.mockAssetName}><strong>LLY</strong><small>25%</small></span>
            <span className={styles.mockAssetValue}><strong>$1,075.02</strong><small>NEW</small></span>
          </div>
          <div className={styles.mockPosition}>
            <span className={`${styles.mockAssetLogo} ${styles.mockHims}`}>h</span>
            <span className={styles.mockAssetName}><strong>HIMS</strong><small>48%</small></span>
            <span className={styles.mockAssetValue}><strong>$33.01</strong><em>+5.66%</em></span>
          </div>
          <div className={styles.mockPosition}>
            <span className={`${styles.mockAssetLogo} ${styles.mockFda}`}>FDA</span>
            <span className={styles.mockAssetName}><strong>FDA approves</strong><small>27%</small></span>
            <span className={styles.mockAssetValue}><small className={styles.mockYes}>YES</small></span>
          </div>
        </div>

        <span className={styles.mockBuy}>BUY</span>
      </div>
    </div>
  );
}

function HeroPhoneScreen({ phase, value }: { phase: HeroPhase; value: string }) {
  if (phase === "done") return <SandwichResultScreen thesis={value} />;
  if (phase === "loading") return <SandwichLoadingScreen />;
  return <NewSandwichScreen phase={phase} value={value} />;
}

const BACKING_OPTIONS = [
  "Stocks",
  "Crypto",
  "Prediction markets",
  "Leverage",
  "Metals",
  "Private companies",
];

const BACK_RADIUS = 190; // wheel radius in px
const BACK_ANGLE = 0.4; // radians between slots (~23°)

// Animated "focus picker": words scroll through a centered focus line where
// the active word is sharp + white, the rest are blurred + dimmed.
// ── per-asset right-panel visuals ──────────────────────────────────

function StocksVisual() {
  const tokens = [
    /* layer 1 — front, sharp */
    { tk: "NVDA", img: "https://www.tokens.xyz/logos/xstocks/NVDAx.png", size: 140, bottom: -15, right: 60,  z: 3, delay: 0,    layer: 1 },
    { tk: "TSLA", img: "https://www.tokens.xyz/logos/xstocks/TSLAx.png", size: 120, bottom: 100, right: -5,  z: 4, delay: 0.12, layer: 1 },
    /* layer 2 — mid, slight blur */
    { tk: "HOOD", img: "https://www.tokens.xyz/logos/xstocks/HOODx.png", size: 95,  bottom: 50,  right: -30, z: 2, delay: 0.24, layer: 2 },
    { tk: "AAPL", img: "https://www.tokens.xyz/logos/xstocks/AAPLx.png", size: 80,  bottom: 210, right: 50,  z: 2, delay: 0.36, layer: 2 },
    /* layer 3 — back, more blur */
    { tk: "COIN", img: "https://www.tokens.xyz/logos/xstocks/COINx.png", size: 65,  bottom: 175, right: -20, z: 1, delay: 0.48, layer: 3 },
    { tk: "GME",  img: "https://www.tokens.xyz/logos/xstocks/GMEx.png",  size: 55,  bottom: 260, right: 120, z: 1, delay: 0.6,  layer: 3 },
  ];
  return (
    <div className={styles.cryptoPanel}>
      <div className={styles.stocksGlow} />
      {tokens.map((t) => (
        <Image
          key={t.tk}
          src={t.img}
          alt={t.tk}
          width={t.size}
          height={t.size}
          unoptimized
          className={`${styles.stockTokenImg}${t.layer === 2 ? ` ${styles.stockTokenMid}` : t.layer === 3 ? ` ${styles.stockTokenFar}` : ""}`}
          style={{
            width: t.size,
            height: t.size,
            bottom: t.bottom,
            right: t.right,
            zIndex: t.z,
            animationDelay: `${t.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

function CryptoVisual() {
  return (
    <div className={styles.cryptoPanel}>
      <Image
        src="/crypto.png"
        alt="Crypto"
        width={300}
        height={300}
        unoptimized
        className={styles.assetImg}
      />
    </div>
  );
}

function PredMarketsVisual() {
  return (
    <div className={styles.predPanel}>
      <Image
        src="/yesno.png"
        alt="YES NO prediction market"
        fill
        sizes="(max-width: 768px) 100vw, 480px"
        className={styles.predImage}
        priority
      />
    </div>
  );
}

function LeverageVisual() {
  return (
    <div className={styles.levPanel}>
      {(["2×", "5×", "10×"] as const).map((lev, i) => (
        <div key={lev} className={styles.levBadge} style={{ animationDelay: `${i * 0.2}s` }}>
          {lev}
        </div>
      ))}
    </div>
  );
}

function MetalsVisual() {
  const metals = [
    { sym: "Au", name: "Gold",   color: "#fbbf24" },
    { sym: "Ag", name: "Silver", color: "#94a3b8" },
  ];
  return (
    <div className={styles.metalsPanel}>
      {metals.map((m, i) => (
        <div key={m.name} className={styles.metalBar} style={{ animationDelay: `${i * 0.25}s` }}>
          <span className={styles.metalSym} style={{ color: m.color }}>{m.sym}</span>
          <span className={styles.metalName}>{m.name}</span>
        </div>
      ))}
    </div>
  );
}

function PrivateCompaniesVisual() {
  const tokens = [
    /* layer 1 — front */
    { tk: "OpenAI",     img: "https://www.tokens.xyz/logos/prestocks/openai.png", size: 130, bottom: -10, right: 55,  z: 3, delay: 0,    layer: 1 },
    { tk: "SpaceX",     img: "https://play-lh.googleusercontent.com/4S1nfdKsH_1tJodkHrBHimqlCTE6qx6z22zpMyPaMc_Rlr1EdSFDI1I6UEVMnokG5zI=s256-rw", size: 110, bottom: 95, right: -10, z: 4, delay: 0.12, layer: 1 },
    /* layer 2 — mid */
    { tk: "Polymarket", img: "https://www.tokens.xyz/logos/prestocks/polymarket.png", size: 85, bottom: 45, right: -25, z: 2, delay: 0.24, layer: 2 },
    /* layer 3 — far */
  ];
  return (
    <div className={styles.cryptoPanel}>
      <div className={styles.stocksGlow} />
      {tokens.map((t) => (
        <Image
          key={t.tk}
          src={t.img}
          alt={t.tk}
          width={t.size}
          height={t.size}
          unoptimized
          className={`${styles.stockTokenImg}${t.layer === 2 ? ` ${styles.stockTokenMid}` : t.layer === 3 ? ` ${styles.stockTokenFar}` : ""}`}
          style={{
            width: t.size,
            height: t.size,
            bottom: t.bottom,
            right: t.right,
            zIndex: t.z,
            animationDelay: `${t.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

const ASSET_VISUALS = [StocksVisual, CryptoVisual, PredMarketsVisual, LeverageVisual, MetalsVisual, PrivateCompaniesVisual];

function AssetVisual({ activeIndex }: { activeIndex: number }) {
  return (
    <div className={styles.assetVisuals}>
      {ASSET_VISUALS.map((Panel, i) => (
        <div key={i} className={`${styles.assetPanel}${i === activeIndex ? ` ${styles.assetPanelActive}` : ""}`}>
          <Panel />
        </div>
      ))}
    </div>
  );
}

// ── main component ──────────────────────────────────────────────────

function BackYourThesis() {
  const n = BACKING_OPTIONS.length;
  const half = Math.floor(n / 2);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActive((a) => (a + 1) % n), 1850);
    return () => clearInterval(id);
  }, [n]);

  return (
    <div className={styles.backThesis}>
      {/* left — wheel */}
      <div className={styles.backThesisLeft}>
        <div className={styles.backThesisViewport}>
          <span className={styles.backThesisArrow} aria-hidden="true">→</span>
          <div className={styles.backThesisWheel}>
            {BACKING_OPTIONS.map((word, i) => {
              let off = (i - active) % n;
              if (off > half) off -= n;
              if (off < -half) off += n;
              const dist = Math.abs(off);
              const focused = dist === 0;
              const wrapping = off === half;
              const theta = off * BACK_ANGLE;
              const x = BACK_RADIUS * (1 - Math.cos(theta));
              const y = BACK_RADIUS * Math.sin(theta);
              const style: CSSProperties = {
                transform: `translate(${x}px, calc(-50% + ${y}px))`,
                transition: wrapping
                  ? "none"
                  : "transform 0.7s cubic-bezier(0.22,0.61,0.36,1), opacity 0.7s ease, filter 0.7s ease, font-size 0.7s ease, color 0.7s ease",
                opacity: focused ? 1 : Math.max(0.12, 0.6 - dist * 0.2),
                filter: focused ? "none" : `blur(${dist * 2}px)`,
                color: "#ffffff",
                fontSize: focused ? Math.min(48, 600 / word.length) : Math.max(18, 28 - dist * 5),
                fontWeight: focused ? 800 : 700,
              };
              return (
                <div key={word} className={styles.backThesisItem} style={style}>{word}</div>
              );
            })}
          </div>
        </div>
      </div>

      {/* right — asset-specific animation */}
      <div className={styles.backThesisRight}>
        <AssetVisual activeIndex={active} />
      </div>
    </div>
  );
}

function BackYourThesisSticker() {
  return (
    <div className={styles.thesisSticker}>
      <Image
        src="/sticker.png"
        alt="Back your thesis with"
        width={160}
        height={160}
        unoptimized
        className={styles.thesisStickerImg}
      />
    </div>
  );
}

export function BreadHero() {
  const [initialSw] = useState(createSeedSandwich);
  const [value, setValue] = useState("");
  const [phase, setPhase] = useState<HeroPhase>("idle");
  const [sw, setSw] = useState<Sandwich>(initialSw);
  const [shown, setShown] = useState(initialSw.items.length);
  const [banner, setBanner] = useState(true);
  const [anim, setAnim] = useState(1);
  const [drawn, setDrawn] = useState(true);
  const [activeCardId, setActiveCardId] = useState(THESIS_CARDS[0].id);
  const [navVisible, setNavVisible] = useState(true);
  const [sendPulse, setSendPulse] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const rafRef = useRef(0);
  const restartRef = useRef<() => void>(() => {});

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  useEffect(() => {
    const onScroll = () =>
      setNavVisible(window.scrollY < window.innerHeight * 0.85);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // kick off the auto-loop on mount via restartRef (set below)
  useEffect(() => {
    const id = setTimeout(() => restartRef.current(), 600);
    return () => clearTimeout(id);
  }, []);

  const startGrowth = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setAnim(1);
      return;
    }

    const ease = (t: number) => 1 - (1 - t) ** 3;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / GROW_MS);
      setAnim(ease(progress));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const run = useCallback(
    (textArg?: string) => {
      const text = (textArg ?? value).trim();
      if (!text) return;

      clearTimers();
      setValue(text);
      setPhase("ready");
      setShown(0);
      setBanner(false);
      setAnim(0);
      setDrawn(false);

      const nextSandwich = generate(text);
      setSw(nextSandwich);

      timers.current.push(setTimeout(() => setPhase("pressing"), 700));
      timers.current.push(setTimeout(() => setPhase("loading"), 900));
      timers.current.push(
        setTimeout(() => {
          setPhase("done");
          timers.current.push(
            setTimeout(() => {
              setBanner(true);
              setDrawn(true);
              startGrowth();
            }, 90),
          );

          nextSandwich.items.forEach((_, index) => {
            timers.current.push(
              setTimeout(
                () => {
                  setShown((current) => Math.max(current, index + 1));
                },
                360 + index * 240,
              ),
            );
          });

          // auto-loop: restart after growth animation + display hold
          timers.current.push(
            setTimeout(() => {
              restartRef.current();
            }, 4200 + 2800),
          );
        }, 2300),
      );
    },
    [clearTimers, startGrowth, value],
  );

  // types out text char-by-char, pulses send button, then calls run
  const autoLoop = useCallback(() => {
    clearTimers();
    setValue("");
    setPhase("typing");
    const prompt = SEED_PROMPT;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(prompt);
      timers.current.push(setTimeout(() => run(prompt), 400));
      return;
    }
    [...prompt].forEach((_, i) => {
      timers.current.push(
        setTimeout(() => {
          setValue(prompt.slice(0, i + 1));
          if (i === prompt.length - 1) {
            // Let the completed thesis rest, then enable and press Continue.
            timers.current.push(
              setTimeout(() => {
                setSendPulse(true);
                timers.current.push(
                  setTimeout(() => {
                    setSendPulse(false);
                    run(prompt);
                  }, 300),
                );
              }, 400),
            );
          }
        }, 400 + i * 58),
      );
    });
  }, [clearTimers, run]);

  // keep restartRef pointing at the latest autoLoop
  useEffect(() => { restartRef.current = autoLoop; }, [autoLoop]);

  const accent = "#00eb36";
  const accentStyle = { "--accent": accent } as CSSProperties;
  const handleCardSelect = useCallback(
    (card: ThesisCard) => {
      setActiveCardId(card.id);
      run(card.thesis);
    },
    [run],
  );

  return (
    <div className={styles.page}>
      <nav
        className={`${styles.navbar}${navVisible ? "" : ` ${styles.navbarHidden}`}`}
      >
        <Image
          src="/logo.png"
          alt="Bread"
          width={48}
          height={48}
          className={styles.navLogo}
        />
        <div className={styles.navLinks}>
          <a
            href="https://x.com/breadappfun"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.navIcon}
            aria-label="X (Twitter)"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
          <a
            href="https://www.instagram.com/trybreadapp/"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.navIcon}
            aria-label="Instagram"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
            </svg>
          </a>
        </div>
        <div className={styles.testflightCta}>
          <a
            href="https://testflight.apple.com/join/8UAWE67D"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.navCta}
          >
            <span>JOIN TESTFLIGHT</span>
            <svg
              viewBox="0 0 20 20"
              aria-hidden="true"
              className={styles.navCtaArrow}
            >
              <path d="M6 14 14 6m0 0H8m6 0v6" />
            </svg>
          </a>
          <span className={styles.testflightPopover} aria-hidden="true">
            <span className={styles.popoverGlow} />
            <span className={styles.qrFrame}>
              <Image
                src="/testflight-qr.svg"
                alt=""
                width={198}
                height={198}
                className={styles.qrCode}
              />
            </span>
            <span className={styles.popoverCopy}>
              <strong>Scan to get Bread</strong>
            </span>
          </span>
        </div>
      </nav>
      <div className={styles.stage}>
        <div className={styles.compose}>
          <div className={styles.brandLockup} aria-label="Bread app">
            <Image
              src="/breadtext.PNG"
              alt="Bread"
              width={1800}
              height={430}
              priority
              className={styles.breadLogo}
            />
            <span className={styles.appText}>app</span>
          </div>
          <div className={styles.thesisCards} aria-label="Example theses">
            {THESIS_CARDS.map((card) => {
              const active = card.id === activeCardId;

              return (
                <button
                  key={card.id}
                  type="button"
                  className={`${styles.thesisCard} ${styles[card.positionClass]} ${active ? styles.thesisCardActive : ""}`}
                  onClick={() => handleCardSelect(card)}
                  aria-pressed={active}
                >
                  <div className={styles.thesisCardHeader}>
                    <span
                      className={styles.thesisAvatar}
                      style={{ background: card.accent }}
                      aria-hidden="true"
                    >
                      {card.avatar}
                    </span>
                    <div className={styles.thesisMeta}>
                      <span className={styles.thesisUser}>{card.handle}</span>
                    </div>
                  </div>
                  <p className={styles.thesisText}>“{card.thesis}”</p>
                </button>
              );
            })}
          </div>
          <div className={styles.phoneWindow}>
            <div className={styles.phone}>
              <span className={`${styles.button} ${styles.actionButton}`} />
              <span className={`${styles.button} ${styles.volumeUpButton}`} />
              <span className={`${styles.button} ${styles.volumeDownButton}`} />
              <span className={`${styles.button} ${styles.powerButton}`} />
              <div className={styles.screen}>
                <HeroPhoneScreen phase={phase} value={value} />
                <div className={styles.legacyPhoneUi} aria-hidden="true" hidden>
                  <div className={styles.body}>
                  {phase === "idle" ? (
                    <div className={`${styles.loading} ${styles.loadingIntro}`}>
                      <div className={styles.loaf}>🥪</div>
                      <div className={styles.introCaption}>
                        What do you believe? Type it below and we&apos;ll build
                        it.
                      </div>
                    </div>
                  ) : phase === "typing" ? (
                    <div className={styles.composeView}>
                      <div className={styles.composeTabs}>
                        <span className={styles.composeTabActive}>New post</span>
                        <span className={styles.composeTabDot} />
                        <span className={styles.composeTabMuted}>Draft</span>
                      </div>

                      <div className={styles.composeCard}>
                        <div className={styles.composeCardHeader}>
                          <div className={styles.composeAvatar} style={{ background: "#2bff66" }}>V</div>
                          <span className={styles.composeName}>@vzy010</span>
                          <span className={styles.composeTime}>now</span>
                        </div>

                        <div className={styles.composeBody}>
                          <span className={styles.composeText}>{value}</span>
                          <span className={styles.composeCaret} />
                        </div>

                        <div className={styles.composeChoices}>
                          <button
                            type="button"
                            className={`${styles.composeChoice} ${styles.composeChoicePrimary}`}
                          >
                            <span className={styles.composeChoiceTitle}>Let BQ cook</span>
                            <span className={styles.composeChoiceArrow}>→</span>
                          </button>
                          <button
                            type="button"
                            className={styles.composeChoice}
                          >
                            <span className={styles.composeChoiceTitle}>Stack it myself</span>
                            <span className={styles.composeChoiceArrow}>→</span>
                          </button>
                        </div>
                      </div>

                      <div className={styles.composeFooter}>
                        <div className={styles.composeProgress}>
                          <div
                            className={styles.composeProgressBar}
                            style={{ width: `${Math.min(100, (value.length / SEED_PROMPT.length) * 100)}%` }}
                          />
                        </div>
                        <div className={`${styles.composePostBtn}${value.length >= SEED_PROMPT.length ? ` ${styles.composePostBtnReady}` : ""}`}>
                          Post thesis →
                        </div>
                      </div>
                    </div>
                  ) : phase === "loading" ? (
                    <div className={styles.skeletonWrap}>
                      <div className={`${styles.skeletonBar} ${styles.skeletonReturn}`} />
                      <div className={`${styles.skeletonBar} ${styles.skeletonChart}`} />
                      {[0, 1, 2].map((i) => (
                        <div key={i} className={styles.skeletonRow} style={{ animationDelay: `${i * 0.12}s` }}>
                          <div className={styles.skeletonCircle} />
                          <div className={styles.skeletonLines}>
                            <div className={styles.skeletonLine} />
                            <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.scroll}>
                      <div
                        className={`${styles.socialCard} ${banner ? styles.resultHeadIn : ""}`}
                      >
                        <div className={styles.socialHeaderRow}>
                          <span
                            className={styles.socialAvatar}
                            style={{ background: "#2bff66" }}
                            aria-hidden="true"
                          />
                          <span className={styles.socialName}>vzy010</span>
                          <svg
                            className={styles.verifiedBadge}
                            viewBox="0 0 20 20"
                            aria-label="verified"
                          >
                            <path
                              d="M10 1.5l1.9 1.4 2.3-.4 1.1 2 2.1 1-.1 2.3 1.4 1.9-1.4 1.9.1 2.3-2.1 1-1.1 2-2.3-.4L10 18.5l-1.9-1.4-2.3.4-1.1-2-2.1-1 .1-2.3L1.3 10.3l1.4-1.9-.1-2.3 2.1-1 1.1-2 2.3.4L10 1.5z"
                              fill="#1a4dff"
                            />
                            <path
                              d="M6.5 10.2l2.4 2.4 4.6-4.6"
                              fill="none"
                              stroke="#fff"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <button
                            type="button"
                            className={styles.followBtn}
                            aria-label="Follow"
                          >
                            Follow
                          </button>
                        </div>

                        <p className={styles.socialQuote}>
                          &ldquo;{value || SEED_PROMPT}&rdquo;
                        </p>

                        <div className={styles.socialActions}>
                          <span className={styles.socialActionItem}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                            </svg>
                            26
                          </span>
                          <span className={styles.socialActionItem}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                              <polyline points="16 6 12 2 8 6" />
                              <line x1="12" y1="2" x2="12" y2="15" />
                            </svg>
                          </span>
                          <span className={styles.socialActionsTime}>5 days</span>
                        </div>
                      </div>

                      <div
                        className={`${styles.chart} ${styles.chartOverlay} ${drawn ? styles.chartDrawn : ""}`}
                        style={accentStyle}
                      >
                        <span
                          className={styles.chartPercent}
                          style={{ color: accent }}
                        >
                          {fmtPct(sw.ret * anim)}
                        </span>
                        <svg
                          viewBox={`0 0 ${sw.chart.W} ${sw.chart.H}`}
                          preserveAspectRatio="none"
                        >
                          <defs>
                            <linearGradient
                              id="fade"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="0%"
                                stopColor={accent}
                                stopOpacity="0.26"
                              />
                              <stop
                                offset="100%"
                                stopColor={accent}
                                stopOpacity="0"
                              />
                            </linearGradient>
                          </defs>
                          <line
                            x1="0"
                            y1={sw.chart.base}
                            x2={sw.chart.W}
                            y2={sw.chart.base}
                            stroke="#E6E6EA"
                            strokeWidth="1"
                            strokeDasharray="3 4"
                          />
                          {/* area gradient removed */}
                          <path
                            className={styles.line}
                            pathLength={1}
                            d={sw.chart.line}
                            fill="none"
                            stroke={accent}
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <circle
                            className={styles.chartDot}
                            cx={sw.chart.dot.x}
                            cy={sw.chart.dot.y}
                            r="4"
                            fill={accent}
                            style={{ opacity: anim > 0.9 ? 1 : 0 }}
                          />
                        </svg>
                      </div>

                      {/*<div className={styles.ingredientsHead}>
                        <span className={styles.total}>
                          {sw.items.length} total
                        </span>
                      </div>*/}

                      <div className={styles.positions}>
                        {sw.items.map((position, index) => (
                          <div
                            key={position.k}
                            className={`${styles.position} ${index < shown ? styles.positionIn : ""}`}
                          >
                            <div
                              className={styles.token}
                              style={
                                position.image
                                  ? {
                                      backgroundColor: "#fff",
                                      backgroundImage: `url(${position.image})`,
                                      backgroundPosition: "center",
                                      backgroundRepeat: "no-repeat",
                                      backgroundSize: "cover",
                                    }
                                  : { background: position.c }
                              }
                              aria-label={position.nm}
                              role="img"
                            >
                              {!position.image ? position.tk : null}
                            </div>
                            <div className={styles.info}>
                              <div className={styles.name}>{position.nm}</div>
                              <div className={styles.allocation}>
                                {position.pct}%
                              </div>
                            </div>
                            <div className={styles.right}>
                              <div className={styles.price}>
                                {fmtPrice(position.pxv * anim, position.unit)}
                              </div>
                              <div
                                className={`${styles.change} ${position.up ? styles.changeUp : styles.changeDown}`}
                              >
                                {fmtPct(position.chg * anim)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <button type="button" className={styles.buyBtn}>
                        BUY
                      </button>
                    </div>
                  )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.inputWrap}>
            <div className={styles.field}>
              <div className={styles.typed}>
                {value ? (
                  <span className={styles.text}>{value}</span>
                ) : (
                  <span className={styles.placeholder}>
                    I wanna long looksmaxxing
                  </span>
                )}
                <span className={styles.caret} />
              </div>
              <button
                className={`${styles.send}${sendPulse ? ` ${styles.sendPulse}` : ""}`}
                onClick={() => run()}
                aria-label="Generate sandwich"
              >
                <Image
                  src="/sandwich.png"
                  alt="sandwich"
                  width={44}
                  height={44}
                  className={styles.sendIcon}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      <section className={styles.howSection}>
        {/*<h2 className={styles.howHeading}>How it works</h2>*/}
        <div className={styles.howGrid}>
          <div className={styles.howCard}>
            <Image
              src="/thesis.PNG"
              alt="Express your thesis"
              fill
              sizes="(max-width: 768px) 100vw, 360px"
              className={styles.howCardImage}
              priority
            />
          </div>
          <div className={styles.howCardWrapper}>
            <div className={`${styles.howCard} ${styles.howCardDark}`}>
              <BackYourThesis />
            </div>
            <BackYourThesisSticker />
          </div>
        </div>
      </section>

      <section className={styles.socialSection}>
        <div className={styles.socialSectionInner}>
          <div className={styles.socialCopy}>
            <span className={styles.socialEyebrow}>SOCIAL</span>
            <h2 className={styles.socialHeading}>
              Conviction isn&apos;t solo.<br />Post it. Share it. Stack with the group.
            </h2>
            <p className={styles.socialSub}>
              See what operators are stacking right now, follow the theses you
              trust, and copy the sandwich with one tap.
            </p>
          </div>

          <div className={styles.socialStage}>
            <div className={styles.socialHeroWrap}>
              <Image
                src="/social-hero.PNG"
                alt="Three hands holding phones — Bread is social"
                fill
                sizes="(max-width: 768px) 100vw, 560px"
                className={styles.socialHeroImg}
                priority
              />
            </div>

            <div className={`${styles.chatBubble} ${styles.chatBubbleA}`}>
              <span className={styles.chatBubbleHandle}>@vzy010</span>
              <span className={styles.chatBubbleText}>
                looksmaxxing will keep going mainstream
              </span>
              <span className={styles.chatBubblePnl}>+32%</span>
            </div>

            <div className={`${styles.chatBubble} ${styles.chatBubbleB}`}>
              <span className={styles.chatBubbleHandle}>@otis</span>
              <span className={styles.chatBubbleText}>
                copied this sandwich, lfg
              </span>
            </div>

            <div className={`${styles.chatBubble} ${styles.chatBubbleC}`}>
              <span className={styles.chatBubbleHandle}>@prshbt</span>
              <span className={styles.chatBubbleText}>
                AI infra repricing in Q3 — back it?
              </span>
              <span className={styles.chatBubblePnl}>+18%</span>
            </div>

            <div className={`${styles.chatBubble} ${styles.chatBubbleD}`}>
              <span className={styles.chatBubbleText}>
                🔥 backed by 142 operators
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
