"use client";

import Image from "next/image";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";
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
    [0, 0.1, 0.34, 0.58, 0.76, 1],
    [0.72, 0.72, 1.12, entryScale, entryScale, entryScale],
  );
  const computerY = useTransform(
    scrollYProgress,
    [0, 0.12, 0.42, 0.62, 1],
    [34, 34, 4, 0, 0],
  );
  const cloudsX = useTransform(
    scrollYProgress,
    [0, 0.58, 0.74, 1],
    ["0%", "0%", "-7%", "-28%"],
  );
  const cloudsOpacity = useTransform(
    scrollYProgress,
    [0, 0.32, 0.58, 0.88, 1],
    [0.72, 0.78, 1, 1, 0.88],
  );
  const grassX = useTransform(
    scrollYProgress,
    [0, 0.58, 0.74, 1],
    ["0%", "0%", "-14%", "-44%"],
  );
  const grassOpacity = useTransform(
    scrollYProgress,
    [0, 0.4, 0.62, 1],
    [0.86, 0.9, 1, 0.96],
  );
  const grassY = useTransform(
    scrollYProgress,
    [0, 0.58, 0.74, 0.88, 1],
    [0, 0, -4, 10, -2],
  );
  const grassSkewY = useTransform(
    scrollYProgress,
    [0, 0.58, 0.74, 0.88, 1],
    [0, 0, -1.6, 1.8, -0.8],
  );
  const grassScaleY = useTransform(
    scrollYProgress,
    [0, 0.58, 0.74, 0.88, 1],
    [0.86, 0.86, 0.9, 0.84, 0.88],
  );
  const onlineOpacity = useTransform(
    scrollYProgress,
    [0, 0.76, 0.86, 1],
    [0, 0, 1, 1],
  );
  const onlineY = useTransform(scrollYProgress, [0.76, 0.9], [18, 0]);

  return (
    <section
      ref={heroRef}
      className={`${styles.hero} ${reduceMotion ? styles.reducedMotion : ""}`}
      aria-label="Enter Bread through a retro computer screen"
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

        <div className={styles.camera}>
          <motion.div
            className={styles.computer}
            style={{
              scale: reduceMotion ? 0.72 : computerScale,
              y: reduceMotion ? 34 : computerY,
            }}
          >
            <Image
              src="/bread-crt-cool-gray.png"
              alt="An off-white vintage CRT computer displaying a rolling green landscape"
              width={1536}
              height={1024}
              priority
              unoptimized
              className={styles.monitorImage}
            />

            <div className={styles.screen} aria-hidden="true">
              <motion.div
                className={`${styles.sceneLayer} ${styles.skyLayer}`}
              >
                <Image
                  src="/hero-sky.png"
                  alt=""
                  fill
                  priority
                  unoptimized
                  sizes="100vw"
                  className={styles.sceneImage}
                />
              </motion.div>

              <motion.div
                className={`${styles.sceneLayer} ${styles.cloudsLayer}`}
                style={{
                  x: reduceMotion ? "0%" : cloudsX,
                  opacity: reduceMotion ? 1 : cloudsOpacity,
                }}
              >
                <Image
                  src="/hero-clouds-defringed.png"
                  alt=""
                  fill
                  priority
                  unoptimized
                  sizes="100vw"
                  className={styles.sceneImage}
                />
              </motion.div>

              <motion.div
                className={`${styles.sceneLayer} ${styles.grassLayer}`}
                style={{
                  x: reduceMotion ? "0%" : grassX,
                  y: reduceMotion ? 0 : grassY,
                  skewY: reduceMotion ? 0 : grassSkewY,
                  scaleY: reduceMotion ? 0.86 : grassScaleY,
                  opacity: reduceMotion ? 1 : grassOpacity,
                }}
              >
                <Image
                  src="/hero-grass.png"
                  alt=""
                  fill
                  priority
                  unoptimized
                  sizes="100vw"
                  className={styles.sceneImage}
                />
              </motion.div>

              <div className={styles.crtTint} />
              <div className={styles.scanlines} />
              <div className={styles.glassGlare} />
            </div>
          </motion.div>
        </div>

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

        <div className={styles.vhsNoise} aria-hidden="true" />
      </div>
    </section>
  );
}
