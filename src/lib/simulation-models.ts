// 라운드는 0부터 last까지다. 끝에 도달한 호출도 마지막 상태를 돌려준다.
// last가 줄어 이미 끝을 넘었다면 현재 round를 보존한다.
export function advanceRound(round: number, last: number) {
  const next = round >= last ? round : round + 1;
  return { round: next, hasNext: next < last };
}

// frames는 시작 상태를 포함한 비어 있지 않은 배열, round는 0 이상의 정수다.
export function trajectoryFrame<T>(frames: readonly T[], round: number): T {
  return frames[Math.min(round, frames.length - 1)];
}

// 0 < min < max인 범위를 로그 등간격 눈금 240개에 대응시킨다.
export const LOG_TICKS = 240;

export function logValueToTick(value: number, min: number, max: number): number {
  return Math.round((LOG_TICKS * Math.log(value / min)) / Math.log(max / min));
}

export function logTickToValue(tick: number, min: number, max: number): number {
  return min * Math.exp((Math.log(max / min) * tick) / LOG_TICKS);
}
