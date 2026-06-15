"use client";

import { AppHeader } from "@/components/app-header";
import { AssetsTable } from "@/components/assets-table";
import { PageMain } from "@/components/page-main";
import { useMarket } from "@/hooks/use-market";

export default function AssetsPage() {
  const { data: market, isLoading } = useMarket();

  const usdkrw =
    market?.find((item) => item.symbol === "USDKRW=X")?.price ?? null;

  const items = (market ?? []).map((item) => {
    if (item.currency === "USD" && item.price !== null && usdkrw !== null)
      return { ...item, priceKrw: item.price * usdkrw };
    return item;
  });

  return (
    <>
      <AppHeader
        breadcrumbs={[{ label: "자산 현황" }]}
      />
      <PageMain>
        <AssetsTable data={items} isLoading={isLoading} />
      </PageMain>
    </>
  );
}
