"use client";

import Image from "next/image";
import { useMotionValueEvent, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { BRANDS, type BrandKey } from "./brands";
import { GlossyLogo, Logo, LogoStack } from "./Logo";
import s from "./how.module.css";

/*
 * How Bread works: one phone, three ways an idea becomes a position.
 *
 * Nothing here plays on its own. Every scene is a pure function of `t` (seconds of
 * a storyboard), and `t` comes from the scroll position, smoothed by a spring. Scroll
 * down and the scene moves forward, stop and it holds, scroll up and it rewinds.
 * So every entrance is an inline style computed from `t`, never a CSS keyframe or
 * transition, which would play on the browser's clock instead of the reader's.
 * Scenes are drawn on the app's own 390 x 844 canvas and scaled to fit the phone.
 */

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);

/** 0 → 1 as `t` crosses [at, at + d], eased. The one primitive every entrance uses. */
const ramp = (t: number, at: number, d = 0.45) => easeOut(clamp01((t - at) / d));

/** A message/card arriving: fades up and settles. */
const rise = (p: number, y = 14): CSSProperties => ({
  opacity: p,
  transform: `translateY(${(1 - p) * y}px) scale(${0.96 + 0.04 * p})`,
});

/** `text` revealed between `from` and `to` seconds, emoji-safe. */
function typed(text: string, t: number, from: number, to: number) {
  const chars = Array.from(text);
  return chars.slice(0, Math.round(clamp01((t - from) / (to - from)) * chars.length)).join("");
}

/**
 * Scroll → storyboard. Returns the smoothed progress through `target` (0..1) as React
 * state, rounded so a still page never re-renders. The spring is what makes a
 * trackpad flick feel like film rather than a stepper.
 */
function useScrubbed(target: RefObject<HTMLElement | null>, enabled: boolean) {
  const { scrollYProgress } = useScroll({ target, offset: ["start start", "end end"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 220, damping: 38, mass: 0.5, restDelta: 0.0001 });
  const [v, setV] = useState(0);
  useMotionValueEvent(smooth, "change", (x) => {
    if (enabled) setV(Math.round(clamp01(x) * 2000) / 2000);
  });
  return v;
}

/** A step's own progress (0..1) → storyboard seconds, with a beat of rest at both ends. */
const toT = (p: number, still: number) => clamp01((p - 0.06) / 0.8) * still;

/* ═════════════════════════ the steps ═════════════════════════ */

type Tag = { logo?: BrandKey; label: string };

type Step = {
  key: "share" | "dm" | "write";
  /** short name for the step switcher */
  short: string;
  title: string;
  body: string;
  tags: Tag[];
  /** the finished frame: where scroll lands at the end of the step, and reduced motion */
  still: number;
  chip: { at: number; label: string; value: string };
};

const STEPS: Step[] = [
  {
    key: "share",
    short: "Share a video",
    title: "Share a video, get the trades",
    body: "Send Bread any YouTube link or podcast. It listens to the whole thing, pins every tradable call with its timestamp, and builds the sandwich behind it.",
    tags: [
      { logo: "youtube", label: "YouTube" },
      { logo: "podcasts", label: "Podcasts" },
    ],
    still: 9,
    chip: { at: 7.4, label: "2 hr podcast", value: "3 trades" },
  },
  {
    key: "dm",
    short: "DM2Buy",
    title: "DM2Buy: send a post, reply “buy $5”",
    body: "Connect X once. DM any post to @sandwichplis and Bread cooks it into a sandwich right in the chat. Reply with an amount and it’s bought.",
    tags: [{ logo: "x", label: "@sandwichplis" }],
    still: 9.6,
    chip: { at: 8.1, label: "no app switch", value: "$10 in" },
  },
  {
    key: "write",
    short: "Write a take",
    title: "Write a take, get the trade",
    body: "Type what’s on your mind, even “tennis is about to go huge again”. The Sandwich Agent picks what actually expresses it: one stock, a handful, or a market.",
    tags: [{ label: "Sandwich Agent" }],
    still: 10.5,
    chip: { at: 7.6, label: "one sentence", value: "5 assets" },
  },
];

/* ═════════════════════════ phone ═════════════════════════ */

/** The phone is a fixed 390 x 844 app canvas, scaled to whatever room the layout gives it. */
function Phone({ children }: { children: ReactNode }) {
  const viewport = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const fit = () => el.style.setProperty("--s", String(el.clientWidth / 390));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div className={s.phone}>
      <div ref={viewport} className={s.viewport}>
        <div className={s.screen}>
          {children}
          <i className={s.island} />
        </div>
      </div>
    </div>
  );
}

