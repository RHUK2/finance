import { describe, expect, it } from 'vitest';

import { bcra, deterred, ratioLabel } from './bcra';

describe('bcra', () => {
  it('이득 ÷ 비용이고 1 미만이면 방어 성공', () => {
    expect(bcra(1, 4)).toBe(0.25);
    expect(deterred(0.99)).toBe(true);
    expect(deterred(1)).toBe(false);
  });
});

// 티켓 106: 구간은 반올림한 값으로 고른다. 같은 크기가 두 모양으로 찍히지 않는다.
describe('ratioLabel', () => {
  it.each([
    [9.94, '9.9배'],
    [9.96, '10배'],
    [10, '10배'],
    [123.4, '123배'],
    [0.0996, '0.1배'],
    [0.1, '0.1배'],
    [0.03, '0.03배'],
  ])('%d → %s', (ratio, label) => {
    expect(ratioLabel(ratio)).toBe(label);
  });
});
