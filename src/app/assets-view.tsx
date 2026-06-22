"use client";

import { AppHeader } from "@/components/app-header";
import { AssetsTable } from "@/components/assets-table";
import { PageMain } from "@/components/page-main";
import { useRelativeTime } from "@/hooks/use-relative-time";
import { useMarket } from "@/hooks/use-market";

export function AssetsView() {
  const { data: market, isLoading, isFetching, refetch } = useMarket();

  const relativeTime = useRelativeTime(market?.fetchedAt);

  return (
    <>
      <AppHeader breadcrumbs={[{ label: "자산 현황" }]} />
      <PageMain onRefresh={refetch} isRefreshing={isFetching}>
        <AssetsTable
          data={market?.items ?? []}
          isLoading={isLoading}
          updatedLabel={relativeTime}
        />
      </PageMain>
    </>
  );
}
