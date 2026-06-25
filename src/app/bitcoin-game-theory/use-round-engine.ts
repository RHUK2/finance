"use client";

import { useEffect, useRef, useState } from "react";

// 라운드형 시뮬레이션(채택 캐스케이드·홀더 딜레마)의 재생 타이밍을 관리한다.
// step()은 한 라운드 진행 후 "계속할 게 남았는가"를 boolean으로 반환한다.
// false면 자동으로 일시정지한다.
export function useRoundEngine(step: () => boolean, speedMs: number) {
  const [playing, setPlaying] = useState(false);
  const stepRef = useRef(step);

  // 최신 step 클로저를 effect 재실행 없이 유지 (render 중 ref 접근 회피).
  useEffect(() => {
    stepRef.current = step;
  });

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      if (!stepRef.current()) setPlaying(false);
    }, speedMs);
    return () => clearInterval(id);
  }, [playing, speedMs]);

  return {
    playing,
    toggle: () => setPlaying((p) => !p),
    pause: () => setPlaying(false),
  };
}
