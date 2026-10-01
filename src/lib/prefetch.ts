import 'server-only';

import { dehydrate, QueryClient } from '@tanstack/react-query';
import { connection } from 'next/server';

import { type EndpointKey } from './cache-config';
import { LOADERS } from './loaders';

/**
 * 서버에서 로더(→Upstash 공유 캐시)를 읽어 TanStack Query 캐시를 미리 채운 뒤 dehydrate한다.
 *
 * 각 페이지(server component)가 자신이 쓰는 엔드포인트 키를 넘기면, 첫 페인트가
 * 공유 캐시값으로 채워져 스켈레톤 플래시 없이 렌더된다. dehydrated 데이터의
 * `dataUpdatedAt`은 서버가 로더를 읽은 시각이라 클라이언트는 hydration 직후 다시 받지 않고,
 * 그 시각부터 `refetchInterval`을 센다(서버 항목의 `freshUntil`과 위상은 맞추지 않는다).
 *
 * 라우트를 HTTP로 다시 부르지 않고 라우트와 같은 로더를 직접 부른다. 자기 호출은 요청마다
 * 함수 호출을 키 수만큼 더 만들고, 요청의 Host 헤더로 서버가 fetch할 주소를 정하게 된다.
 * 로더가 같은 `cached(key, fetcher)`를 거치므로 라우트와 같은 공유 캐시 한 벌을 읽는다.
 *
 * 페이지가 요청 시점에 렌더되도록 `connection()`을 먼저 기다린다. 헤더를 읽던 때는 그것이
 * 페이지를 동적으로 만들었는데, 로더는 요청 정보를 쓰지 않으므로 빌드 때 한 번 그려 굳힐 수 있다.
 *
 * prefetch가 실패한 쿼리는 dehydrate에서 제외되어 클라이언트가 평소처럼 fetch한다.
 */
export async function prefetchEndpoints(keys: EndpointKey[]) {
  await connection();

  const queryClient = new QueryClient();

  await Promise.all(
    keys.map((key) =>
      queryClient.prefetchQuery({
        queryKey: [key],
        queryFn: async () => {
          try {
            return await LOADERS[key]();
          } catch (error) {
            // prefetchQuery는 오류를 삼킨다. 라우트와 같은 접두사로 남겨 두지 않으면 서버 쪽 실패가 보이지 않는다.
            console.error(`${key} prefetch error:`, error);
            throw error;
          }
        },
      }),
    ),
  );

  return dehydrate(queryClient);
}
