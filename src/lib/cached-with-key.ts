import 'server-only';

import { cached } from './cache';

// 키 기반 엔드포인트와 제공처 환경변수의 짝은 여기서만 정한다.
type ApiKeyEnv = {
  fred: 'FRED_API_KEY';
  'inflation-data': 'FRED_API_KEY';
  'inflation-data-kr': 'ECOS_API_KEY';
};

type UnavailableData = { fetchedAt: string; available: false };

export async function cachedWithKey<K extends keyof ApiKeyEnv, T extends { fetchedAt: string; available: true }>(
  key: K,
  envName: ApiKeyEnv[NoInfer<K>],
  fetcher: (apiKey: string) => Promise<T>,
): Promise<T | UnavailableData> {
  // 키 부재는 데이터가 아니라 설정 상태다. 500 대신 available: false를 돌려줘
  // 해당 데이터 없이도 페이지를 그린다. cached() 안에서 반환하면 키를 넣고 배포해도
  // TTL 동안 안내가 남으므로, 캐시를 읽거나 쓰기 전에 여기서 반환한다.
  const apiKey = process.env[envName];
  if (!apiKey) return { fetchedAt: new Date().toISOString(), available: false };

  return cached(key, () => fetcher(apiKey));
}
