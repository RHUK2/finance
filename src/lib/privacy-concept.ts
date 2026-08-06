// 프라이버시(주소 재사용·체인분석·CoinJoin) 개념 계산.
// ⚠️ 주소는 bip-concept.ts의 illustrativeAddress를 재사용한 개념 시연용 가짜 값이다.

import { illustrativeAddress } from './bip-concept';

// 라벨 문자열 하나로 항상 같은(결정적인) 주소를 만든다. "같은 사람의 지갑"을 시연할 때 쓴다.
// purpose는 BIP-44 purpose 값(bip-concept.ts의 PURPOSES). 기본값 84'는 Native SegWit(bc1q...)이고,
// 화면에 주소 타입을 함께 표기할 때는 그 타입과 같은 purpose를 넘겨야 접두어가 어긋나지 않는다.
export function walletAddress(label: string, purpose = '84'): string {
  return illustrativeAddress(label, label, purpose);
}

// CoinJoin 익명 집합: 참가자 수만큼 출력이 똑같아 보이면, 외부에서 특정 출력의 주인을 맞힐 확률은 1/N이다.
export function anonymityChance(participants: number): number {
  return 1 / participants;
}
