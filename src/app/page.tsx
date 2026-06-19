"use client";

import { AppHeader } from "@/components/app-header";
import { AssetsTable } from "@/components/assets-table";
import { PageMain } from "@/components/page-main";
import { useRelativeTime } from "@/hooks/use-relative-time";
import { useMarket } from "@/hooks/use-market";

export default function AssetsPage() {
  const { data: market, isLoading, isFetching, refetch } = useMarket();

  const usdkrw =
    market?.items.find((item) => item.symbol === "USDKRW=X")?.price ?? null;

  const items = (market?.items ?? []).map((item) => {
    if (item.currency === "USD" && item.price !== null && usdkrw !== null)
      return { ...item, priceKrw: item.price * usdkrw };
    return item;
  });

  const relativeTime = useRelativeTime(market?.fetchedAt);

  return (
    <>
      <AppHeader breadcrumbs={[{ label: "자산 현황" }]} />
      <PageMain onRefresh={refetch} isRefreshing={isFetching}>
        <AssetsTable
          data={items}
          isLoading={isLoading}
          updatedLabel={relativeTime}
        />
      </PageMain>
    </>
  );
}
