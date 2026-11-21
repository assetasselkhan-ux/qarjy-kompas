import { useState, useEffect, useRef } from "react";

interface AnimatedCounterProps {
  value: number;
  formatter?: (val: number) => string;
  duration?: number;
  className?: string;
}

export function AnimatedCounter({
  value,
  formatter = (v) => Math.round(v).toString(),
  duration = 380,
  className = "",
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const previousRef = useRef(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const startVal = previousRef.current;
    const endVal = value;
    if (!Number.isFinite(endVal) || Math.abs(endVal - startVal) < 0.001) {
      setDisplayValue(endVal);
      previousRef.current = endVal;
      return;
    }

    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      // Smooth easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      const current = startVal + (endVal - startVal) * eased;
      setDisplayValue(current);

      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        previousRef.current = endVal;
        setDisplayValue(endVal);
      }
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      previousRef.current = endVal;
    };
  }, [value, duration]);

  return <span className={`tabular-nums ${className}`}>{formatter(displayValue)}</span>;
}