function Status({ dark = false }: { dark?: boolean }) {
  return (
    <div className={`${s.status} ${dark ? s.statusDark : ""}`} aria-hidden="true">
      <b>9:41</b>
      <span>
        <svg width="19" height="12" viewBox="0 0 19 12" fill="currentColor">
          <rect x="0" y="8" width="3.4" height="4" rx="1" />
          <rect x="5" y="5.5" width="3.4" height="6.5" rx="1" />
          <rect x="10" y="3" width="3.4" height="9" rx="1" />
          <rect x="15" y="0" width="3.4" height="12" rx="1" />
        </svg>
        <svg width="17" height="12" viewBox="0 0 24 18" fill="currentColor">
          <path d="M12 17.5l3.2-3.6a4.6 4.6 0 0 0-6.4 0zM12 9.2c2.3 0 4.4.9 6 2.4l1.9-2.1A11.6 11.6 0 0 0 12 6.3a11.6 11.6 0 0 0-7.9 3.2L6 11.6c1.6-1.5 3.7-2.4 6-2.4zM12 3c3.9 0 7.4 1.5 10 3.9L24 4.8A15.5 15.5 0 0 0 12 0 15.5 15.5 0 0 0 0 4.8L2 6.9C4.6 4.5 8.1 3 12 3z" />
        </svg>
        <svg width="27" height="13" viewBox="0 0 27 13" fill="none">
          <rect x="0.5" y="0.5" width="23" height="12" rx="3.6" stroke="currentColor" opacity="0.4" />
          <rect x="2" y="2" width="20" height="9" rx="2.4" fill="currentColor" />
          <path d="M25 4.5v4c.8-.3 1.5-1.1 1.5-2s-.7-1.7-1.5-2z" fill="currentColor" opacity="0.45" />
        </svg>
      </span>
    </div>
  );
}

const Home = ({ light = false }: { light?: boolean }) => <i className={`${s.home} ${light ? s.homeLight : ""}`} />;

type SceneProps = { t: number; reduce: boolean };

/** A second screen pushed over the first, the way iOS navigates. */
const slideStyle = (p: number): CSSProperties => ({
  transform: `translateX(${(1 - p) * 104}%)`,
  boxShadow: p > 0 && p < 1 ? "-24px 0 50px rgba(11, 11, 12, 0.18)" : "none",
  visibility: p === 0 ? "hidden" : undefined,
});

const buyStyle = (p: number): CSSProperties => ({
  opacity: p,
  transform: `translateY(${(1 - p) * 40}px) scale(${0.96 + 0.04 * p})`,
});

const bannerStyle = (p: number): CSSProperties => ({
  opacity: clamp01(p * 2),
  transform: `translateY(${(1 - p) * -150}px) scale(${0.96 + 0.04 * p})`,
});

/* ═════════════════════════ 1 · share a video ═════════════════════════ */

const CAPS = [
  { at: 0.2, text: "everyone’s still arguing about chips." },
  { at: 1.3, text: "the money moves to the software that runs on them." },
];

/** What a podcast really yields: a few calls, each its own trade, and not all of them bullish. */
const CALLS: { at: string; title: string; ids: BrandKey[]; pnl: string; best?: boolean; short?: string }[] = [
  { at: "12:40", title: "Chips are still the AI trade", ids: ["NVDA", "AVGO"], pnl: "78.4%" },
  { at: "34:10", title: "AI’s next leg is software", ids: ["PLTR", "NET", "SNOW"], pnl: "139.2%", best: true },
  { at: "1:02:11", title: "Robotaxi is priced in", ids: ["TSLA"], pnl: "9.0%", short: "Short · 2×" },
];

const PIN_AT = [0.18, 0.34, 0.66];

