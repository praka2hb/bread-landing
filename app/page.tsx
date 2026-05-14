import Image from "next/image";
import { ScrollScale, StickyFeatures } from "./scroll-scale";

const tickers = [
  { s: "TSLA", p: "$442.92", c: "+21.36%" },
  { s: "NVDA", p: "$1,284.10", c: "+4.12%" },
  { s: "AAPL", p: "$231.05", c: "+0.85%" },
  { s: "SPYX", p: "$612.40", c: "+1.92%" },
  { s: "XOM", p: "$149.88", c: "+0.85%" },
  { s: "CVX", p: "$188.35", c: "+2.38%" },
  { s: "MSFT", p: "$498.21", c: "+1.04%" },
  { s: "META", p: "$702.55", c: "-0.41%" },
];

function Logo({ size = 36 }: { size?: number }) {
  return (
    <Image
      src="/logo.png"
      alt="Bread"
      width={size}
      height={size}
      className="object-contain"
      priority
    />
  );
}

function Ticker() {
  const row = [...tickers, ...tickers];
  return (
    <div className="relative w-full overflow-hidden border-y border-border bg-soft py-3">
      <div className="ticker flex w-max gap-10 whitespace-nowrap">
        {row.map((t, i) => (
          <div key={i} className="flex items-center gap-3 font-mono text-sm">
            <span className="font-semibold text-navy">{t.s}</span>
            <span className="text-muted">{t.p}</span>
            <span
              className={
                t.c.startsWith("-")
                  ? "font-semibold text-magenta"
                  : "font-semibold text-accent-deep"
              }
            >
              {t.c}
            </span>
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-background to-transparent" />
    </div>
  );
}

function Nav() {
  return (
    <nav className="absolute top-0 left-0 right-0 z-20 flex items-center px-6 py-5 sm:px-10">
      <div className="flex items-center gap-2.5">
        <Logo size={38} />
        <span className="text-xl font-semibold tracking-tight text-navy">
          Bread
        </span>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden pt-28 pb-12 sm:pt-32 sm:pb-16">
      <div className="grid-bg pointer-events-none absolute inset-0" />
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full pulse-glow"
        style={{
          background:
            "radial-gradient(closest-side, rgba(32,230,0,0.16), transparent 70%)",
        }}
      />
      <div className="relative mx-auto flex max-w-6xl flex-col items-center px-6 text-center">
        <h1 className="max-w-4xl text-5xl font-semibold leading-[1.02] tracking-tight text-navy sm:text-[5.5rem]">
          The stock market,
          <br />
          <span className="relative inline-block">
            <span className="relative z-10">rebuilt</span>
            <span className="absolute inset-x-0 bottom-2 z-0 h-3 bg-accent/60 sm:h-4" />
          </span>{" "}
          on Solana.
        </h1>
        <p className="mt-7 max-w-lg text-lg leading-relaxed text-muted">
          One wallet. Real equities. Leverage when you want it, sandwich
          portfolios when you don&apos;t. Bread is how Gen Z invests.
        </p>

        <ScrollScale range={0.18}>
          <div className="relative mt-16 flex w-full items-end justify-center gap-6 sm:gap-10">
            <div className="float-delay hidden sm:block">
              <div className="phone-frame w-[210px] glow-soft opacity-95">
                <Image
                  src="/news.png"
                  alt="News feed"
                  width={210}
                  height={440}
                  className="h-auto w-full"
                />
              </div>
            </div>
            <div className="float relative z-10">
              <div className="phone-frame w-[260px] glow-green sm:w-[300px]">
                <Image
                  src="/chart.png"
                  alt="Stock chart"
                  width={300}
                  height={620}
                  className="h-auto w-full"
                />
              </div>
            </div>
            <div className="float-delay hidden sm:block">
              <div className="phone-frame w-[210px] glow-soft opacity-95">
                <Image
                  src="/leverage.png"
                  alt="Leverage buy"
                  width={210}
                  height={440}
                  className="h-auto w-full"
                />
              </div>
            </div>
          </div>
        </ScrollScale>
      </div>
    </section>
  );
}

function SectionIntro() {
  return (
    <div className="mx-auto max-w-6xl px-6 pt-24 pb-4">
      <div className="flex items-end justify-between gap-8">
        <div>
          <div className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-muted">
            What&apos;s inside
          </div>
          <h2 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight text-navy sm:text-5xl">
            Four screens. Everything an investor actually uses.
          </h2>
        </div>
        <div className="hidden max-w-xs text-right text-sm leading-relaxed text-muted lg:block">
          Built for the way people invest now — fast, social, mobile-first, and
          settled on-chain in under a second.
        </div>
      </div>
    </div>
  );
}

function Closing() {
  return (
    <section className="relative overflow-hidden px-6 py-24 sm:py-32">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <div>
          <div className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-muted">
            One more thing
          </div>
          <h2 className="max-w-md text-5xl font-semibold leading-[1.05] tracking-tight text-navy sm:text-6xl">
            Markets that never{" "}
            <span className="relative inline-block">
              <span className="relative z-10">sleep</span>
              <span className="absolute inset-x-0 bottom-1 z-0 h-3 bg-accent/60 sm:h-4" />
            </span>
            .
          </h2>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-muted">
            Wall Street closes at 4pm. Bread doesn&apos;t. Trade equities at
            midnight, on the train, between classes — anywhere you have a
            wallet.
          </p>
          <div className="mt-10 flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-accent pulse-glow" />
              <span className="text-navy">Live now on Solana mainnet</span>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 -z-10 grid-bg opacity-70" />
          <div className="relative flex items-center justify-center">
            <div className="absolute h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
            <Logo size={220} />
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const features = [
    {
      eyebrow: "Charts",
      title: "Every ticker. Every candle. Live.",
      body: "TSLA, NVDA, AAPL — tokenized one-to-one and traded against USDC. Real-time price action with the headlines that moved it pinned right into the chart.",
      image: "/chart.png",
    },
    {
      eyebrow: "Leverage",
      title: "Conviction, amplified.",
      body: "Borrow against USDC collateral up to 4× and place the trade in two taps. No spreads buried in the rate, no liquidations you didn't see coming — every number on screen is the number on-chain.",
      image: "/leverage.png",
    },
    {
      eyebrow: "Sandwich",
      title: "A thesis, in one buy.",
      body: "Stack tickers, set the weights, write the reasoning. Friends can copy the whole sandwich with one tap — and watch it move together, the way real portfolios do.",
      image: "/sandwich.png",
    },
    {
      eyebrow: "Signal",
      title: "Only the news that moves price.",
      body: "Cointelegraph, Polymarket, the analysts you actually follow. Ranked by what's currently trading, not what's currently trending.",
      image: "/news.png",
    },
  ];

  return (
    <div className="relative flex flex-1 flex-col bg-background">
      <Nav />
      <Hero />
      <Ticker />
      <SectionIntro />
      <section className="relative pb-16">
        <StickyFeatures items={features} />
      </section>
      <Closing />
    </div>
  );
}
