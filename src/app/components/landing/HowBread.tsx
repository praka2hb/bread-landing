"use client";

import Image from "next/image";
import { useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { BrandKey } from "./brands";
import { Logo, LogoStack } from "./Logo";
import s from "./how.module.css";

/*
 * How Bread works: one phone, four ways an idea becomes a position.
 *
 * Desktop pins the phone while the page scrolls through the steps. Every scene is a
 * pure function of a clock `t` (seconds), so it replays like a video: threshold
 * checks mount things, CSS does the easing. Scenes are drawn on the app's own
 * 390 x 844 canvas and scaled to fit the phone, so type and spacing match the app.
 */

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/** `text` revealed between `from` and `to` seconds, emoji-safe. */
function typed(text: string, t: number, from: number, to: number) {
  const chars = Array.from(text);
  return chars.slice(0, Math.round(clamp01((t - from) / (to - from)) * chars.length)).join("");
}

/** True while the element is on screen, so clocks only run where someone can see them. */
function useVisible<T extends Element>(rootMargin = "0px") {
  const ref = useRef<T>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const io = new IntersectionObserver(([e]) => setOn(e.isIntersecting), { rootMargin });
    io.observe(node);
    return () => io.disconnect();
  }, [rootMargin]);
  return [ref, on] as const;
}

/**
 * A looping clock in 50ms steps. `resetKey` restarts it (a new step), and state only
 * changes when the step does, so a scene re-renders ~20 times a second, not per frame.
 */
function useClock(running: boolean, duration: number, resetKey: number) {
  const [clock, setClock] = useState({ k: resetKey, t: 0 });
  useEffect(() => {
    if (!running) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const q = Math.floor((((now - start) / 1000) % duration) * 20) / 20;
      setClock((c) => (c.k === resetKey && c.t === q ? c : { k: resetKey, t: q }));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, duration, resetKey]);
  return running && clock.k === resetKey ? clock.t : 0;
}

/* ═════════════════════════ the steps ═════════════════════════ */

type Tag = { logo?: BrandKey; label: string };

type Step = {
  key: "share" | "dm" | "write";
  title: string;
  body: string;
  tags: Tag[];
  /** loop length in seconds, including a hold on the finished state */
  dur: number;
  /** the frame to freeze on for reduced motion */
  still: number;
  chip: { at: number; label: string; value: string };
};