function ShareScene({ t }: SceneProps) {
  const sheet = ramp(t, 2.5, 0.6);
  const sheetUp = sheet >= 1;
  const pressed = t >= 3.5 && t < 3.85;
  const bread = ramp(t, 4.2, 0.65);
  const cap = [...CAPS].reverse().find((c) => t >= c.at);
  const listen = clamp01((t - 4.7) / 2.2);

  return (
    <>
      {/* YouTube, dark */}
      <div className={s.yt}>
        <Status dark />
        <div className={s.ytVideo}>
          <Image src="/landing/yt-karp-jensen.jpg" alt="" fill sizes="390px" />
          {cap && (
            <p key={cap.at} className={s.ytCap}>
              <span>{cap.text}</span>
            </p>
          )}
          <div className={s.ytBar}>
            <i style={{ width: `${(0.3 + Math.min(t, 4.2) * 0.012) * 100}%` }} />
          </div>
        </div>
        <div className={s.ytMeta}>
          <h4>Karpathy × Jensen: where the AI trade goes next</h4>
          <span className={s.ytSub}>1.2M views · 3 days ago</span>
          <div className={s.ytChannel}>
            <span className={s.ytAv}>C</span>
            <b>
              The Compute Report
              <small>412K subscribers</small>
            </b>
            <em>Subscribe</em>
          </div>
          <div className={s.ytActions}>
            <span className={s.ytPill}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
                <path d="M7 11v9H4v-9zM7 11l4-8c1.5 0 2.5 1 2.2 2.6L12.7 9H19a2 2 0 0 1 2 2.4l-1.3 6.6A2 2 0 0 1 17.8 20H7" />
              </svg>
              12K
            </span>
            <span className={`${s.ytPill} ${pressed || sheetUp ? s.ytPillOn : ""}`}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 5l7 7-7 7M21 12H9a6 6 0 0 0-6 6" />
              </svg>
              Share
            </span>
            <span className={s.ytPill}>Save</span>
          </div>
          <div className={s.ytNext}>
            <i />
            <i />
          </div>
        </div>

        {/* iOS share sheet */}
        <div className={`${s.share} ${sheetUp ? s.shareUp : ""}`} style={{ transform: `translateY(${(1 - sheet) * 105}%)` }}>
          <div className={s.shareTop}>
            <span className={s.shareThumb}>
              <Image src="/landing/yt-karp-jensen.jpg" alt="" fill sizes="48px" />
            </span>
            <span>
              <b>Karpathy × Jensen: where the AI trade goes next</b>
              <small>youtube.com</small>
            </span>
          </div>
          <div className={s.shareApps}>
            <span className={s.shareApp}>
              <i className={s.appMessages}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="#fff">
                  <path d="M12 4c4.7 0 8.5 3.1 8.5 7s-3.8 7-8.5 7c-.9 0-1.8-.1-2.6-.3L5 19.5l1.2-3.4C4.5 14.8 3.5 13 3.5 11c0-3.9 3.8-7 8.5-7z" />
                </svg>
              </i>
              Messages
            </span>
            <span className={s.shareApp}>
              <i className={s.appX}>
                <Logo id="x" size={34} />
              </i>
              X
            </span>
            <span className={`${s.shareApp} ${s.shareAppPick} ${pressed ? s.shareAppDown : ""}`}>
              <i className={s.appBread}>
                <Image src="/logo.png" alt="" width={60} height={60} />
              </i>
              <b>Bread</b>
            </span>
            <span className={s.shareApp}>
              <i className={s.appCopy}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#e5e5ea" strokeWidth="1.9" strokeLinejoin="round">
                  <rect x="8" y="8" width="12" height="12" rx="2.5" />
                  <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
                </svg>
              </i>
              Copy
            </span>
          </div>
        </div>
      </div>

      {/* Bread: what it heard */}
      <div className={s.slide} style={slideStyle(bread)}>
        <Status />
        <div className={s.bHead}>
          <Image src="/logo.png" alt="" width={34} height={34} />
          <b>From YouTube</b>
          <span className={s.bCount}>{t >= 7.1 ? "3 calls" : "listening…"}</span>
        </div>
        <div className={s.bSource}>
          <span className={s.bThumb}>
            <Image src="/landing/yt-karp-jensen.jpg" alt="" fill sizes="104px" />
          </span>
          <span>
            <b>Karpathy × Jensen: where the AI trade goes next</b>
            <small>
              <Logo id="youtube" size={14} /> The Compute Report · 2:04:11
            </small>
          </span>
        </div>

        <div className={s.scrub}>
          <div className={s.scrubTrack}>
            <i style={{ width: `${listen * 100}%` }} />
            {PIN_AT.map((x, i) => (
              <b
                key={x}
                className={`${s.scrubPin} ${i === 1 ? s.scrubPinBest : ""}`}
                style={{ left: `${x * 100}%`, transform: `scale(${ramp(listen, x, 0.05) * (i === 1 ? 1.3 : 1)})` }}
              />
            ))}
          </div>
          <span className={s.scrubTimes}>
            <em>0:00</em>
            <em>2:04:11</em>
          </span>
        </div>

        <div className={s.calls}>
          {CALLS.map((c, i) => {
            const at = 4.7 + 2.2 * (PIN_AT[i] + 0.04);
            return t >= at ? (
              <div key={c.at} className={`${s.call} ${c.best ? s.callBest : ""}`} style={rise(ramp(t, at, 0.5), 18)}>
                <span className={s.callAt}>{c.at}</span>
                <span className={s.callMain}>
                  <b>{c.title}</b>
                  <span className={s.callLegs}>
                    <LogoStack ids={c.ids} size={22} />
                    {c.short && <i className={s.shortTag}>{c.short}</i>}
                  </span>
                </span>
                <span className={s.pnl}>
                  <i />
                  {c.pnl}
                </span>
                {c.best && <u>strongest</u>}
              </div>
            ) : null;
          })}
        </div>

        <div className={s.buyBar} style={buyStyle(ramp(t, 7.8, 0.5))}>
          BUY THE 34:10 CALL
        </div>
        <Home />
      </div>
    </>
  );
}

/* ═════════════════════════ 2 · DM2Buy ═════════════════════════ */

