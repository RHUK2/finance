// 블록 헤더·채굴·난이도 조정 개념 시연용 순수 계산 함수.
// ⚠️ script-concept.ts와 같은 방식: 헤더 해시는 실제 SHA-256d가 아니라
// 그럴듯하게 보이는 결정적 값(illustrative)이며, 실제 채굴 연산이 아니다.

import { illustrativeHex } from './bip-concept';
import { clamp } from './utils';

export type BlockHeader = {
  version: number;
  prevHash: string;
  merkleRoot: string;
  timestamp: number; // unix seconds
  bits: string; // 압축 난이도 목표 표기 (실제 형식 근사)
  nonce: number;
};

// 840,000번째 블록(2024 반감기) 근처를 흉내 낸 샘플 헤더. nonce만 시연에서 바뀐다.
export const SAMPLE_HEADER: Omit<BlockHeader, 'nonce'> = {
  version: 0x20000000,
  prevHash: illustrativeHex('prevblock:840000', 64),
  merkleRoot: illustrativeHex('merkle:840000', 64),
  timestamp: 1713571533,
  bits: '17053894',
};

// nonce를 뺀 5개 필드를 미리 직렬화해 둔 접두어. 채굴 루프처럼 nonce만 바꿔가며
// 반복 해시할 때, 매 시도마다 헤더 객체를 새로 만들지 않고 이 접두어에 nonce만 이어붙이면 된다.
export function blockHeaderPrefix(header: Omit<BlockHeader, 'nonce'>): string {
  return [header.version, header.prevHash, header.merkleRoot, header.timestamp, header.bits].join('|');
}

// 접두어 + nonce로 블록 해시를 계산한다 (SHA-256을 두 번 먹이는 실제 규칙의 근사).
export function hashWithNonce(prefix: string, nonce: number): string {
  return illustrativeHex('blockhash:' + prefix + '|' + nonce, 64);
}

// 헤더 6개 필드를 직렬화해 결정적 해시를 만든다. 반복 호출하는 채굴 루프에서는
// blockHeaderPrefix + hashWithNonce를 대신 써서 매번 접두어를 다시 만들지 않는 게 낫다.
export function illustrativeBlockHash(header: BlockHeader): string {
  return hashWithNonce(blockHeaderPrefix(header), header.nonce);
}

// 해시 앞자리가 leadingZeros개 연속 '0'인지 (난이도 목표를 16진 자릿수로 단순화).
export function meetsTarget(hash: string, leadingZeros: number): boolean {
  return hash.slice(0, leadingZeros) === '0'.repeat(leadingZeros);
}

// leadingZeros 자리 목표를 맞추는 데 평균적으로 필요한 시도 횟수 (16^n, 기하분포 기댓값).
export function expectedTries(leadingZeros: number): number {
  return Math.pow(16, leadingZeros);
}

export const TARGET_RETARGET_DAYS = 14; // 2016블록 × 10분 = 20,160분 = 14일

// 난이도 조정: 목표 기간(14일) ÷ 실제 걸린 기간의 배율로 난이도를 바꾸되,
// 프로토콜 규칙대로 조정 폭을 ±4배로 제한한다.
export function retargetMultiplier(actualDays: number): number {
  return clamp(TARGET_RETARGET_DAYS / actualDays, 0.25, 4);
}
