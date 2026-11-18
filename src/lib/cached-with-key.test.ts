import { afterEach, expect, it, vi } from 'vitest';

import { cachedWithKey } from './cached-with-key';

vi.mock('./cache', () => ({ cached: (_key: string, fetcher: () => Promise<unknown>) => fetcher() }));
afterEach(() => vi.unstubAllEnvs());

it('각 엔드포인트는 짝이 맞는 환경변수를 읽는다', async () => {
  vi.stubEnv('FRED_API_KEY', 'fred-test');
  vi.stubEnv('ECOS_API_KEY', 'ecos-test');
  const fetcher = vi.fn(async (apiKey: string) => ({ available: true as const, fetchedAt: 'now', apiKey }));
  await cachedWithKey('fred', 'FRED_API_KEY', fetcher);
  await cachedWithKey('inflation-data', 'FRED_API_KEY', fetcher);
  await cachedWithKey('inflation-data-kr', 'ECOS_API_KEY', fetcher);
  expect(fetcher.mock.calls).toEqual([['fred-test'], ['fred-test'], ['ecos-test']]);
});

it('키가 없으면 fetcher를 부르지 않고 unavailable을 반환한다', async () => {
  vi.stubEnv('FRED_API_KEY', '');
  const fetcher = vi.fn(async () => ({ available: true as const, fetchedAt: 'now' }));
  expect(await cachedWithKey('fred', 'FRED_API_KEY', fetcher)).toMatchObject({ available: false });
  expect(fetcher).not.toHaveBeenCalled();
});

// 호출하지 않는 함수 본문도 tsc가 검사한다.
function invalidPairs() {
  const fetcher = async () => ({ available: true as const, fetchedAt: 'now' });
  // @ts-expect-error FRED 엔드포인트에 ECOS 키를 쓸 수 없다.
  void cachedWithKey('fred', 'ECOS_API_KEY', fetcher);
  // @ts-expect-error ECOS 엔드포인트에 FRED 키를 쓸 수 없다.
  void cachedWithKey('inflation-data-kr', 'FRED_API_KEY', fetcher);
  // @ts-expect-error 키를 쓰지 않는 엔드포인트는 이 헬퍼 대상이 아니다.
  void cachedWithKey('market', 'FRED_API_KEY', fetcher);
}
void invalidPairs;
