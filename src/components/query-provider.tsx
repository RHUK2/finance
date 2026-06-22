"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 엔드포인트별 staleTime·refetchInterval은 각 훅이 cache-config에서
            // 파생해 지정한다. 전역 폴링을 두면 빠른 엔드포인트의 신선도가 묻히므로
            // 여기서는 안전한 fallback staleTime만 둔다.
            staleTime: 15 * 60 * 1000,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
