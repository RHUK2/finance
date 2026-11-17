'use client';

import { useQuery } from '@tanstack/react-query';

import { cacheMs, type EndpointKey } from '@/lib/cache-config';
// 서버 전용 로더 표는 타입만 참조한다. `import type`이라 서버 코드는 따라오지 않는다.
import type { LOADERS } from '@/lib/loaders';

type EndpointData<K extends EndpointKey> = Awaited<ReturnType<(typeof LOADERS)[K]>>;

// 엔드포인트 키 하나로 queryKey·URL·신선도 설정을 모두 파생시키는 공용 쿼리 훅.
// 키 = queryKey = `/api/<key>` 경로 세그먼트 (src/lib/cache-config.ts의 1:1 대응 참조).
export function useEndpoint<K extends EndpointKey>(key: K) {
  return useQuery<EndpointData<K>>({
    queryKey: [key],
    queryFn: async () => {
      const res = await fetch(`/api/${key}`);
      if (!res.ok) throw new Error(`Failed to fetch ${key}`);
      return res.json();
    },
    staleTime: cacheMs(key),
    refetchInterval: cacheMs(key),
  });
}
