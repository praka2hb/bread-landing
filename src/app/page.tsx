import Image from "next/image";
import { BreadHero } from "./components/bread-hero";
import { HomeNavbar } from "./components/HomeNavbar";
import styles from "./page.module.css";

const SHOW_FULL_LANDING_PAGE = true;

function YouTubeIcon() {
  return (
    <svg
      className={styles.youtubeIcon}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className={styles.xIcon} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18.2 2.3h3.3l-7.2 8.2 8.5 11.3h-6.6L11 14.9l-6 6.9H1.7l7.7-8.9L1.3 2.3h6.8l4.7 6.2 5.4-6.2Zm-1.1 17.5h1.8L7.1 4.1h-2l12 15.7Z" />
    </svg>
  );
}

function SubstackIcon() {
  return (
    <svg
      className={styles.substackIcon}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M1.5 2.4h21v2.8h-21V2.4Zm0 3h21v2.8h-21V5.4Zm0 5.4h21v2.8h-21v-2.8Zm17.1 4.2v9L12 20.3 5.4 24v-9h13.2Z" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg
      className={styles.outlineSourceIcon}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="m9.5 14.5 5-5M7.2 16.8l-1.5 1.5a3.5 3.5 0 0 1-5-5l3.5-3.5a3.5 3.5 0 0 1 5 0M16.8 7.2l1.5-1.5a3.5 3.5 0 0 1 5 5l-3.5 3.5a3.5 3.5 0 0 1-5 0" />
    </svg>
  );
}

export default function Page() {
  return (
    <>
      <HomeNavbar />
      {SHOW_FULL_LANDING_PAGE ? (
        <BreadHero />
      ) : (
        <main className={styles.main}>
          <div className={styles.intro}>
            <p>
              <span className={styles.inlineWordmark}>
                <Image
                  src="/breadtext.PNG"
                  alt="Bread"
                  width={2560}
                  height={1088}
                  priority
                  className={styles.breadWordmark}
                />
              </span>{" "}
              is a social network for financial markets. A place to discover
              ideas, see what others are backing, and trade directly from the
              feed.
            </p>

            <p>
              <strong className={styles.bridgeLine}>
                <span className={styles.bridgeLineSerif}>
                  financial ideas on the{" "}
                </span>
                <span className={styles.internetWord} aria-label="internet">
                  <span aria-hidden="true">int</span>
                  <span
                    className={styles.internetExplorerIcon}
                    aria-hidden="true"
                  >
                    <Image
                      src="/internet-explorer-e.png"
                      alt=""
                      width={377}
                      height={512}
                      className={styles.internetExplorerImage}
                    />
                  </span>
                  <span aria-hidden="true">rnet</span>
                </span>{" "}
                ↔ executable liquid trades.
              </strong>
              An idea from{" "}
              <span
                className={styles.sourceIcons}
                role="img"
                aria-label="YouTube, X, Substack, Internet Explorer, and links"
              >
                <YouTubeIcon />
                <XIcon />
                <SubstackIcon />
                <Image
                  src="/internet-explorer-e.png"
                  alt=""
                  width={377}
                  height={512}
                  className={styles.sourceInternetExplorerIcon}
                />
                <LinkIcon />
              </span>{" "}
              can be turned into a{" "}
              <em className={styles.inlineSandwich}>sandwich</em>.
            </p>

            <dl className={styles.dictionaryEntry}>
              <div>
                <dt className={styles.dictionaryTerm}>
                  <span>sandwich</span>
                  <span className={styles.pronunciation}>/ˈsæn.wɪtʃ/</span>
                </dt>
                <dd className={styles.dictionaryDefinition}>
                  <span className={styles.partOfSpeech}>noun</span>
                  <span>
                    <mark className={styles.selectionHighlight}>
                      an in-app tradable position built around that thesis
                    </mark>
                    . It can be a single asset, a basket of assets, or a perp
                    position, with the relevant markets and reasoning behind
                    each leg.
                  </span>
                </dd>
              </div>
            </dl>

            <p>
              Your media diet is already full of hidden alpha. It helps surface
              it, structure it, and turn it into something you can actually act
              on.
            </p>

            <p>
              The goal is simple: make financial markets feel less like a
              trading terminal and more like a social app for normies.
            </p>
          </div>
        </main>
      )}
    </>
  );
}
