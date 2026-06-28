"use client";

import { useState } from "react";
import { Coins, Send } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Pipeline } from "@/components/pipeline";
import { ControlSlider, ExplainCard, Metric, SectionIntro } from "@/components/simulation";
import { cn } from "@/lib/utils";
import {
  FEE_PRESETS,
  formatSats,
  selectCoins,
  type Utxo,
} from "@/lib/tx-concept";

// 프리셋 지갑 — 액면가가 제각각인 동전(UTXO)들. 합계 415,000 sat.
const WALLET: Utxo[] = [
  { id: 1, sats: 200000 },
  { id: 2, sats: 120000 },
  { id: 3, sats: 50000 },
  { id: 4, sats: 30000 },
  { id: 5, sats: 15000 },
];
const WALLET_TOTAL = WALLET.reduce((s, u) => s + u.sats, 0);

export function UtxoModel() {
  const [amount, setAmount] = useState(80000);
  const [feeRate, setFeeRate] = useState<number>(15);

  const { selected, fee, change, enough } = selectCoins(
    WALLET,
    amount,
    feeRate,
    "native",
  );
  const selectedIds = new Set(selected.map((u) => u.id));
  const inputSum = selected.reduce((s, u) => s + u.sats, 0);

  return (
    <div className="flex flex-col gap-4">
      <SectionIntro title="동전을 고른다 (UTXO 모델)">
        비트코인 지갑에는 &lsquo;잔액&rsquo; 숫자 하나가 있는 게 아니라, 받을 때마다
        생긴 <b>동전(UTXO)</b>들이 들어 있다. 송금하려면 동전을 골라 통째로 부숴야 해서,
        보낼 금액보다 큰 동전을 쓰면 나머지가 <b>잔돈</b>으로 내 지갑에 되돌아온다.
        보낼 금액을 바꿔 어떤 동전이 선택되는지 따라가 보자.
      </SectionIntro>

      <Card className="flex flex-col gap-4 p-4">
        <ControlSlider
          icon={<Send className="size-4" />}
          label="보낼 금액"
          value={amount}
          onChange={setAmount}
          min={1000}
          max={WALLET_TOTAL}
          step={1000}
          format={(v) => formatSats(v)}
        />
        <FeeRateToggle value={feeRate} onChange={setFeeRate} />
      </Card>

      <Card className="flex flex-col gap-3 p-4">
        <span className="flex items-center gap-1.5 text-sm font-semibold">
          <Coins className="size-4" />내 지갑의 동전들 (선택된 것만 사용)
        </span>
        <div className="flex flex-col gap-1.5">
          {WALLET.map((u) => {
            const on = selectedIds.has(u.id);
            return (
              <div
                key={u.id}
                className={cn(
                  "flex items-center justify-between rounded-md border px-3 py-2 transition-colors",
                  on
                    ? "border-amber-500/50 bg-amber-500/10"
                    : "border-transparent bg-muted",
                )}
              >
                <span className="text-muted-foreground text-xs">
                  동전 #{u.id}
                </span>
                <span className="font-mono text-sm tabular-nums">
                  {formatSats(u.sats)}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="flex flex-col gap-3 p-4">
        <span className="text-sm font-semibold">고른 동전이 새 동전으로</span>
        <Pipeline
          items={[
            {
              kind: "box",
              label: `입력: 선택된 동전 ${selected.length}개`,
              value: `${selected.map((u) => formatSats(u.sats)).join(" + ")} = ${formatSats(inputSum)}`,
            },
            { kind: "op", label: "트랜잭션 (입력을 부수고 출력을 새로 찍음)" },
            {
              kind: "split",
              boxes: [
                { label: "출력 1 · 받는 사람", value: formatSats(amount), tone: "good" },
                { label: "출력 2 · 잔돈(내게 돌아옴)", value: formatSats(change), tone: "accent" },
              ],
            },
            { kind: "op", label: "남은 차액 = 채굴자 수수료" },
            { kind: "box", label: "수수료", value: formatSats(fee) },
          ]}
        />
      </Card>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Metric label="입력 합계" value={formatSats(inputSum)} />
        <Metric label="송금액" value={formatSats(amount)} tone="good" />
        <Metric label="잔돈" value={formatSats(change)} tone="accent" />
        <Metric label="수수료" value={formatSats(fee)} />
      </div>

      {!enough && (
        <Card className="border-rose-500/40 bg-rose-500/5 p-4 text-sm">
          <span className="font-semibold text-rose-600 dark:text-rose-400">
            잔액 부족
          </span>
          <p className="text-muted-foreground mt-1">
            지갑의 모든 동전을 합쳐도 송금액 + 수수료에 못 미친다. 금액을 줄여 보자.
          </p>
        </Card>
      )}

      <Card className="bg-muted/50 p-4 text-sm">
        <span className="font-mono">수수료 = 입력 합계 − 송금액 − 잔돈</span>
        <p className="text-muted-foreground mt-1 font-mono text-xs tabular-nums">
          {formatSats(fee)} = {formatSats(inputSum)} − {formatSats(amount)} −{" "}
          {formatSats(change)}
        </p>
      </Card>

      <ExplainCard
        title="왜 항상 잔돈이 생길까?"
        body={
          <>
            동전은 쪼개 쓸 수 없고 통째로만 쓸 수 있다. 12만 사토시 동전으로 8만을
            보내면, 나머지는 <b>잔돈 출력</b>으로 새 주소에 되돌려 받는다(그래서 지갑이
            매번 새 주소를 만든다). 잔돈을 만들지 않으면 그 차액이 전부 수수료로 날아가
            버린다.
          </>
        }
      />

      <ExplainCard
        title="계좌 모델 vs UTXO 모델"
        body={
          <>
            은행·이더리움은 <b>계좌 잔액</b>을 더하고 빼는 방식이다. 비트코인은 현금
            지갑처럼 <b>동전(UTXO) 묶음</b>이다 — 지갑 잔액은 그 동전들의 합을 화면에서
            계산해 보여줄 뿐이다. 덕분에 어떤 동전이 어디서 왔는지 추적이 쉽고, 여러
            입력을 병렬로 검증할 수 있다.
          </>
        }
      />

      <p className="text-muted-foreground text-xs">
        입력/출력 vByte는 타입별 대표 근사값이다(서명 길이에 따라 ±1~2 vB 변동). 수수료
        계산식 자체는 실제와 같다. 이 탭은 Native SegWit 주소를 가정한다.
      </p>
    </div>
  );
}

function FeeRateToggle({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">수수료율 (멤풀 혼잡도)</span>
      <div className="flex overflow-hidden rounded-md border">
        {FEE_PRESETS.map((p) => (
          <button
            key={p.rate}
            onClick={() => onChange(p.rate)}
            className={cn(
              "flex-1 px-2 py-1.5 text-sm transition-colors",
              value === p.rate
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted",
            )}
          >
            {p.label} · {p.rate} sat/vB
          </button>
        ))}
      </div>
    </div>
  );
}
