import { describe, expect, it } from 'vitest';

import { openChannel, payOffchain } from './lightning-concept';

// 티켓 21: 잔액을 넘는 송금은 거절하고 업데이트 횟수를 올리지 않는다. 채널 총량은 보존된다.
describe('payOffchain', () => {
  it('30만 sat을 다섯 번 보내면 세 번만 옮겨지고 총량은 그대로다', () => {
    let s = openChannel(2_000_000);
    expect(s).toEqual({ aliceSats: 1_000_000, bobSats: 1_000_000, updateCount: 0 });
    for (let i = 0; i < 5; i++) {
      s = payOffchain(s, true, 300_000);
      expect(s.aliceSats + s.bobSats).toBe(2_000_000);
      expect(s.aliceSats).toBeGreaterThanOrEqual(0);
    }
    expect(s).toEqual({ aliceSats: 100_000, bobSats: 1_900_000, updateCount: 3 });
  });

  it('남은 잔액을 정확히 보내면 네 번째 업데이트가 된다', () => {
    let s = openChannel(2_000_000);
    for (let i = 0; i < 3; i++) s = payOffchain(s, true, 300_000);
    s = payOffchain(s, true, 100_000);
    expect(s).toEqual({ aliceSats: 0, bobSats: 2_000_000, updateCount: 4 });
  });

  it('0 이하 금액은 거절한다', () => {
    const s = openChannel(1_000);
    expect(payOffchain(s, true, 0)).toBe(s);
    expect(payOffchain(s, false, -10)).toBe(s);
  });

  it('반대 방향도 같다', () => {
    const s = payOffchain(openChannel(2_000_000), false, 1_000_001);
    expect(s.updateCount).toBe(0);
    expect(payOffchain(openChannel(2_000_000), false, 1_000_000)).toEqual({
      aliceSats: 2_000_000,
      bobSats: 0,
      updateCount: 1,
    });
  });
});
