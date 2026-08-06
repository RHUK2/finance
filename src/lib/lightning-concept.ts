// 라이트닝 네트워크(결제 채널·HTLC) 개념 계산.
// ⚠️ 해시는 개념 시연용 결정적 값(illustrative)이다. bip-concept.ts의 illustrativeHex를 그대로 쓴다.

import { illustrativeHex } from './bip-concept';

// preimage(R) → payment hash(H). 실제로는 SHA-256(32바이트)이지만 여기선 결정적 가짜 해시를 쓴다.
export function paymentHash(preimage: string): string {
  return illustrativeHex('htlc:' + preimage, 64);
}

// 첫 렌더용 고정 preimage. 렌더 경로에서 Math.random을 쓰면 SSR 결과와 클라이언트
// 결과가 어긋나므로(하이드레이션 불일치), 초깃값은 결정적 값으로 두고 재생성은
// 클라이언트 이벤트에서만 한다(bip-concept.ts의 randomEntropyHex와 같은 규칙).
export const INITIAL_PREIMAGE = illustrativeHex('preimage:initial', 64);

// 무작위 preimage 32바이트 (재설정 버튼용, 클라이언트 이벤트에서만 호출).
export function randomPreimage(): string {
  let out = '';
  for (let i = 0; i < 64; i++) out += Math.floor(Math.random() * 16).toString(16);
  return out;
}

export type ChannelState = {
  aliceSats: number;
  bobSats: number;
  updateCount: number;
};

export function openChannel(fundingSats: number): ChannelState {
  return { aliceSats: fundingSats / 2, bobSats: fundingSats / 2, updateCount: 0 };
}

// 오프체인 이체: 채널 잔액만 옮기고 새 커밋먼트 tx로 교체한다(온체인 tx는 발생하지 않는다).
export function payOffchain(state: ChannelState, fromAlice: boolean, amountSats: number): ChannelState {
  const amount = Math.min(amountSats, fromAlice ? state.aliceSats : state.bobSats);
  return {
    aliceSats: state.aliceSats + (fromAlice ? -amount : amount),
    bobSats: state.bobSats + (fromAlice ? amount : -amount),
    updateCount: state.updateCount + 1,
  };
}

export const HTLC_HOPS = ['Alice', 'Carol(중계)', 'Bob'] as const;
