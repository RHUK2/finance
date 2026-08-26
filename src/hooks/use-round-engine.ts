'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// 스텝형 시뮬레이션의 재생 타이밍을 관리한다.
// step()은 한 스텝 진행 후 "계속할 게 남았는가"를 boolean으로 반환한다.
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

// 미리 계산해 둔 프레임 배열을 라운드 단위로 재생한다. 결정론적 캐스케이드 넷(채택,
// 홀더 딜레마, 자연의 파워 프로젝션, 강제청산 연쇄)이 공유하는 배선이다. 재생 타이밍은
// useRoundEngine이 맡고, 여기서는 지금 몇 번째 프레임을 보고 있는지만 관리한다.
//
// frames가 바뀌어도 round를 되돌리지 않는다. 파라미터를 바꿔 궤적을 다시 계산할 때
// 처음부터 보여 주는 것은 호출부가 key로 리마운트해서 처리한다. 네 곳 모두 그렇게 한다.
export function useTrajectoryPlayer<T>(frames: T[], speedMs: number) {
  const last = frames.length - 1;
  const [round, setRound] = useState(0);

  // 다음 프레임으로 한 칸. 남은 프레임이 있는지 동기적으로 반환해 엔진이 종료를 판단한다.
  const step = useCallback(() => {
    if (round >= last) return false;
    setRound(round + 1);
    return round + 1 < last;
  }, [round, last]);

  const engine = useRoundEngine(step, speedMs);

  const seek = useCallback(
    (r: number) => {
      engine.pause();
      setRound(r);
    },
    [engine],
  );

  return { round, last, frame: frames[round], done: round >= last, step, seek, engine };
}
