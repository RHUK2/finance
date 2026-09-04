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

// 끝이 미리 정해진 궤적을 0부터 last까지 라운드 단위로 재생한다. 재생 타이밍은
// useRoundEngine이 맡고, 여기서는 지금 몇 번째를 보고 있는지만 관리한다.
//
// 궤적이 프레임 배열로 나오면 useTrajectoryPlayer를 쓰고, 라운드 번호에서 값을
// 계산해 내는 시뮬레이션(가십 전파의 홉 거리, IBD의 진행률, HTLC의 단계)은 이 훅을
// 직접 쓴다. 둘을 가른 이유는 후자가 프레임 배열을 만들 일이 없기 때문이고, 가르기
// 전에는 세 곳이 아래 step을 그대로 손으로 복제하고 있었다.
//
// last가 바뀌어도 round를 되돌리지 않는다. 파라미터를 바꿔 궤적을 다시 계산할 때
// 처음부터 보여 주는 것은 호출부가 key로 리마운트해서 처리한다.
export function useTrajectory(last: number, speedMs: number) {
  const [round, setRound] = useState(0);

  // 다음 라운드로 한 칸. 남은 라운드가 있는지 동기적으로 반환해 엔진이 종료를 판단한다.
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

  return { round, last, done: round >= last, step, seek, engine };
}

// 미리 계산해 둔 프레임 배열을 재생한다. 결정론적 캐스케이드 넷(채택, 홀더 딜레마,
// 자연의 파워 프로젝션, 강제청산 연쇄)이 공유하는 배선으로, useTrajectory에 지금
// 프레임 조회만 얹은 것이다. CascadeStage에 그대로 넘길 수 있다.
export function useTrajectoryPlayer<T>(frames: T[], speedMs: number) {
  const player = useTrajectory(frames.length - 1, speedMs);
  return { ...player, frame: frames[player.round] };
}
