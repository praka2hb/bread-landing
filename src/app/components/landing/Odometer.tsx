"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./landing.module.css";

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

/**
 * Soar-style rolling digits: every digit is a 0–9 column that slides to its
 * value. Non-digits ($ . , % +) render as static glyphs. Starts at zero and
 * rolls up the first time it scrolls into view.
 */
export function Odometer({ value, className }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setArmed(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  return (
    <span ref={ref} className={`${styles.odometer} ${className ?? ""}`} aria-label={value}>
      {value.split("").map((char, i) => {
        const digit = DIGITS.indexOf(char);
        if (digit === -1) {
          return (
            <span key={`s${i}`} aria-hidden="true" className={styles.odoStatic}>
              {char}
            </span>
          );
        }
        return (
          <span key={`d${i}`} aria-hidden="true" className={styles.odoWindow}>
            <span
              className={styles.odoColumn}
              style={{
                transform: `translateY(-${(armed ? digit : 0) * 10}%)`,
                transitionDelay: `${i * 45}ms`,
              }}
            >
              {DIGITS.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
}
