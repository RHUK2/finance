import { afterEach, describe, expect, it, vi } from 'vitest';

import { serveEndpoint } from './serve';

afterEach(() => vi.restoreAllMocks());

describe('serveEndpoint', () => {
  it.each(['http', 'https'])('로그 인자와 응답에 %s URL이나 원본 오류를 노출하지 않는다', async (protocol) => {
    const url = `${protocol}://provider.test/private-key?api_key=secret`;
    const cause = Object.assign(new Error(`private cause ${url}`), { code: 'ENOTFOUND' });
    const error = new TypeError(`fetch failed ${url}`, { cause });
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const response = await serveEndpoint('market', vi.fn().mockRejectedValue(error), '데이터를 불러오지 못했습니다');
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: '데이터를 불러오지 못했습니다' });
    expect(log).toHaveBeenCalledExactlyOnceWith(
      'market fetch error:',
      'TypeError: fetch failed <url> (cause.code: ENOTFOUND)',
    );
    for (const arg of log.mock.calls.flat()) {
      expect(typeof arg).toBe('string');
      expect(arg).not.toContain(url);
      expect(arg).not.toMatch(/https?:\/\/|private-key|api_key|secret|private cause/);
    }
  });
});
