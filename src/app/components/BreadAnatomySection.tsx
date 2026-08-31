"use client";

import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  type MotionValue,
} from "framer-motion";
import { type CSSProperties } from "react";
import styles from "./bread-anatomy.module.css";

const DEPTH_LAYER_COUNT = 24;

type BreadSliceProps = {
  rotateX: MotionValue<number>;
  rotateY: MotionValue<number>;
};

function BreadSlice({ rotateX, rotateY }: BreadSliceProps) {
  return (
    <motion.span className={styles.breadModel} style={{ rotateX, rotateY }}>
      {Array.from({ length: DEPTH_LAYER_COUNT }, (_, index) => {
        const z = -10 + (20 * index) / (DEPTH_LAYER_COUNT - 1);
        const lightness =
          30 +
          Math.round(
            Math.sin((index / (DEPTH_LAYER_COUNT - 1)) * Math.PI) * 12,
          );

        return (
          <span
            key={index}
            className={styles.depthLayer}
            style={
              {
                "--layer-z": `${z}px`,
                "--layer-lightness": `${lightness}%`,
              } as CSSProperties
            }
          />
        );
      })}

      <span className={`${styles.breadFace} ${styles.breadBack}`}>
        <span className={`${styles.crumb} ${styles.backCrumb}`} />
      </span>

      <span className={`${styles.breadFace} ${styles.breadFront}`}>
        <span className={styles.crumb} />
      </span>
    </motion.span>
  );
}

export function BreadAnatomySection() {
  const reduceMotion = useReducedMotion();
  const leftRotateX = useMotionValue(-7);
  const leftRotateY = useMotionValue(-38);
  const rightRotateX = useMotionValue(-8);
  const rightRotateY = useMotionValue(28);

  useAnimationFrame((_time, delta) => {
    if (reduceMotion) return;

    leftRotateY.set((leftRotateY.get() + delta * 0.02) % 360);
    rightRotateY.set((rightRotateY.get() - delta * 0.024) % 360);
  });

  return (
    <section className={styles.section} aria-labelledby="bread-anatomy-title">
      <svg
        className={styles.shapeDefinition}
        width="0"
        height="0"
        aria-hidden="true"
      >
        <defs>
          <clipPath id="bread-slice-shape" clipPathUnits="objectBoundingBox">
            <path d="M .13 1 L .87 1 C .88 1 .89 .98 .89 .95 L .89 .31 C .89 .29 .90 .28 .91 .28 C .93 .26 .94 .24 .94 .21 C .94 .11 .83 .05 .69 .03 C .57 .015 .43 .015 .31 .03 C .17 .05 .06 .11 .06 .21 C .06 .24 .07 .26 .09 .28 C .10 .28 .11 .29 .11 .31 L .11 .95 C .11 .98 .12 1 .13 1 Z" />
          </clipPath>
        </defs>
      </svg>

      <div className={styles.inner}>
        <div
          className={`${styles.modelStage} ${styles.leftStage}`}
          aria-hidden="true"
        >
          <div className={styles.modelShadow} />
          <div className={styles.breadVisual}>
            <BreadSlice rotateX={leftRotateX} rotateY={leftRotateY} />
          </div>
        </div>

        <div className={styles.copy}>
          <h2 id="bread-anatomy-title">Anatomy of a sandwich</h2>
        </div>

        <div
          className={`${styles.modelStage} ${styles.rightStage}`}
          aria-hidden="true"
        >
          <div className={styles.modelShadow} />
          <div className={styles.breadVisual}>
            <BreadSlice rotateX={rightRotateX} rotateY={rightRotateY} />
          </div>
        </div>
      </div>
    </section>
  );
}
