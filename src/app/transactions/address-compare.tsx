"use client";

import { useState } from "react";
import { Ruler } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ControlSlider,
  ExplainCard,
  Field,
  SectionIntro,
} from "@/components/simulation";
import { cn } from "@/lib/utils";
import {
  ADDR_TYPES,
  feeSats,
  formatSats,
  txVBytes,
} from "@/lib/tx-concept";

export function AddressCompare() {
  const [numIn, setNumIn] = useState(2);
  const [numOut, setNumOut] = useState(2);
  const [feeRate, setFeeRate] = useState(15);

  const legacyVb = txVBytes("legacy", numIn, numOut);
  const legacyFee = feeSats(legacyVb, feeRate);

  const rows = ADDR_TYPES.map((t) => {
    const vb = txVBytes(t.value, numIn, numOut);
    const fee = feeSats(vb, feeRate);
    return {
      ...t,
      vb,
      fee,
      saving: t.value === "legacy" ? 0 : 1 - fee / legacyFee,
      width: (vb / legacyVb) * 100,
    };
  });

  return (
    <div className="flex flex-col gap-4">
      <SectionIntro title="주소 타입이 수수료를 좌우한다">
        같은 송금(같은 입력·출력 개수)이라도 주소 타입에 따라 트랜잭션 크기가 달라
        수수료가 달라진다. 지갑 키 생성에서 고른 purpose(44&apos;/49&apos;/84&apos;/86&apos;)가
        결국 이 차이로 이어진다. 입력·출력 개수를 바꿔 절감 폭을 비교해 보자.
      </SectionIntro>

      <Card className="grid grid-cols-2 gap-4 p-4">
        <Field label="입력 개수">
          <Input
            type="number"
            min={1}
            value={numIn}
            onChange={(e) => setNumIn(Math.max(1, Number(e.target.value) || 1))}
          />
        </Field>
        <Field label="출력 개수">
          <Input
            type="number"
            min={1}
            value={numOut}
            onChange={(e) => setNumOut(Math.max(1, Number(e.target.value) || 1))}
          />
        </Field>
      </Card>

      <Card className="p-4">
        <ControlSlider
          icon={<Ruler className="size-4" />}
          label="수수료율 (멤풀 혼잡도)"
          value={feeRate}
          onChange={setFeeRate}
          min={1}
          max={120}
          step={1}
          format={(v) => `${v} sat/vB`}
        />
      </Card>

      <Card className="flex flex-col gap-3 p-4">
        <span className="text-sm font-semibold">타입별 크기·수수료 (Legacy 기준 비교)</span>
        <div className="flex flex-col gap-3">
          {rows.map((r) => (
            <div key={r.value} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-medium">
                  <span className="text-muted-foreground font-mono text-xs">
                    {r.purpose}{" "}
                  </span>
                  {r.label}
                </span>
                <span className="text-muted-foreground font-mono text-xs tabular-nums">
                  {r.vb} vB
                </span>
              </div>
              <div className="bg-muted h-7 w-full overflow-hidden rounded-md">
                <div
                  className={cn(
                    "flex h-full items-center justify-end rounded-md px-2 transition-all",
                    r.value === "legacy" ? "bg-muted-foreground/40" : "bg-primary",
                  )}
                  style={{ width: `${r.width}%` }}
                >
                  <span className="font-mono text-xs tabular-nums text-primary-foreground">
                    {formatSats(r.fee)}
                  </span>
                </div>
              </div>
              <span className="text-muted-foreground text-xs">
                {r.value === "legacy"
                  ? "기준 (가장 큼)"
                  : `Legacy 대비 ${(r.saving * 100).toFixed(0)}% 절감`}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <ExplainCard
        title="왜 Taproot·SegWit이 더 쌀까 — weight units와 witness 할인"
        body={
          <>
            블록 크기는 바이트가 아니라 <b>weight unit</b>으로 잰다. 일반 데이터는 4 wu,
            서명(witness) 데이터는 1 wu. vByte = weight ÷ 4이므로, 서명을 witness 영역으로
            옮긴 SegWit·Taproot 입력은 같은 서명이라도 vByte가 줄어든다. Taproot은 서명을
            한 개(Schnorr)로 합쳐 더 작다. 입력이 많아질수록(동전을 여러 개 쓸수록)
            이 절감 폭이 더 커진다 — 입력 개수를 늘려 확인해 보자.
          </>
        }
      />

      <p className="text-muted-foreground text-xs">
        입력/출력 vByte는 타입별 대표 근사값이다(서명 길이에 따라 ±1~2 vB 변동). 수수료
        계산식 자체는 실제와 같다.
      </p>
    </div>
  );
}