function DmScene({ t }: SceneProps) {
  const sentText = typed("buy $10", t, 5.4, 6.3);
  const sent = t >= 6.5;
  const composing = t >= 5.4 && !sent;
  return (
    <div className={s.dm}>
      <Status dark />
      <div className={s.dmHead}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e7e9ea" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 5l-7 7 7 7" />
        </svg>
        <Image src="/landing/sandwichplis.webp" alt="" width={40} height={40} />
        <span>
          <b>sandwich maker</b>
          <small>@sandwichplis</small>
        </span>
        <svg className={s.dmInfo} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e7e9ea" strokeWidth="1.8">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5M12 7.6v.1" strokeLinecap="round" />
        </svg>
      </div>

      <div className={s.dmChat}>
        {t >= 0.4 && (
          <div className={`${s.msg} ${s.msgOut}`} style={rise(ramp(t, 0.4, 0.4))}>
            <div className={s.dmPost}>
              <span>
                <Image src="/landing/x-serenity.jpg" alt="" width={22} height={22} />
                <b>Serenity</b>
                <em>@aleabitoreddit · 1d</em>
              </span>
              <p>🚨 MEMORY IS STILL THE AI BOTTLENECK. $MU $SNDK</p>
              <small>1.5K likes · 549K views</small>
            </div>
          </div>
        )}
        {t >= 0.9 && (
          <span className={`${s.dmSent} ${s.msg}`} style={rise(ramp(t, 0.9, 0.3), 6)}>
            Sent
          </span>
        )}
        {t >= 1.6 && (
          <div className={`${s.msg} ${s.msgIn}`} style={rise(ramp(t, 1.6, 0.35))}>
            On it…
          </div>
        )}
        {t >= 3.1 && (
          <div className={`${s.msg} ${s.msgIn} ${s.msgBig}`} style={rise(ramp(t, 3.1, 0.45))}>
            <p>AI memory demand is outrunning supply.</p>
            <p>
              Bullish $MU $SNDK
              <br />
              <u>breadapp.fun/s/memory</u>
            </p>
            <p>Reply “buy $5” (any amount) to buy $MU $SNDK 🥪</p>
          </div>
        )}
        {sent && (
          <div className={`${s.msg} ${s.msgOut} ${s.msgBlue}`} style={rise(ramp(t, 6.5, 0.35))}>
            buy $10
          </div>
        )}
        {sent && t >= 6.9 && t < 7.7 && (
          <div className={`${s.msg} ${s.msgIn} ${s.dots}`} style={rise(ramp(t, 6.9, 0.25))}>
            <i />
            <i />
            <i />
          </div>
        )}
        {t >= 7.7 && (
          <div className={`${s.msg} ${s.msgIn} ${s.msgBig}`} style={rise(ramp(t, 7.7, 0.45))}>
            <p>Done. You bought $10 of Memory is still the bottleneck.</p>
            <p>
              <u>breadapp.fun/s/memory</u>
            </p>
          </div>
        )}
      </div>

      <div className={s.dmComposer}>
        <span className={s.dmPlus}>+</span>
        <span className={s.dmInput}>
          {composing ? (
            <>
              {sentText}
              <i className={s.caretBlue} />
            </>
          ) : (
            <em>Message</em>
          )}
        </span>
      </div>

      {/* Bread pings you when it lands */}
      <div className={s.banner} style={bannerStyle(ramp(t, 8.3, 0.55))}>
        <Image src="/logo.png" alt="" width={44} height={44} />
        <span>
          <b>
            Bread <em>now</em>
          </b>
          Bought $10 of $MU + $SNDK from your DM.
        </span>
      </div>
      <Home light />
    </div>
  );
}

/* ═════════════════════════ 3 · write a take ═════════════════════════ */

const TAKE = "i think tennis is about to go huge again 🎾";
const KB = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];

const LEGS = [
  { img: "nke.png", id: "NKE", w: "25%", price: "$74.21", chg: "0.42", bg: "#111", pad: 7 },
  { img: "lulu.png", id: "LULU", w: "20%", price: "$218.40", chg: "0.31", bg: "#fff", pad: 6 },
  { img: "nflx.png", id: "NFLX", w: "20%", price: "$1,186.50", chg: "0.18", bg: "#000", pad: 8 },
  { img: "dkng.png", id: "DKNG", w: "20%", price: "$41.37", chg: "0.66", bg: "#fff", pad: 5 },
  { img: "polymarket.png", id: "POLY", w: "15%", price: "$0.62", chg: "1.24", bg: "#2e5cff", pad: 0 },
];

const CHART =
  "M0 92 C14 88 22 70 34 64 S52 40 62 52 S82 70 96 60 S120 66 132 50 S150 30 166 40 S190 58 204 44 S226 18 242 26 S262 46 276 34 S300 20 312 24 S330 14 338 12";

