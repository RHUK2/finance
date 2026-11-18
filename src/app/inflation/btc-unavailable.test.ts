import { expect, it } from 'vitest';
import { btcUnavailableReason } from './btc-unavailable';

const ready = { hasPrices: false, isPending: false, isError: false, needsFx: false, hasFx: false };

it('환산 시세가 있으면 pending·실패 상태에서도 사유가 없다', () => {
  expect(
    btcUnavailableReason({ ...ready, hasPrices: true, isPending: true, isError: true, needsFx: true }),
  ).toBeUndefined();
});

it('pending은 환율 누락보다 먼저 로딩으로 안내한다', () => {
  expect(btcUnavailableReason({ ...ready, isPending: true, needsFx: true })).toBe('비트코인 시세를 불러오는 중…');
});

it('요청 실패는 환율 누락보다 먼저 안내한다', () => {
  expect(btcUnavailableReason({ ...ready, isError: true, needsFx: true })).toBe('비트코인 시세를 받지 못했다');
});

it('한국에서 환율이 없을 때만 원화 환산 불가 사유를 안내한다', () => {
  expect(btcUnavailableReason({ ...ready, needsFx: true })).toBe(
    '환율 데이터가 없어 비트코인 원화 시세를 계산하지 못했다',
  );
  expect(btcUnavailableReason({ ...ready, needsFx: true, hasFx: true })).toBe('비트코인 시세 데이터가 없다');
  expect(btcUnavailableReason(ready)).toBe('비트코인 시세 데이터가 없다');
});
