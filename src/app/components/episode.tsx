"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./episode.module.css";

/**
 * One video, and every call it produced.
 *
 * A video that produced eleven calls is eleven rows in the API, each with its
 * own thesis, legs and timestamp. This is the screen that puts them back
 * together — the web counterpart of the app's episode screen, which calls
 * itself "the ONLY screen a YouTube-sourced call has".
 *
 * The props are a flat view model rather than `Sandwich` objects on purpose:
 * every sandwich carries its source's full transcript, and handing those to a
 * client component would serialize a megabyte of it into the RSC payload.
 */

export type EpisodeCallView = {
  id: string;
  ticker: string;
  short: boolean;
  startMs: number | null;
  /** Preformatted `34:43` — the server owns the format, both lists share it. */
  timestamp: string | null;
  /** What was actually said at the timestamp. */
  quote: string;
  headline: string;
  explanation: string;
  price: string;
  entryPrice: string | null;
  pnlPct: number | null;
  /** "underlying_move" on a perp, whose percentage is not a realized return. */
  pnlBasis: string | null;
  /**
   * Every leg's mark, in basket order. The lead is the row's logo; the whole
   * set is the stack the dialog heads with, which is the only place a two-asset
   * call still says so now that the leg list is gone.
   */
  assets: { id: string; symbol: string; logoUrl: string | null }[];
  /** The asset page for the call's lead instrument, when it resolved to one. */
  href: string | null;
  openInApp: string;
};

export type EpisodeVideoView = {
  videoId: string;
  url: string;
  title: string;
  channelName: string | null;
  channelHandle: string | null;
  channelAvatarUrl: string | null;
  publishedLabel: string | null;
};

/**
 * Who the episode is filed under: the Bread user who built these calls, not the
 * channel they were built from. The channel stays on the line below as the
 * citation — the same split the feed makes, and for the same reason. A thesis
 * generated from someone's video is not something they said.
 */
export type EpisodeBuilderView = {
  name: string;
  username: string | null;
  avatarUrl: string | null;
};

function formatPct(value: number | null): string {
  if (value === null) return "--";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function pctClass(value: number | null): string {
  if (value === null) return styles.pctFlat;
  // A flat call is not a losing one — 0 reads green, as in the app.
  return value < 0 ? styles.pctDown : styles.pctUp;
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="m6 6 12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function VerifiedIcon() {
  return (
    <svg
      className={styles.verified}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-label="Verified Bread builder"
      focusable="false"
      role="img"
    >
      <path d="m23 12-2.44-2.78.38-3.68-3.59-.82L15.46 1.54 12 3 8.54 1.54 6.65 4.72l-3.59.81.38 3.68L1 12l2.44 2.78-.38 3.69 3.59.82 1.89 3.18L12 21l3.46 1.46 1.89-3.18 3.59-.82-.38-3.68L23 12Zm-12.91 4.72-3.8-3.81 1.48-1.48 2.32 2.34 5.92-5.93 1.48 1.48-7.4 7.4Z" />
    </svg>
  );
}

function initialsOf(value: string): string {
  return value.replace(/^@/, "").slice(0, 2).toUpperCase() || "?";
}

/** Past this the marks stop being readable and start being a smear. */
const MAX_STACKED = 4;

/**
 * How much of an episode the web shows: three assets, and up to three of the
 * calls made on each. Everything past that goes behind the same blurred summary
 * the sandwich detail page puts a basket's other legs behind — visibly there,
 * unreadable, and a reason to open the app.
 */
const VISIBLE_ASSETS = 3;
const MAX_THESES_PER_ASSET = 3;

/**
 * One asset, and every call the episode made on it.
 *
 * A speaker who comes back to NVDA five times produces five calls on one
 * instrument, and a flat list draws that as five rows wearing the same logo and
 * the same ticker. Grouping puts the asset down once and files its theses under
 * it, so what varies between rows — the moment, the quote, the return — is the
 * only thing that varies between rows.
 */
type CallGroup = {
  key: string;
  ticker: string;
  logoUrl: string | null;
  /** The calls shown for this asset, best first. */
  calls: EpisodeCallView[];
  /** How many the episode actually made on it, including any held back. */
  total: number;
  /** The group's best return — what ranks one asset against another. */
  best: number | null;
};

/** Unpriced sorts last: it has not failed, it just has nothing to compare. */
function rankOf(value: number | null): number {
  return value ?? Number.NEGATIVE_INFINITY;
}

/**
 * The call's assets as one overlapping mark: the lead in front, the rest tucked
 * behind it to the right. A basket reads as a basket at a glance, without
 * spending a row per leg.
 */
function AssetStack({ assets }: { assets: EpisodeCallView["assets"] }) {
  const shown = assets.slice(0, MAX_STACKED);
  const hidden = assets.length - shown.length;

  return (
    <span className={styles.stack}>
      {shown.map((asset) => (
        <span className={`${styles.callLogo} ${styles.stackLogo}`} key={asset.id}>
          {asset.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={asset.logoUrl} alt="" decoding="async" />
          ) : (
            asset.symbol.slice(0, 2)
          )}
        </span>
      ))}
      {hidden > 0 ? (
        <span className={`${styles.callLogo} ${styles.stackLogo} ${styles.stackMore}`}>
          +{hidden}
        </span>
      ) : null}
    </span>
  );
}

