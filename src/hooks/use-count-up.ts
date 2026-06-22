"use client";

import { useEffect, useRef, useState } from "react";

/** 목표값으로 RAF cubic-ease 카운트업하는 훅. (page-main.tsx의 RAF 이징과 동일 방식) */
export function useCountUp(target: number, duration = 500) {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);

  useEffect(() => {
    const from = fromRef.current;
    if (from === target) return;

    const startTime = performance.now();
    let raf = 0;
    function step(now: number) {
      const progress = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = from + (target - from) * ease;
      setValue(current);
      fromRef.current = current;
      if (progress < 1) {
        raf = requestAnimationFrame(step);
      } else {
        fromRef.current = target;
      }
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}
