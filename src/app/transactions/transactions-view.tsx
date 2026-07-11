"use client";

import { AppHeader } from "@/components/app-header";
import { PageMain } from "@/components/page-main";
import { SimTabs } from "@/components/simulation";

import { AddressCompare } from "./address-compare";
import { FeeCalc } from "./fee-calc";
import { UtxoModel } from "./utxo-model";

const TABS = [
  { value: "utxo", label: "① 동전 고르기 (UTXO)", node: <UtxoModel /> },
  { value: "fee", label: "② 크기가 수수료다", node: <FeeCalc /> },
  { value: "compare", label: "③ 주소 타입별 수수료", node: <AddressCompare /> },
];

export function TransactionsView() {
  return (
    <>
      <AppHeader breadcrumbs={[{ label: "트랜잭션 해부" }]} />
      <PageMain>
        <div className="mx-auto flex max-w-5xl flex-col gap-4">
          <div>
            <h1 className="text-xl font-semibold">
              비트코인은 어떻게 돈을 보낼까? UTXO와 수수료
            </h1>
            <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
              지갑에서 만든 주소로 코인이 들어오면, 그 코인은 &#39;잔액&#39;이 아니라
              액면가가 정해진 <b>동전(UTXO)</b> 묶음으로 쌓인다. 송금이란 이 동전들을
              골라 새 동전으로 다시 찍어내는 일이고, 그때 내는 수수료는 보내는 금액이
              아니라 <b>트랜잭션의 크기(vByte)</b>로 정해진다. 동전을 고르고, 크기가
              수수료가 되고, 주소 타입이 수수료를 좌우하는 과정을 직접 만져보자.
            </p>
          </div>

          <SimTabs tabs={TABS} defaultValue="utxo" />
        </div>
      </PageMain>
    </>
  );
}
