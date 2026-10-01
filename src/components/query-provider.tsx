'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // 신선도 기본값을 두지 않는다. 쿼리는 useEndpoint 하나뿐이고 거기서 cache-config로
  // staleTime·refetchInterval을 매번 정한다. 여기에 값을 두면 신선도의 출처가 둘이 된다.
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
