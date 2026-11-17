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

// 유효숫자 4자리 반올림으로 눈금이 겹치지 않도록 max/min이 충분히 커야 한다(상대 눈금 간격 > 5e-4).
export function logTickToValue(tick: number, min: number, max: number): number {
  if (tick <= 0) return min;
  if (tick >= LOG_TICKS) return max;
  return Math.min(
    max,
    Math.max(min, Number((min * Math.exp((Math.log(max / min) * tick) / LOG_TICKS)).toPrecision(4))),
  );
}

// 지수 표기를 포함해 min과 step의 소수 자릿수를 보존한다.
function decimalPlaces(value: number): number {
  const [coefficient, exponent = '0'] = String(value).toLowerCase().split('e');
  return Math.max(0, (coefficient.split('.')[1]?.length ?? 0) - Number(exponent));
}

// 끌기와 버튼 모두 min에서 시작하는 같은 격자에 붙인다. 양 끝값은 그대로 보존한다.
export function linearSliderValue(value: number, min: number, max: number, step: number): number {
  if (value <= min) return min;
  if (value >= max) return max;
  const tick = Math.round((value - min) / step);
  const digits = Math.min(100, Math.max(decimalPlaces(min), decimalPlaces(step)));
  return Math.min(max, Math.max(min, Number((min + tick * step).toFixed(digits))));
}
