'use client';

import { useQuery } from '@tanstack/react-query';

import { cacheMs, type EndpointKey } from '@/lib/cache-config';
// 서버 전용 로더 표는 타입만 참조한다. `import type`이라 서버 코드는 따라오지 않는다.
import type { LOADERS } from '@/lib/loaders';

type EndpointData<K extends EndpointKey> = Awaited<ReturnType<(typeof LOADERS)[K]>>;

// HTTP 실패 응답을 오류로 조립한다. JSON이 아니어도 키·상태 코드는 유지한다.
export async function responseError(key: EndpointKey, res: Response): Promise<Error> {
  const body: unknown = await res.json().catch(() => null);
  const detail =
    body && typeof body === 'object' && 'error' in body && typeof body.error === 'string' ? `: ${body.error}` : '';
  return new Error(`Failed to fetch ${key} (HTTP ${res.status})${detail}`);
}

// 엔드포인트 키 하나로 queryKey·URL·신선도 설정을 모두 파생시키는 공용 쿼리 훅.
// 키 = queryKey = `/api/<key>` 경로 세그먼트 (src/lib/cache-config.ts의 1:1 대응 참조).
export function useEndpoint<K extends EndpointKey>(key: K) {
  return useQuery<EndpointData<K>>({
    queryKey: [key],
    queryFn: async ({ signal }) => {
      const res = await fetch(`/api/${key}`, { signal });
      if (!res.ok) throw await responseError(key, res);
      return res.json();
    },
    staleTime: cacheMs(key),
    refetchInterval: cacheMs(key),
  });
}