export function EpisodeView({
  video,
  calls,
  builder = null,
  focusCallId = null,
}: {
  video: EpisodeVideoView;
  calls: EpisodeCallView[];
  /** Null on an episode whose calls were ingested without an owning account. */
  builder?: EpisodeBuilderView | null;
  /** The call a share link or feed card arrived for — highlighted and cued. */
  focusCallId?: string | null;
}) {
  const focused = calls.find((call) => call.id === focusCallId) ?? null;
  const [selected, setSelected] = useState<EpisodeCallView | null>(focused);
  const [playing, setPlaying] = useState<EpisodeCallView | null>(focused);

  const panelRef = useRef<HTMLDivElement>(null);
  // Where to put focus back when the dialog closes — the row that opened it, so
  // keyboard reading resumes at the call just read rather than at the top.
  const openerRef = useRef<HTMLElement | null>(null);

  // Focus moves into the panel so Escape and Tab land inside it, and the page
  // behind stops scrolling under the backdrop.
  useEffect(() => {
    if (!selected) return;
    panelRef.current?.focus();

    const { body } = document;
    const gutter = window.innerWidth - document.documentElement.clientWidth;
    const previous = { overflow: body.style.overflow, paddingRight: body.style.paddingRight };
    body.style.overflow = "hidden";
    // Taking the scrollbar away would otherwise shift the whole page left by
    // its width the moment the dialog opens.
    if (gutter > 0) body.style.paddingRight = `${gutter}px`;

    return () => {
      body.style.overflow = previous.overflow;
      body.style.paddingRight = previous.paddingRight;
    };
  }, [selected]);

  const closeCall = useCallback(() => {
    setSelected(null);
    openerRef.current?.focus();
    openerRef.current = null;
  }, []);

  // Escape has to work from the backdrop and from anything inside the panel, so
  // it is bound to the document rather than to one element's handler.
  useEffect(() => {
    if (!selected) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeCall();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [closeCall, selected]);

  const startSeconds = playing?.startMs ? Math.floor(playing.startMs / 1000) : 0;
  const embedSrc =
    `https://www.youtube-nocookie.com/embed/${video.videoId}` +
    `?autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1&start=${startSeconds}`;

  const playVideo = (call: EpisodeCallView | null) => {
    setPlaying(call);
  };

  const selectCall = (call: EpisodeCallView, opener: HTMLElement) => {
    const closing = selected?.id === call.id;
    if (closing) {
      closeCall();
    } else {
      openerRef.current = opener;
      setSelected(call);
    }
    if (call.startMs !== null) playVideo(call);
  };

  // The channel. Still the voice behind every quote in the dialog, so this stays
  // whatever the byline resolves to.
  const handle = video.channelHandle ?? video.channelName ?? "YouTube";
  const byline = builder
    ? {
        label: builder.username ? `@${builder.username}` : builder.name,
        avatarUrl: builder.avatarUrl,
        href: builder.username ? `/u/${builder.username}` : null,
      }
    : {
        label: handle.startsWith("@") ? handle : `@${handle}`,
        avatarUrl: video.channelAvatarUrl,
        href: null,
      };
  const multiAsset = (selected?.assets.length ?? 0) > 1;

  // Grouped by asset, then best first rather than in video order: what the
  // preview is for is the instruments that worked, and the calls that worked on
  // them.
  const [visibleGroups, hiddenCalls] = useMemo(() => {
    const groups = new Map<string, CallGroup>();

    for (const call of calls) {
      // The lead leg, not the row's ticker: two calls on the same instrument
      // can carry different baskets behind it and still be the same mention.
      const lead = call.assets[0];
      const key = lead?.symbol || call.ticker;
      const existing = groups.get(key);
      if (existing) {
        existing.calls.push(call);
        existing.total += 1;
        // Only some of an asset's calls resolve a mark upstream; the header
        // takes the first that did rather than the first call's blank.
        existing.logoUrl = existing.logoUrl ?? lead?.logoUrl ?? null;
        continue;
      }
      groups.set(key, {
        key,
        ticker: call.ticker,
        logoUrl: lead?.logoUrl ?? null,
        calls: [call],
        total: 1,
        best: call.pnlPct,
      });
    }

    const ranked = [...groups.values()];
    for (const group of ranked) {
      group.calls.sort((left, right) => rankOf(right.pnlPct) - rankOf(left.pnlPct));
      group.best = group.calls[0]?.pnlPct ?? null;
    }
    ranked.sort((left, right) => rankOf(right.best) - rankOf(left.best));

    const shown = ranked.slice(0, VISIBLE_ASSETS).map((group) => ({
      ...group,
      calls: group.calls.slice(0, MAX_THESES_PER_ASSET),
    }));

    // Both cuts land in the same pile: the assets past the third, and the calls
    // past the third on an asset that is shown.
    const shownIds = new Set(shown.flatMap((group) => group.calls.map((call) => call.id)));
    const hidden = ranked
      .flatMap((group) => group.calls)
      .filter((call) => !shownIds.has(call.id));

    return [shown, hidden] as const;
  }, [calls]);

  /**
   * One call. Nested under an asset it drops the logo and the ticker — the
   * header two lines up already said both — and keeps the moment, the words and
   * the return, which are what tell one thesis from the next.
   */
  const renderCall = (call: EpisodeCallView, nested: boolean) => {
    const isSelected = selected?.id === call.id;
    const isPlaying = playing?.id === call.id;

    return (
      <button
        type="button"
        id={`call-${call.id}`}
        className={`${styles.callSelect} ${nested ? styles.thesisSelect : ""} ${
          isSelected ? styles.callSelected : ""
        }`}
        onClick={(event) => selectCall(call, event.currentTarget)}
        aria-haspopup="dialog"
        aria-expanded={isSelected}
      >
        <span
          className={`${styles.tsChip} ${isPlaying ? styles.tsChipActive : ""} ${
            call.startMs === null ? styles.tsChipUnavailable : ""
          }`}
        >
          {call.startMs !== null ? <PlayIcon /> : null}
          {call.timestamp ?? "--:--"}
        </span>

        {nested ? null : (
          <span className={styles.callLogo}>
            {call.assets[0]?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={call.assets[0].logoUrl} alt="" loading="lazy" decoding="async" />
            ) : (
              call.ticker.slice(0, 2)
            )}
          </span>
        )}

        <span className={styles.callMain}>
          <span className={styles.callMeta}>
            {nested ? null : <strong className={styles.callTicker}>{call.ticker}</strong>}
            <span className={call.short ? styles.sideShort : styles.sideLong}>
              {call.short ? "SHORT" : "LONG"}
            </span>
            {call.assets.length > 1 ? (
              <span className={styles.extraLegs}>+{call.assets.length - 1}</span>
            ) : null}
          </span>
          <span className={styles.callQuote}>“{call.quote}”</span>
        </span>

        <span className={`${styles.callPct} ${pctClass(call.pnlPct)}`}>
          {formatPct(call.pnlPct)}
        </span>
      </button>
    );
  };

  return (
    <div className={styles.episode}>
      <div className={styles.workspace}>
        <section className={styles.assetsColumn} aria-labelledby="episode-assets-title">
          <div className={styles.sectionHeading}>
            <h2 id="episode-assets-title">Top mentions</h2>
            <span>Select a call for details</span>
          </div>

          {calls.length > 0 ? (
            <>
              <ol className={styles.callList}>
                {visibleGroups.map((group) =>
                  group.calls.length === 1 ? (
                    <li className={styles.callItem} key={group.key}>
                      {renderCall(group.calls[0], false)}
                    </li>
                  ) : (
                    <li className={styles.callItem} key={group.key}>
                      <div className={styles.groupHeader}>
                        <span className={styles.callLogo}>
                          {group.logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={group.logoUrl} alt="" loading="lazy" decoding="async" />
                          ) : (
                            group.ticker.slice(0, 2)
                          )}
                        </span>
                        <span className={styles.groupIdentity}>
                          <strong className={styles.callTicker}>{group.ticker}</strong>
                          {/* The episode's count, not the shown count: an asset
                              with more theses than fit says so here, and the
                              rest are in the pile below with everything else. */}
                          <span className={styles.groupCount}>{group.total} calls</span>
                        </span>
                      </div>

                      <ol className={styles.thesisList}>
                        {group.calls.map((call) => (
                          <li key={call.id}>{renderCall(call, true)}</li>
                        ))}
                      </ol>
                    </li>
                  ),
                )}
              </ol>

              {hiddenCalls.length > 0 ? (
                <aside
                  className={styles.hiddenCalls}
                  aria-label={`${hiddenCalls.length} more ${
                    hiddenCalls.length === 1 ? "call" : "calls"
                  } in the app`}
                >
                  <span className={styles.hiddenStack} aria-hidden="true">
                    {hiddenCalls.slice(0, MAX_STACKED).map((call) => (
                      <span className={styles.hiddenLogo} key={call.id}>
                        {call.assets[0]?.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={call.assets[0].logoUrl} alt="" loading="lazy" decoding="async" />
                        ) : (
                          call.ticker.slice(0, 3)
                        )}
                      </span>
                    ))}
                  </span>
                  <strong>
                    +{hiddenCalls.length} more {hiddenCalls.length === 1 ? "call" : "calls"}
                  </strong>
                  {/* The real number, blurred past reading — a placeholder here
                      would be a made-up return on a real thesis. */}
                  <span className={styles.hiddenPct} aria-hidden="true">
                    {formatPct(hiddenCalls[0].pnlPct)}
                  </span>
                </aside>
              ) : null}

              <a href="bread://sandwich" className={styles.buyButton}>
                BUY
              </a>
            </>
          ) : (
            <div className={styles.emptyCalls}>
              <strong>No assets found</strong>
              <span>This episode has no timestamped calls yet.</span>
            </div>
          )}
        </section>

        {/* Raised above the backdrop while a call is open. `backdrop-filter`
            only blurs what is painted behind it, so lifting the column out from
            behind leaves the clip you just cued sharp and watchable. */}
        <section
          className={`${styles.videoColumn} ${selected ? styles.videoColumnRaised : ""}`}
          aria-label="Episode video"
        >
          <div className={styles.videoIntro}>
            <header className={styles.header}>
              {(() => {
                // The builder's byline, with the channel one step back as the
                // citation. An episode ingested without an owning account has
                // nobody to file it under, so the channel stands in.
                const face = (
                  <>
                    <span className={styles.avatar}>
                      {byline.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={byline.avatarUrl} alt="" loading="lazy" decoding="async" />
                      ) : (
                        initialsOf(byline.label)
                      )}
                    </span>
                    <span className={styles.bylineIdentity}>
                      <span className={styles.handle}>
                        <span className={styles.handleAt}>@</span>
                        {byline.label.replace(/^@/, "")}
                      </span>
                      {builder ? <VerifiedIcon /> : null}
                    </span>
                  </>
                );

                return byline.href ? (
                  <Link href={byline.href} className={styles.bylineLink}>
                    {face}
                  </Link>
                ) : (
                  <span className={styles.bylineLink}>{face}</span>
                );
              })()}

            </header>

            <h1 className={styles.title}>{video.title}</h1>

            <span className={styles.sourceLine}>
              <a href={video.url} target="_blank" rel="noreferrer">
                YouTube
              </a>
              {` · ${handle.startsWith("@") ? handle : `@${handle}`}`}
              {video.publishedLabel ? ` · ${video.publishedLabel}` : null}
            </span>
          </div>

          <div className={styles.player}>
            <iframe
              // Remounting on the cued call is what makes a timestamp seek:
              // the embed reads `start` once, at load.
              key={playing?.id ?? "episode"}
              src={embedSrc}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          </div>

          <a href={video.url} className={styles.watchLink} target="_blank" rel="noreferrer">
            watch on YouTube ↗
          </a>
        </section>
      </div>

      {selected ? (
        <>
          {/* Not a button: the panel already carries a labelled Close, and a
              second one under it would be one more stop for a screen reader to
              read past on the way in. */}
          <div className={styles.backdrop} onClick={closeCall} aria-hidden="true" />

          <div className={styles.modalLayer} role="presentation">
            <div
              ref={panelRef}
              className={styles.modal}
              role="dialog"
              aria-modal="true"
              aria-labelledby="call-modal-quote"
              tabIndex={-1}
            >
              <header className={styles.modalHeader}>
                <span className={styles.modalIdentity}>
                  {/* A basket puts its marks in the badge beside the number
                      instead, where the stack reads as one holding. */}
                  {multiAsset ? null : <AssetStack assets={selected.assets} />}
                  <span className={styles.modalIdentityCopy}>
                    <strong className={styles.modalTicker}>{selected.ticker}</strong>
                    <span className={styles.modalIdentityMeta}>
                      <span className={selected.short ? styles.sideShort : styles.sideLong}>
                        {selected.short ? "SHORT" : "LONG"}
                      </span>
                      {selected.timestamp ? (
                        <span className={styles.modalStamp}>{selected.timestamp}</span>
                      ) : null}
                    </span>
                  </span>
                </span>

                {/* The number is the headline of this screen, so it gets the
                    display face the app sets its big figures in. A basket wraps
                    it and its marks in one badge: the stack is what the number
                    is the return on. */}
                <span className={styles.modalPnl}>
                  <span className={multiAsset ? styles.pnlBadge : undefined}>
                    {multiAsset ? <AssetStack assets={selected.assets} /> : null}
                    <strong className={`${styles.modalPnlValue} ${pctClass(selected.pnlPct)}`}>
                      {formatPct(selected.pnlPct)}
                    </strong>
                  </span>
                  {selected.pnlBasis === "underlying_move" ? (
                    <span className={styles.modalPnlBasis}>underlying</span>
                  ) : selected.entryPrice ? (
                    <span className={styles.modalPnlBasis}>from {selected.entryPrice}</span>
                  ) : null}
                </span>

                <button type="button" className={styles.modalClose} onClick={closeCall}>
                  <span className="sr-only">Close</span>
                  <CloseIcon />
                </button>
              </header>

              <div className={styles.modalBody}>
                <span className={styles.modalAttribution}>
                  {handle.startsWith("@") ? handle : `@${handle}`}
                </span>

                {/* Clamped, not cut on the server: the quote is the citation, not
                    the point, and where it runs out depends on the width it is
                    read at. */}
                <blockquote className={styles.modalQuote} id="call-modal-quote">
                  “{selected.quote}”
                </blockquote>

                {selected.explanation ? (
                  <>
                    <span className={styles.whyLine}>
                      why <span className={styles.whyTicker}>${selected.ticker}</span>?
                    </span>
                    <p className={styles.modalWhy}>{selected.explanation}</p>
                  </>
                ) : null}
              </div>

              <a href={selected.openInApp} className={styles.modalBuy}>
                BUY {selected.ticker}
              </a>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
