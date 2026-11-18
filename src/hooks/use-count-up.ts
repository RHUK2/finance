'use client';

import { useEffect, useRef, useState } from 'react';

/** 목표값으로 RAF cubic-ease 카운트업하는 훅. (lib/scroll.ts의 scrollToTop과 같은 이징) */
export function useCountUp(target: number, duration = 500) {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);

  useEffect(() => {
    const from = fromRef.current;
    if (from === target) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || duration <= 0) {
      let active = true;
      // 동작 줄이기에서도 최종값은 반영한다. 언마운트·목표 교체 시 예약된 반영을 버린다.
      queueMicrotask(() => {
        if (active) {
          fromRef.current = target;
          setValue(target);
        }
      });
      return () => {
        active = false;
      };
    }

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
