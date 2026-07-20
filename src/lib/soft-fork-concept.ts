// 소프트포크 활성화(BIP9/BIP8) 개념 계산.
// ⚠️ 실제 신호 기간은 2016블록(약 2주)이고 타임아웃도 수개월~수년 단위다. 여기서는 여러 기간을
// 몇 초 만에 재생할 수 있도록 기간 수·신호 표본을 크게 단순화했다. 임계값(95%)과 상태 전이 규칙
// (STARTED → LOCKED_IN → ACTIVE, 또는 타임아웃 시 FAILED)은 BIP9 실제 규칙 그대로다.

export type Bip9State = 'STARTED' | 'LOCKED_IN' | 'ACTIVE' | 'FAILED';

export const SIGNAL_THRESHOLD = 0.95; // 메인넷 기준 임계값
export const MAX_PERIODS = 8; // 시연용 타임아웃 기간 수

// 한 기간 동안 채굴자 지지율(supportRate)에 표본 변동을 더해, 실제 관측되는 신호 비율을 흉내낸다.
export function epochSignalRatio(supportRate: number, rng: () => number): number {
  const jitter = (rng() - 0.5) * 0.04; // ±2%p 안팎의 자연스러운 표본 변동
  return Math.max(0, Math.min(1, supportRate + jitter));
}

export function nextBip9State(state: Bip9State, ratio: number, periodIndex: number): Bip9State {
  if (state === 'STARTED') {
    if (ratio >= SIGNAL_THRESHOLD) return 'LOCKED_IN';
    if (periodIndex >= MAX_PERIODS) return 'FAILED';
    return 'STARTED';
  }
  if (state === 'LOCKED_IN') return 'ACTIVE';
  return state;
}

export const BIP9_STATE_LABEL: Record<Bip9State, string> = {
  STARTED: '신호 수집 중',
  LOCKED_IN: '확정(다음 기간부터 강제)',
  ACTIVE: '활성화됨',
  FAILED: '실패(타임아웃)',
};
