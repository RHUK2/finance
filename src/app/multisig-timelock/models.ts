export type LockType = 'cltv' | 'csv';

type Lock =
  | { type: 'cltv'; currentHeight: number; unlockHeight: number }
  | { type: 'csv'; confirmations: number; requiredBlocks: number };

// CLTV는 팁 높이, CSV는 포함 블록을 1로 센 확인 수다.
// nLockTime < 다음 블록 높이, 코인 높이 + sequence <= 다음 블록 높이를 판정한다.
export function canSpendInNextBlock(lock: Lock): boolean {
  return lock.type === 'cltv' ? lock.currentHeight >= lock.unlockHeight : lock.confirmations >= lock.requiredBlocks;
}