function WriteScene({ t }: SceneProps) {
  const text = typed(TAKE, t, 0.6, 4.5);
  const typing = t >= 0.6 && t < 4.6;
  const count = Array.from(text).length;
  const hot = typing && count > 0 ? Array.from(TAKE)[count - 1].toLowerCase() : "";
  const press = t >= 4.95 && t < 5.3;
  const next = t >= 5.25;
  const basket = ramp(t, 5.25, 0.6);

  return (
    <>
      <div className={s.write}>
        <Status />
        <div className={s.wHead}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 5l-7 7 7 7" />
          </svg>
          <b>New Sandwich</b>
        </div>
        <div className={s.wBox}>
          <Image src="/deck/img/me.png" alt="" width={52} height={52} />
          <p>
            {text || <em>What’s on your mind?</em>}
            {!next && <i className={s.caretBlue} />}
          </p>
        </div>

        <div className={s.wTools}>
          <span className={s.wGlyph}>@</span>
          <span className={s.wGlyph}>$</span>
          <span className={s.wAgent}>
            <small>Sandwich Agent</small>
            <i>
              <b />
            </i>
          </span>
          <span className={`${s.wContinue} ${count > 0 ? s.wContinueOn : ""} ${press ? s.wContinueDown : ""}`}>Continue</span>
        </div>

        <div className={s.kb}>
          <div className={s.kbSuggest}>
            <span>i</span>
            <span>the</span>
            <span>i’m</span>
          </div>
          {KB.map((row, i) => (
            <div key={row} className={`${s.kbRow} ${i === 1 ? s.kbRowMid : ""}`}>
              {i === 2 && <span className={`${s.key} ${s.keyDark} ${s.keyWide}`}>⇧</span>}
              {row.split("").map((k) => (
                <span key={k} className={`${s.key} ${k === hot ? s.keyHot : ""}`}>
                  {k}
                </span>
              ))}
              {i === 2 && <span className={`${s.key} ${s.keyDark} ${s.keyWide}`}>⌫</span>}
            </div>
          ))}
          <div className={s.kbRow}>
            <span className={`${s.key} ${s.keyDark} ${s.keyBase}`}>123</span>
            <span className={`${s.key} ${s.keyDark} ${s.keyBase}`}>☺</span>
            <span className={`${s.key} ${s.keySpace} ${hot === " " ? s.keyHot : ""}`} />
            <span className={`${s.key} ${s.keyDark} ${s.keyReturn}`}>↵</span>
          </div>
        </div>
      </div>

      {/* the basket */}
      <div className={s.slide} style={slideStyle(basket)}>
        <Status />
        <div className={s.dHead}>
          <span className={s.dBack}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </span>
          <Image src="/deck/img/me.png" alt="" width={36} height={36} />
          <b>
            <em>@</em>you
          </b>
          <Verified />
        </div>
        <p className={s.dTake}>i think tennis is about to go huge again 🎾</p>
        <span className={s.dTime}>12:44 AM · 10/02/26</span>

        <div className={s.dActions}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.8" strokeLinejoin="round">
            <path d="M12 20.6S3 15.3 3 8.9A4.9 4.9 0 0 1 12 6.2a4.9 4.9 0 0 1 9 2.7c0 6.4-9 11.7-9 11.7z" />
          </svg>
          <svg width="22" height="24" viewBox="0 0 20 24" fill="none" stroke="#64748b" strokeWidth="1.8" strokeLinejoin="round">
            <path d="M3 2.5h14v19l-7-5-7 5z" />
          </svg>
          <svg width="23" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3.2v12M7.4 7.6L12 3.2l4.6 4.4M5 12.5v6.3c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2v-6.3" />
          </svg>
        </div>

        <svg className={s.dChart} viewBox="0 0 338 110" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <line key={i} x1="0" x2="338" y1={10 + i * 24} y2={10 + i * 24} stroke="#cbd5e1" strokeWidth="1.2" strokeDasharray="1 9" strokeLinecap="round" />
          ))}
          <path
            d={CHART}
            pathLength={1}
            fill="none"
            stroke="#35f046"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="1"
            style={{ strokeDashoffset: 1 - ramp(t, 5.6, 1.3) }}
          />
        </svg>
        <div className={s.dRange}>
          <span>24H</span>
          <span>1W</span>
          <span>1M</span>
          <span className={s.dRangeOn}>ALL</span>
        </div>

        <div className={s.dSplit}>
          <b>
            Split <em>(5)</em>
          </b>
          <span className={s.pnl}>
            <i />
            0.62%
          </span>
        </div>
        <span className={s.dPicked} style={rise(ramp(t, 6.0, 0.4), 4)}>
          ✦ picked by Sandwich Agent
        </span>

        <div className={s.legs}>
          {LEGS.map((l, i) => {
            const at = 6.2 + i * 0.22;
            const p = ramp(t, at, 0.45);
            return t >= at ? (
              <div key={l.id} className={s.leg} style={{ opacity: p, transform: `translateX(${(1 - p) * 18}px)` }}>
                <span className={s.legLogo} style={{ background: l.bg, padding: l.pad }}>
                  <Image src={`/deck/img/${l.img}`} alt="" width={40} height={40} />
                </span>
                <span className={s.legName}>
                  <b>{l.id}</b>
                  <small>{l.w}</small>
                </span>
                <span className={s.legPrice}>
                  <b>{l.price}</b>
                  <small>+{l.chg}%</small>
                </span>
              </div>
            ) : null;
          })}
        </div>

        <div className={`${s.buyBar} ${s.buyPlain}`} style={buyStyle(ramp(t, 7.7, 0.5))}>
          BUY
        </div>
        <Home />
      </div>
    </>
  );
}

function Verified({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" aria-label="verified">
      <path
        fill="#1D9BF0"
        d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"
      />
    </svg>
  );
}

/* ═════════════════════════ stage ═════════════════════════ */

function Scene({ i, t, reduce, opacity = 1 }: { i: number; opacity?: number } & SceneProps) {
  const props = { t, reduce };
  return (
    <div className={s.sceneWrap} style={{ opacity }}>
      {i === 0 && <ShareScene {...props} />}
      {i === 1 && <DmScene {...props} />}
      {i === 2 && <WriteScene {...props} />}
    </div>
  );
}

function Tags({ tags }: { tags: Tag[] }) {
  return (
    <span className={s.tags}>
      {tags.map((g) => (
        <span key={g.label} className={s.tag}>
          {g.logo && <Logo id={g.logo} size={20} />}
          {g.label}
        </span>
      ))}
    </span>
  );
}

