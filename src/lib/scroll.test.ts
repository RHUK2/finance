import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { scrollToTop } from './scroll';

let browser: EventTarget & {
  scrollY: number;
  scrollTo: ReturnType<typeof vi.fn>;
  matchMedia: ReturnType<typeof vi.fn>;
};
let frames: Map<number, FrameRequestCallback>;

beforeEach(() => {
  frames = new Map();
  let next = 0;
  browser = Object.assign(new EventTarget(), {
    scrollY: 900,
    scrollTo: vi.fn(),
    matchMedia: vi.fn(() => ({ matches: false })),
  });
  vi.stubGlobal('window', browser);
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn((fn: FrameRequestCallback) => {
      frames.set(++next, fn);
      return next;
    }),
  );
  vi.stubGlobal(
    'cancelAnimationFrame',
    vi.fn((id: number) => frames.delete(id)),
  );
});
afterEach(() => {
  browser.dispatchEvent(new Event('wheel'));
  vi.unstubAllGlobals();
});

describe('scrollToTop', () => {
  it('재호출은 앞 루프를 취소하고 입력은 남은 루프를 멈춘다', () => {
    scrollToTop();
    scrollToTop();
    expect(frames.size).toBe(1);
    expect(frames.has(1)).toBe(false);
    browser.dispatchEvent(new Event('wheel'));
    expect(frames.size).toBe(0);
    scrollToTop();
    browser.dispatchEvent(new Event('touchstart'));
    expect(frames.size).toBe(0);
  });
  it('동작 줄이기는 프레임 없이 최종 위치로 간다', () => {
    browser.matchMedia.mockReturnValue({ matches: true });
    scrollToTop();
    expect(frames.size).toBe(0);
    expect(browser.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'instant' });
  });
});
