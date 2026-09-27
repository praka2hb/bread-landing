import Image from "next/image";
import { motion, type MotionValue } from "framer-motion";
import styles from "./bread-hero.module.css";

type AnimatedAxis =
  | string
  | number
  | MotionValue<string>
  | MotionValue<number>;

type HorizontalLayerProps = {
  x: AnimatedAxis;
};

type FreeLayerProps = HorizontalLayerProps & {
  y: AnimatedAxis;
};

export function HeroSkyLayer({ x }: HorizontalLayerProps) {
  return (
    <motion.div
      className={`${styles.sceneLayer} ${styles.skyLayer}`}
      style={{ x }}
    >
      <Image
        src="/hero-sky-v4.png"
        alt=""
        fill
        priority
        unoptimized
        sizes="100vw"
        className={styles.sceneImage}
      />
    </motion.div>
  );
}

export function HeroCloudsLayer({ x, y }: FreeLayerProps) {
  return (
    <motion.div
      className={`${styles.sceneLayer} ${styles.cloudsLayer}`}
      style={{ x, y }}
    >
      <Image
        src="/hero-clouds-panorama-v2.png"
        alt=""
        fill
        priority
        unoptimized
        sizes="400vw"
        className={styles.sceneImage}
      />
    </motion.div>
  );
}

export function HeroGrassLayer({ x, y }: FreeLayerProps) {
  return (
    <motion.div
      className={`${styles.sceneLayer} ${styles.grassLayer}`}
      style={{ x, y }}
    >
      <Image
        src="/hero-grass-panorama-v2.png"
        alt=""
        fill
        priority
        unoptimized
        sizes="400vw"
        className={styles.sceneImage}
      />
    </motion.div>
  );
}
