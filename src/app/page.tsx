"use client";

import { AppHeader } from "@/components/app-header";
import { AssetsTable } from "@/components/assets-table";
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
        updateCycle="15분 갱신"
      />
      <main className="min-h-screen p-6 md:p-10">
        <AssetsTable data={items} isLoading={isLoading} />
      </main>
    </>
  );
}
