"use client";

import { useState } from "react";
import { Ruler } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pipeline } from "@/components/pipeline";
import {
  ControlSlider,
  ExplainCard,
  Field,
  Metric,
  SectionIntro,
} from "@/components/simulation";
import {
  addrMeta,
  ADDR_TYPES,
  type AddrType,
  feeSats,
  formatSats,
  satsToBtc,
  TX_OVERHEAD_VB,
  txVBytes,
} from "@/lib/tx-concept";

export function FeeCalc() {
  const [type, setType] = useState<AddrType>("native");
  const [numIn, setNumIn] = useState(2);
  const [numOut, setNumOut] = useState(2);
  const [feeRate, setFeeRate] = useState(15);

  const meta = addrMeta(type);
  const inVb = numIn * meta.inputVb;
  const outVb = numOut * meta.outputVb;
  const vbytes = txVBytes(type, numIn, numOut);
  const fee = feeSats(vbytes, feeRate);

  return (
    <div className="flex flex-col gap-4">
      <SectionIntro title="크기가 수수료다 (vByte × sat/vB)">
        수수료는 <b>보내는 금액과 아무 상관이 없다</b>. 트랜잭션이 블록에서 차지하는
        공간, 즉 <b>vByte 크기</b>에만 매겨진다. 입력이 많을수록(동전을 여러 개 쓸수록)
        커지고, 그만큼 비싸진다. 입력·출력 개수와 수수료율을 바꿔 보자.
      </SectionIntro>

      <Card className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3">
        <Field label="입력 개수 (쓸 동전 수)">
          <Input
            type="number"
            min={1}
            value={numIn}
            onChange={(e) => setNumIn(Math.max(1, Number(e.target.value) || 1))}
          />
        </Field>
        <Field label="출력 개수 (받는 사람+잔돈)">
          <Input
            type="number"
            min={1}
            value={numOut}
            onChange={(e) => setNumOut(Math.max(1, Number(e.target.value) || 1))}
          />
        </Field>
        <Field label="주소 타입">
          <Select value={type} onValueChange={(v) => setType(v as AddrType)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ADDR_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </Card>

      <Card className="p-4">
        <ControlSlider
          icon={<Ruler className="size-4" />}
          label="수수료율 (멤풀 혼잡도)"
          hint="여유 ≈ 2 · 보통 ≈ 15 · 혼잡 ≈ 60 sat/vB"
          value={feeRate}
          onChange={setFeeRate}
          min={1}
          max={120}
          step={1}
          format={(v) => `${v} sat/vB`}
        />
      </Card>

      <Card className="flex flex-col gap-3 p-4">
        <span className="text-sm font-semibold">크기가 수수료가 되기까지</span>
        <Pipeline
          items={[
            {
              kind: "box",
              label: "트랜잭션 크기 (vByte)",
              value: `오버헤드 ${TX_OVERHEAD_VB} + 입력 ${numIn}×${meta.inputVb} + 출력 ${numOut}×${meta.outputVb}`,
            },
            { kind: "op", label: "합산" },
            { kind: "box", label: "총 크기", value: `${vbytes} vByte`, tone: "accent" },
            { kind: "op", label: `× 수수료율 ${feeRate} sat/vB` },
            { kind: "box", label: "수수료", value: formatSats(fee), tone: "good" },
          ]}
        />
      </Card>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Metric label="입력 크기" value={`${inVb} vB`} />
        <Metric label="출력 크기" value={`${outVb} vB`} />
        <Metric label="총 크기" value={`${vbytes} vB`} tone="accent" />
        <Metric label="수수료" value={formatSats(fee)} tone="good" sub={`${satsToBtc(fee)} BTC`} />
      </div>

      <ExplainCard
        title="수수료는 금액이 아니라 크기에 붙는다 — 블록 공간 경매"
        body={
          <>
            한 블록(약 10분에 하나)에 들어갈 공간은 약 4백만 weight(≈ 1MvB)로 한정된다.
            채굴자는 <b>vByte당 수수료가 높은</b> 트랜잭션부터 담는다. 그래서 0.001 BTC를
            보내든 100 BTC를 보내든, 크기가 같으면 수수료도 같다. 멤풀이 붐비면
            sat/vB 입찰가가 올라간다.
          </>
        }
      />

      <ExplainCard
        title="SegWit 할인 — witness는 1/4만 센다"
        body={
          <>
            서명(witness) 데이터는 블록 weight를 계산할 때 1/4 가중치만 받는다. vByte =
            weight ÷ 4이므로, 서명이 witness로 빠진 SegWit·Taproot 입력은 같은 일을
            하면서도 vByte가 작아진다(예: Legacy 입력 148 vB → Native SegWit 68 vB). 다음
            탭에서 타입별 차이를 직접 비교해 보자.
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