const N = STEPS.length;
/** how far either side of a step boundary the phone takes to turn to the next scene */
const TURN = 0.1;
/** share of the pinned scroll spent on the opening move (heading settles, phone rises) */
const INTRO = 0.16;

const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

/**
 * Where the reader is, as one number: 0 at the first step's start, N at the last
 * step's end. Everything on the stage is derived from it in render.
 */
function stageAt(pos: number) {
  const idx = Math.min(N - 1, Math.floor(pos));
  const p = clamp01(pos - idx);
  // nearest boundary between two steps, and how deep into the turn we are (0..1)
  const b = Math.round(pos);
  const d = pos - b;
  const turn = b > 0 && b < N && Math.abs(d) < TURN ? 1 - Math.abs(d) / TURN : 0;
  return { idx, p, turn, side: d < 0 ? -1 : 1 };
}

/** Each way in gets a soft tile in the same family as the Introducing Bread icons. */
function StepIcon({ k }: { k: Step["key"] }) {
  if (k === "write")
    return (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M13.6 3.2a2 2 0 0 1 2.8 0l.4.4a2 2 0 0 1 0 2.8l-8.4 8.4-3.9 1 1-3.9z" fill="currentColor" />
        <path d="M11.8 5 15 8.2" stroke="#fff6cc" strokeWidth="1.4" />
      </svg>
    );
  const id = k === "share" ? "youtube" : "x";
  return (
    <svg width={k === "dm" ? 15 : 19} height={k === "dm" ? 15 : 19} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d={BRANDS[id].path} />
    </svg>
  );
}

/* ═════════════════════════ satellites ═════════════════════════ */

/*
 * What each scene produces, floating around the phone in the hero's ticker-chip
 * style. Each one lands at the storyboard moment its asset appears on screen, so
 * the props tell the same story as the phone instead of decorating it.
 */

const SPARKS = {
  a: [3, 4, 3.6, 5, 4.6, 6.2, 7, 6.6, 8.4, 9],
  b: [5, 4.4, 5.2, 4.8, 6, 5.6, 7.2, 8, 7.6, 9],
  c: [2, 3.4, 3, 4.6, 4.2, 5, 6.4, 6, 7.8, 8.6],
};

