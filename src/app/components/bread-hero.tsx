"use client";

import Image from "next/image";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { BreadAnatomySection } from "./BreadAnatomySection";
import {
  HeroCloudsLayer,
  HeroGrassLayer,
  HeroSkyLayer,
} from "./hero-scene-layers";
import styles from "./bread-hero.module.css";

const MONITOR_ASPECT_RATIO = 3 / 2;
const SCREEN_WIDTH_RATIO = 0.411;
const SCREEN_HEIGHT_RATIO = 0.414;

function getEntryScale() {
  if (typeof window === "undefined") return 6;

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const computerWidth = Math.min(
    1040,
    viewportWidth * (viewportWidth < 640 ? 1.5 : 0.78),
  );
  const screenWidth = computerWidth * SCREEN_WIDTH_RATIO;
  const screenHeight =
    (computerWidth / MONITOR_ASPECT_RATIO) * SCREEN_HEIGHT_RATIO;

  return Math.max(
    viewportWidth / screenWidth,
    viewportHeight / screenHeight,
  ) * 1.1;
}

export function BreadHero() {
  const heroRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const [entryScale, setEntryScale] = useState(6);
  const [hasScrolled, setHasScrolled] = useState(false);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end end"],
  });

  useEffect(() => {
    const updateEntryScale = () => setEntryScale(getEntryScale());
    const updateScrollHint = () => setHasScrolled(window.scrollY > 64);
    updateEntryScale();
    updateScrollHint();
    window.addEventListener("resize", updateEntryScale);
    window.addEventListener("scroll", updateScrollHint, { passive: true });

    return () => {
      window.removeEventListener("resize", updateEntryScale);
      window.removeEventListener("scroll", updateScrollHint);
    };
  }, []);

  const computerScale = useTransform(
    scrollYProgress,
    [0, 0.08, 0.26, 0.46, 0.88, 1],
    [0.72, 0.72, 1.12, entryScale, entryScale, entryScale],
  );
  const computerY = useTransform(
    scrollYProgress,
    [0, 0.1, 0.32, 0.48, 1],
    [34, 34, 4, 0, 0],
  );
  const skyX = useTransform(
    scrollYProgress,
    [0, 0.46, 0.58, 0.7, 0.82, 0.9, 1],
    ["0%", "0%", "5%", "-2%", "6%", "1%", "8%"],
  );
  const cloudsX = useTransform(
    scrollYProgress,
    [0, 0.46, 0.58, 0.7, 0.82, 0.9, 1],
    ["0%", "0%", "-6%", "-13%", "-21%", "-29%", "-37.5%"],
  );
  const cloudsY = useTransform(
    scrollYProgress,
    [0, 0.46, 0.6, 0.74, 0.88, 1],
    ["0%", "0%", "-1.5%", "1%", "-1%", "0.5%"],
  );
  const grassX = useTransform(
    scrollYProgress,
    [0, 0.46, 0.58, 0.7, 0.82, 0.9, 1],
    ["0%", "0%", "6%", "13%", "21%", "29%", "37.5%"],
  );
  const grassY = useTransform(
    scrollYProgress,
    [0, 0.46, 0.6, 0.74, 0.88, 1],
    ["0%", "0%", "1%", "-1.25%", "1.5%", "0%"],
  );
  const onlineOpacity = useTransform(
    scrollYProgress,
    [0, 0.82, 0.86, 0.89, 0.93, 1],
    [0, 0, 1, 1, 0, 0],
  );
  const onlineY = useTransform(
    scrollYProgress,
    [0.82, 0.86, 0.89, 0.93],
    [18, 0, 0, -12],
  );
  const computerPanelX = useTransform(
    scrollYProgress,
    [0, 0.9, 0.98, 1],
    ["0%", "0%", "-100%", "-100%"],
  );
  const anatomyPanelX = useTransform(
    scrollYProgress,
    [0, 0.9, 0.98, 1],
    ["100%", "100%", "0%", "0%"],
  );

  return (
    <section
      ref={heroRef}
      className={`${styles.hero} ${reduceMotion ? styles.reducedMotion : ""}`}
      aria-label="Explore Bread through a retro computer and sandwich anatomy"
    >
      <div className={styles.stickyScene}>
        <p
          className={`${styles.scrollHint} ${
            hasScrolled && !reduceMotion ? styles.scrollHintHidden : ""
          }`}
        >
          <span aria-hidden="true">→</span>
          Scroll to move right
        </p>

        <motion.div
          className={styles.camera}
          style={{ x: reduceMotion ? "-100%" : computerPanelX }}
        >
          <motion.div
            className={styles.computer}
            style={{
              scale: reduceMotion ? 0.72 : computerScale,
              y: reduceMotion ? 34 : computerY,
            }}
          >
            <Image
              src="/bread-crt-photoreal-v2.png"
              alt="An off-white vintage CRT computer displaying a rolling green landscape"
              width={1536}
              height={1024}
              priority
              unoptimized
              className={styles.monitorImage}
            />

            <div className={styles.screen} aria-hidden="true">
              <HeroSkyLayer x={reduceMotion ? "0%" : skyX} />
              <HeroCloudsLayer
                x={reduceMotion ? "0%" : cloudsX}
                y={reduceMotion ? "0%" : cloudsY}
              />
              <HeroGrassLayer
                x={reduceMotion ? "0%" : grassX}
                y={reduceMotion ? "0%" : grassY}
              />
            </div>
          </motion.div>
        </motion.div>

        {!reduceMotion ? (
          <motion.div
            className={styles.onlineToast}
            style={{ opacity: onlineOpacity, y: onlineY }}
          >
            <span className={styles.statusLight} aria-hidden="true" />
            <span>
              <strong>BREAD.EXE</strong>
              You are now online
            </span>
          </motion.div>
        ) : null}

        <motion.div
          className={styles.anatomyPanel}
          style={{ x: reduceMotion ? "0%" : anatomyPanelX }}
        >
          <BreadAnatomySection />
        </motion.div>
      </div>
    </section>
  );
}