const STEPS: Step[] = [
  {
    key: "share",
    title: "Share a video, get the trades",
    body: "Send Bread any YouTube link or podcast. It listens to the whole thing, pins every tradable call with its timestamp, and builds the sandwich behind it.",
    tags: [
      { logo: "youtube", label: "YouTube" },
      { logo: "podcasts", label: "Podcasts" },
    ],
    dur: 11,
    still: 9,
    chip: { at: 7.4, label: "2 hr podcast", value: "3 trades" },
  },
  {
    key: "dm",
    title: "DM2Buy: send a post, reply “buy $5”",
    body: "Connect X once. DM any post to @sandwichplis and Bread cooks it into a sandwich right in the chat. Reply with an amount and it’s bought.",
    tags: [{ logo: "x", label: "@sandwichplis" }],
    dur: 11,
    still: 9.6,
    chip: { at: 8.1, label: "no app switch", value: "$10 in" },
  },
  {
    key: "write",
    title: "Write a take, get the basket",
    body: "Type what’s on your mind, even “tennis is about to go huge again”. The Sandwich Agent finds the stocks and markets behind it and weights the basket.",
    tags: [{ label: "Sandwich Agent" }],
    dur: 12,
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

/* ═════════════════════════ 1 · share a video ═════════════════════════ */

const CAPS = [
  { at: 0.2, text: "everyone’s still arguing about chips." },
  { at: 1.3, text: "the money moves to the software that runs on them." },
];

const CALLS: { at: string; title: string; ids: BrandKey[]; pnl: string; best?: boolean }[] = [
  { at: "12:40", title: "Chips are still the AI trade", ids: ["NVDA", "AVGO"], pnl: "78.4%" },
  { at: "34:10", title: "AI’s next leg is software", ids: ["PLTR", "NET", "SNOW"], pnl: "139.2%", best: true },
  { at: "1:02:11", title: "Robots need chips too", ids: ["TSLA", "ARM"], pnl: "31.0%" },
];

const PIN_AT = [0.18, 0.34, 0.66];

function ShareScene({ t }: SceneProps) {
  const sheetUp = t >= 2.5;
  const pressed = t >= 3.5 && t < 3.85;
  const bread = t >= 4.2;
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
        <div className={`${s.share} ${sheetUp ? s.shareUp : ""}`}>
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
      <div className={`${s.slide} ${bread ? s.slideOn : ""}`}>
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
              <b key={x} className={`${s.scrubPin} ${listen >= x ? s.scrubPinOn : ""} ${i === 1 ? s.scrubPinBest : ""}`} style={{ left: `${x * 100}%` }} />
            ))}
          </div>
          <span className={s.scrubTimes}>
            <em>0:00</em>
            <em>2:04:11</em>
          </span>
        </div>

        <div className={s.calls}>
          {CALLS.map((c, i) =>
            listen >= PIN_AT[i] + 0.04 ? (
              <div key={c.at} className={`${s.call} ${c.best ? s.callBest : ""}`}>
                <span className={s.callAt}>{c.at}</span>
                <span className={s.callMain}>
                  <b>{c.title}</b>
                  <LogoStack ids={c.ids} size={22} />
                </span>
                <span className={s.pnl}>
                  <i />
                  {c.pnl}
                </span>
                {c.best && <u>strongest</u>}
              </div>
            ) : null,
          )}
        </div>

        <div className={`${s.buyBar} ${t >= 7.8 ? s.buyBarOn : ""}`}>BUY THE 34:10 CALL</div>
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
          <div className={`${s.msg} ${s.msgOut}`}>
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
        {t >= 0.9 && <span className={`${s.dmSent} ${s.msg}`}>Sent</span>}
        {t >= 1.6 && <div className={`${s.msg} ${s.msgIn}`}>On it…</div>}
        {t >= 3.1 && (
          <div className={`${s.msg} ${s.msgIn} ${s.msgBig}`}>
            <p>AI memory demand is outrunning supply.</p>
            <p>
              Bullish $MU $SNDK
              <br />
              <u>breadapp.fun/s/memory</u>
            </p>
            <p>Reply “buy $5” (any amount) to buy $MU $SNDK 🥪</p>
          </div>
        )}
        {sent && <div className={`${s.msg} ${s.msgOut} ${s.msgBlue}`}>buy $10</div>}
        {sent && t >= 6.9 && t < 7.7 && (
          <div className={`${s.msg} ${s.msgIn} ${s.dots}`}>
            <i />
            <i />
            <i />
          </div>
        )}
        {t >= 7.7 && (
          <div className={`${s.msg} ${s.msgIn} ${s.msgBig}`}>
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
      <div className={`${s.banner} ${t >= 8.3 ? s.bannerOn : ""}`}>
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
      <div className={`${s.slide} ${next ? s.slideOn : ""}`}>
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
            className={s.draw}
            style={{ strokeDashoffset: next && t >= 5.6 ? 0 : 1 }}
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
        <span className={`${s.dPicked} ${t >= 6.0 ? s.dPickedOn : ""}`}>✦ picked by Sandwich Agent</span>

        <div className={s.legs}>
          {LEGS.map((l, i) =>
            t >= 6.2 + i * 0.22 ? (
              <div key={l.id} className={s.leg}>
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
            ) : null,
          )}
        </div>

        <div className={`${s.buyBar} ${s.buyPlain} ${t >= 7.7 ? s.buyBarOn : ""}`}>BUY</div>
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

function Scene({ i, t, reduce }: { i: number } & SceneProps) {
  const props = { t, reduce };
  return (
    <div key={i} className={s.sceneIn}>
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

function Pinned({ reduce, still }: { reduce: boolean; still: number | null }) {
  const track = useRef<HTMLDivElement>(null);
  const [stage, inView] = useVisible<HTMLDivElement>();
  const [idx, setIdx] = useState(0);
  const { scrollYProgress } = useScroll({ target: track, offset: ["start start", "end end"] });
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    setIdx(Math.min(STEPS.length - 1, Math.max(0, Math.floor(p * STEPS.length))));
  });

  const step = STEPS[idx];
  const clock = useClock(inView && !reduce && still === null, step.dur, idx);
  const t = still ?? (reduce ? step.still : clock);

  const jump = useCallback(
    (i: number) => {
      const el = track.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY;
      const dist = el.offsetHeight - window.innerHeight;
      window.scrollTo({ top: top + (dist * (i + 0.5)) / STEPS.length, behavior: reduce ? "auto" : "smooth" });
    },
    [reduce],
  );

  return (
    <div className={s.pinned}>
      <div ref={track} className={s.track}>
        <div ref={stage} className={s.stage}>
          <ol className={s.rail}>
            {STEPS.map((st, i) => (
              <li key={st.key} className={`${s.item} ${i === idx ? s.itemOn : ""}`}>
                <button type="button" className={s.itemBtn} onClick={() => jump(i)} aria-expanded={i === idx}>
                  <span className={s.num}>{i + 1}</span>
                  <span className={s.itemTitle}>{st.title}</span>
                </button>
                <div className={s.itemBody}>
                  <div>
                    <div className={s.bodyIn}>
                      <p>{st.body}</p>
                      <Tags tags={st.tags} />
                      <span className={s.prog} aria-hidden="true">
                        <i style={{ transform: `scaleX(${i === idx ? t / st.dur : 0})` }} />
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ol>

          <div className={s.stagePhone}>
            <div className={s.glows} aria-hidden="true">
              {STEPS.map((st, i) => (
                <i key={st.key} className={`${s.glow} ${s[`glow_${st.key}`]} ${i === idx ? s.glowOn : ""}`} />
              ))}
            </div>
            <Phone>
              <Scene i={idx} t={t} reduce={reduce} />
            </Phone>
            <div key={idx} className={`${s.chip} ${t >= step.chip.at ? s.chipOn : ""}`} aria-hidden="true">
              <span>{step.chip.label}</span>
              <b>{step.chip.value}</b>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Phones and narrow screens: no pinning, each step carries its own phone. */
function StackedStep({ step, i, reduce, still }: { step: Step; i: number; reduce: boolean; still: number | null }) {
  const [ref, inView] = useVisible<HTMLElement>("-12% 0px");
  const clock = useClock(inView && !reduce && still === null, step.dur, 0);
  const t = still ?? (reduce ? step.still : clock);
  return (
    <article ref={ref} className={s.sStep}>
      <span className={s.num}>{i + 1}</span>
      <h3>{step.title}</h3>
      <p>{step.body}</p>
      <Tags tags={step.tags} />
      <div className={s.sPhone}>
        <Phone>
          <Scene i={i} t={t} reduce={reduce} />
        </Phone>
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
      <div className={s.head}>
        <h2>How Bread works</h2>
        <p>Three ways an idea becomes a position. Same sandwich every time.</p>
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