/** A short's sparkline falls while its PnL is green: the chip says which way the trade points. */
function Tick({ logo, sym, chg, spark = SPARKS.a, short }: { logo: ReactNode; sym: string; chg: string; spark?: number[]; short?: string }) {
  const max = Math.max(...spark);
  const min = Math.min(...spark);
  const pts = spark.map((v, i) => `${(i / (spark.length - 1)) * 40},${16 - ((v - min) / (max - min)) * 14 + 1}`).join(" ");
  return (
    <span className={s.tick}>
      {logo}
      <b>{sym}</b>
      {short && <i className={s.shortTag}>{short}</i>}
      <svg viewBox="0 0 40 18" width="40" height="18" aria-hidden="true" style={short ? { transform: "scaleY(-1)" } : undefined}>
        <polyline
          points={pts}
          fill="none"
          stroke={short ? "#fe14ae" : "#35f046"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <em>+{chg}%</em>
    </span>
  );
}

const img = (src: string, bg = "#fff", pad = 4) => (
  <span className={s.tickImg} style={{ background: bg, padding: pad }}>
    <Image src={src} alt="" width={30} height={30} />
  </span>
);

type Sat = {
  at: number;
  /** which side of the phone, and how far past its edge (px, negative = overlapping it) */
  side: "left" | "right";
  x: number;
  y: string;
  rot: number;
  /** parallax: how far it drifts against the scroll, relative to the phone */
  depth: number;
  el: ReactNode;
};

const SATS: Record<Step["key"], Sat[]> = {
  share: [
    { at: 5.2, side: "left", x: -152, y: "20%", rot: -6, depth: 1.2, el: <Tick logo={<GlossyLogo id="NVDA" size={30} />} sym="NVDA" chg="78.4" /> },
    { at: 6.8, side: "left", x: -152, y: "70%", rot: 4, depth: 0.8, el: <Tick logo={<GlossyLogo id="TSLA" size={30} />} sym="TSLA" chg="9.0" spark={SPARKS.b} short="Short 2×" /> },
    {
      at: 7.3,
      side: "right",
      x: -196,
      y: "58%",
      rot: -4,
      depth: 1,
      el: (
        <span className={s.callCard}>
          <small>
            <Logo id="youtube" size={16} /> Best call · <b>34:10</b>
          </small>
          <strong>AI’s next leg is software</strong>
          <span>
            <LogoStack ids={["PLTR", "NET", "SNOW"]} size={22} />
            <em>+139.2%</em>
          </span>
        </span>
      ),
    },
  ],
  dm: [
    {
      at: 0.3,
      side: "right",
      x: -204,
      y: "56%",
      rot: 4,
      depth: 1,
      el: (
        <span className={s.postCard}>
          <span>
            <Image src="/landing/x-serenity.jpg" alt="" width={28} height={28} />
            <b>Serenity</b>
            <em>@aleabitoreddit</em>
          </span>
          <p>🚨 MEMORY IS STILL THE AI BOTTLENECK. $MU $SNDK</p>
          <small>
            <Logo id="x" size={14} /> sent to @sandwichplis
          </small>
        </span>
      ),
    },
    { at: 3.2, side: "left", x: -152, y: "24%", rot: -6, depth: 1.2, el: <Tick logo={img("/deck/img/mu.png")} sym="MU" chg="6.12" /> },
    { at: 3.5, side: "left", x: -152, y: "70%", rot: 4, depth: 0.8, el: <Tick logo={img("/deck/img/sndk.png")} sym="SNDK" chg="4.38" spark={SPARKS.b} /> },
  ],
  write: [
    { at: 6.2, side: "left", x: -152, y: "20%", rot: -6, depth: 1.3, el: <Tick logo={img("/deck/img/nke.png", "#111", 6)} sym="NKE" chg="0.42" /> },
    { at: 6.85, side: "left", x: -152, y: "70%", rot: 4, depth: 0.8, el: <Tick logo={img("/deck/img/dkng.png", "#fff", 4)} sym="DKNG" chg="0.66" spark={SPARKS.c} /> },
    {
      at: 7.05,
      side: "right",
      x: -204,
      y: "60%",
      rot: -5,
      depth: 1.2,
      el: (
        <span className={s.pollCard}>
          {img("/deck/img/polymarket.png", "#2e5cff", 0)}
          <span>
            <small>Tennis viewership record in 2027?</small>
            <span>
              <b className={s.yes}>Yes 62¢</b>
              <b className={s.no}>No 38¢</b>
            </span>
          </span>
        </span>
      ),
    },
  ],
};

function Satellites({ k, t, p, fade }: { k: Step["key"]; t: number; p: number; fade: number }) {
  return (
    <div className={s.sats} aria-hidden="true">
      {SATS[k].map((sat, i) => {
        const e = ramp(t, sat.at, 0.55);
        if (e === 0) return null;
        const drift = (0.5 - p) * sat.depth * 80;
        return (
          <div
            key={`${k}-${i}`}
            className={s.sat}
            style={{
              [sat.side]: sat.x,
              top: sat.y,
              opacity: e * fade,
              transform: `translate(${(1 - e) * (sat.side === "left" ? 40 : -40)}px, ${drift + (1 - e) * 24}px) rotate(${sat.rot * e}deg) scale(${0.8 + 0.2 * e})`,
            }}
          >
            {sat.el}
          </div>
        );
      })}
    </div>
  );
}

/**
 * The opening move needs the two places each piece lives: where it rests in the
 * layout (measured from an untransformed wrapper) and where it starts (centre
 * stage). The transform between them is then just arithmetic on scroll progress.
 */
function useIntroGeometry(stage: RefObject<HTMLDivElement | null>, head: RefObject<HTMLDivElement | null>, phone: RefObject<HTMLDivElement | null>) {
  const [g, setG] = useState({ hx: 0, hy: 0, px: 0, py: 0 });
  useEffect(() => {
    const st = stage.current;
    if (!st) return;
    const measure = () => {
      const h = head.current?.getBoundingClientRect();
      const ph = phone.current?.getBoundingClientRect();
      const r = st.getBoundingClientRect();
      if (!h || !ph) return;
      const cx = r.left + r.width / 2;
      setG({
        hx: cx - (h.left + h.width / 2),
        hy: r.top + r.height * 0.24 - (h.top + h.height / 2),
        px: cx - (ph.left + ph.width / 2),
        py: r.top + r.height * 0.5 - ph.top,
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(st);
    return () => ro.disconnect();
  }, [stage, head, phone]);
  return g;
}

function Pinned({ reduce, still }: { reduce: boolean; still: number | null }) {
  const track = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  const geo = useIntroGeometry(stageRef, headRef, phoneRef);

  const frozen = reduce || still !== null;
  const v = useScrubbed(track, still === null);
  const intro = frozen ? 1 : clamp01(v / INTRO);
  const pos = clamp01((v - INTRO) / (1 - INTRO)) * N;
  const { idx, p, turn, side } = stageAt(pos);
  const step = STEPS[idx];
  const t = still ?? (reduce ? step.still : toT(p, step.still));

  // Opening move, staggered so nothing crosses: the heading clears to its corner
  // first, the phone slides across behind it, then rises into place.
  const seg = (a: number, b: number) => easeInOut(clamp01((intro - a) / (b - a)));
  const ho = 1 - seg(0, 0.6);
  const pxo = 1 - seg(0.12, 0.7);
  const pyo = 1 - seg(0.25, 1);
  const headStyle: CSSProperties = { transform: `translate(${geo.hx * ho}px, ${geo.hy * ho}px) scale(${1 + 0.55 * ho})` };
  const phoneIntro: CSSProperties = {
    transform: `translate(${geo.px * pxo}px, ${geo.py * pyo}px) rotateX(${pyo * 16}deg) scale(${1 - 0.04 * pyo})`,
  };
  const listIn = seg(0.55, 1);

  // between steps the phone turns a few degrees away and back, and the scene swaps behind it
  const k = reduce ? 0 : easeOut(turn);
  const phoneTurn = `rotateY(${side * -k * 14}deg) scale(${1 - k * 0.06})`;
  const sceneOpacity = reduce ? 1 : 1 - k;

  const chip = ramp(t, step.chip.at, 0.5) * listIn;

  const jump = useCallback(
    (i: number) => {
      const el = track.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY;
      const dist = el.offsetHeight - window.innerHeight;
      // land where that step's storyboard has just finished
      const at = INTRO + ((1 - INTRO) * (i + 0.86)) / N;
      window.scrollTo({ top: top + dist * at, behavior: reduce ? "auto" : "smooth" });
    },
    [reduce],
  );

  return (
    <div className={s.pinned}>
      <div ref={track} className={s.track}>
        <div ref={stageRef} className={s.stage}>
          {/* the wash behind everything blends from one step's colour to the next */}
          <div className={s.washes} aria-hidden="true">
            {STEPS.map((st, i) => (
              <i key={st.key} className={`${s.wash} ${s[`wash_${st.key}`]}`} style={{ opacity: clamp01(1.25 - Math.abs(pos - (i + 0.5))) }} />
            ))}
          </div>

          <div className={s.copy}>
            <div ref={headRef} className={s.headAt}>
              <h2 className={s.stageHead} style={headStyle}>
                <span>How Bread works</span>
                <span className={s.stageSub}>Three ways in.</span>
              </h2>
            </div>

            <ol className={s.steps} style={{ opacity: listIn, transform: `translateY(${(1 - listIn) * 24}px)` }}>
              {STEPS.map((st, i) => {
                const on = i === idx;
                return (
                  <li key={st.key} className={`${s.step} ${on ? s.stepOn : ""} ${i < idx ? s.stepDone : ""}`}>
                    <span className={s.rail} aria-hidden="true">
                      <span className={`${s.stepIcon} ${s[`stepIcon_${st.key}`]}`}>
                        <StepIcon k={st.key} />
                      </span>
                      {i < N - 1 && (
                        <i className={s.line}>
                          <u style={{ transform: `scaleY(${clamp01(pos - i)})` }} />
                        </i>
                      )}
                    </span>
                    <div className={s.stepMain}>
                      <button type="button" className={s.stepBtn} onClick={() => jump(i)} aria-current={on ? "step" : undefined}>
                        {st.title}
                      </button>
                      <div className={s.stepBody}>
                        <div>
                          <p>{st.body}</p>
                          <Tags tags={st.tags} />
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          <div ref={phoneRef} className={s.stagePhone}>
            <div className={s.phoneIntro} style={phoneIntro}>
              <div className={s.phoneTurn} style={{ transform: phoneTurn }}>
                <Phone>
                  <Scene i={idx} t={t} reduce={reduce} opacity={sceneOpacity} />
                </Phone>
              </div>
            </div>
            <Satellites k={step.key} t={t} p={p} fade={sceneOpacity * listIn} />
            <div
              className={s.chip}
              aria-hidden="true"
              style={{
                opacity: chip,
                transform: `translateY(${(1 - chip) * 16 + (0.5 - p) * 40}px) rotate(${chip * 5}deg) scale(${0.8 + chip * 0.2})`,
              }}
            >
              <span>{step.chip.label}</span>
              <b>{step.chip.value}</b>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Phones and narrow screens: each step pins its own phone and scrubs it the same way. */
function StackedStep({ step, i, reduce, still }: { step: Step; i: number; reduce: boolean; still: number | null }) {
  const ref = useRef<HTMLElement>(null);
  const p = useScrubbed(ref, still === null && !reduce);
  const t = still ?? (reduce ? step.still : toT(p, step.still));
  return (
    <article ref={ref} className={`${s.sStep} ${reduce ? s.sStepStill : ""}`}>
      <div className={s.sSticky}>
        <div className={s.sCopy}>
          <div className={s.sMeta}>
            <span className={`${s.stepIcon} ${s[`stepIcon_${step.key}`]}`} aria-hidden="true">
              <StepIcon k={step.key} />
            </span>
            <span className={s.sOf}>
              Step {i + 1} of {N}
            </span>
            <i className={s.sBar} aria-hidden="true">
              <u style={{ transform: `scaleX(${reduce ? 1 : p})` }} />
            </i>
          </div>
          <h3>{step.title}</h3>
          <p>{step.body}</p>
        </div>
        <div className={s.sPhone}>
          <Phone>
            <Scene i={i} t={t} reduce={reduce} />
          </Phone>
        </div>
      </div>
    </article>
  );
}

export function HowBread() {
  const reduce = !!useReducedMotion();
  // ?howt=<seconds> freezes every scene on that frame (for design review)
  const [still, setStill] = useState<number | null>(null);
  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get("howt");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (v !== null) setStill(Number(v));
  }, []);

  return (
    <section className={s.how} id="how">
      {/* desktop puts the heading inside the pinned stage; this one is for the stacked layout */}
      <div className={s.head}>
        <h2>
          <span>How Bread works</span>
          <span className={s.stageSub}>Three ways in.</span>
        </h2>
      </div>
      <Pinned reduce={reduce} still={still} />
      <div className={s.stacked}>
        {STEPS.map((st, i) => (
          <StackedStep key={st.key} step={st} i={i} reduce={reduce} still={still} />
        ))}
      </div>
    </section>
  );
}
