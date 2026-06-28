"use client";

import { AppHeader } from "@/components/app-header";
import { PageMain } from "@/components/page-main";
import { Card } from "@/components/ui/card";
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
              비트코인은 어떻게 돈을 보낼까 — UTXO와 수수료
            </h1>
            <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
              지갑에서 만든 주소로 코인이 들어오면, 그 코인은 &lsquo;잔액&rsquo;이 아니라
              액면가가 정해진 <b>동전(UTXO)</b> 묶음으로 쌓인다. 송금이란 이 동전들을
              골라 새 동전으로 다시 찍어내는 일이고, 그때 내는 수수료는 보내는 금액이
              아니라 <b>트랜잭션의 크기(vByte)</b>로 정해진다. 동전을 고르고, 크기가
              수수료가 되고, 주소 타입이 수수료를 좌우하는 과정을 직접 만져보자.
            </p>
          </div>

          <Card className="gap-1.5 p-4 text-sm leading-relaxed">
            <span className="font-semibold">한 줄 정리</span>
            <ul className="text-muted-foreground list-disc space-y-1 pl-4">
              <li>
                <b>UTXO 모델</b> — 계좌 잔액이 없다. 동전을 통째로 써야 해서 거의 항상
                <b> 잔돈(change)</b>이 되돌아온다. <code className="font-mono">수수료 = 입력
                합계 − 송금액 − 잔돈</code>.
              </li>
              <li>
                <b>수수료 = 크기 × 수수료율</b> — <code className="font-mono">vByte × sat/vB</code>.
                금액과 무관하다. 블록 공간을 두고 벌이는 경매라서 혼잡하면 비싸진다.
              </li>
              <li>
                <b>주소 타입</b> — SegWit·Taproot는 같은 송금도 크기가 작아 수수료가 싸다.
                지갑 키 생성에서 고른 purpose(44&apos;/49&apos;/84&apos;/86&apos;)가 결국 이
                차이로 이어진다.
              </li>
            </ul>
          </Card>

          <SimTabs tabs={TABS} defaultValue="utxo" />
        </div>
      </PageMain>
    </>
  );
}
