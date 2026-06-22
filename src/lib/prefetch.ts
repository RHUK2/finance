import { dehydrate, QueryClient } from "@tanstack/react-query";
import { headers } from "next/headers";

import { cacheSeconds, type EndpointKey } from "./cache-config";

/**
 * 서버에서 ISR 캐시를 읽어 TanStack Query 캐시를 미리 채운 뒤 dehydrate한다.
 *
 * 각 페이지(server component)가 자신이 쓰는 엔드포인트 키를 넘기면, 첫 페인트가
 * ISR 캐시값으로 채워져 스켈레톤 플래시 없이 렌더된다. dehydrated 데이터의
 * `dataUpdatedAt`이 최신이라 클라이언트는 hydration 직후 즉시 refetch하지 않고
 * 이후 `refetchInterval`로 폴링만 이어받는다.
 *
 * 엔드포인트 키 = queryKey = `/api/<key>` 경로 세그먼트로 1:1 대응한다.
 * prefetch가 실패한 쿼리는 dehydrate에서 제외되어 클라이언트가 평소처럼 fetch한다.
 */
export async function prefetchEndpoints(keys: EndpointKey[]) {
  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  const base = `${proto}://${host}`;

  const queryClient = new QueryClient();

  await Promise.all(
    keys.map((key) =>
      queryClient.prefetchQuery({
        queryKey: [key],
        queryFn: async () => {
          const res = await fetch(`${base}/api/${key}`, {
            next: { revalidate: cacheSeconds(key) },
          });
          if (!res.ok) throw new Error(`Failed to prefetch ${key}`);
          return res.json();
        },
      }),
    ),
  );

  return dehydrate(queryClient);
}
