"use client";

import { useMemo, useState } from "react";

import { Bitcoin, Cpu, ShieldCheck, Zap } from "lucide-react";

import { Card } from "@/components/ui/card";
import {
  ControlSlider,
  ExplainCard,
  Metric,
  SectionIntro,
} from "@/components/simulation";
import { cn, formatUsd } from "@/lib/utils";

import { attack51 } from "./models";

export function AttackGame() {
  const [btcPrice, setBtcPrice] = useState(100000);
  const [networkHashrate, setNetworkHashrate] = useState(800);
  const [attackHours, setAttackHours] = useState(6);
  const [hardwareCostPerTH, setHardwareCostPerTH] = useState(15);
  const [electricity, setElectricity] = useState(0.05);

  const r = useMemo(
    () =>
      attack51({
        btcPrice,
        networkHashrate,
        attackHours,
        hardwareCostPerTH,
        electricity,
      }),
    [btcPrice, networkHashrate, attackHours, hardwareCostPerTH, electricity],
  );

  const max = Math.max(r.attackCost, r.doubleSpendGain, r.honestRevenue);

  return (
    <div className="flex flex-col gap-4">
      <SectionIntro title="51% 공격 — 합리적이라면 정직하게 채굴한다">
        네트워크 과반 해시파워를 확보하면 이론상 이중지불 공격이 가능하다. 하지만
        그 해시파워를 갖추는 비용과, 같은 장비로 정직하게 채굴해 버는 수익, 그리고
        공격이 성공했을 때 벌어질 일을 함께 따져 보자. 슬라이더로 조건을 바꿔도
        결론은 좀처럼 바뀌지 않는다. (수치는 개념용 예시)
      </SectionIntro>

      <Card className="gap-4 p-4">
        <ControlSlider
          icon={<Bitcoin className="size-4 text-amber-500" />}
          label="BTC 가격"
          value={btcPrice}
          onChange={setBtcPrice}
          min={10000}
          max={500000}
          step={5000}
          format={formatUsd}
        />
        <ControlSlider
          icon={<Cpu className="size-4 text-sky-500" />}
          label="네트워크 해시레이트"
          value={networkHashrate}
          onChange={setNetworkHashrate}
          min={100}
          max={1200}
          step={10}
          format={(v) => `${v} EH/s`}
        />
        <ControlSlider
          label="공격 지속 시간"
          value={attackHours}
          onChange={setAttackHours}
          min={1}
          max={72}
          format={(v) => `${v}시간`}
        />
        <ControlSlider
          label="장비 단가"
          value={hardwareCostPerTH}
          onChange={setHardwareCostPerTH}
          min={5}
          max={40}
          format={(v) => `$${v}/TH`}
        />
        <ControlSlider
          icon={<Zap className="size-4 text-amber-500" />}
          label="전기 요금"
          value={electricity}
          onChange={setElectricity}
          min={0.02}
          max={0.15}
          step={0.005}
          format={(v) => `$${v.toFixed(3)}/kWh`}
        />
      </Card>

      <Card className="gap-3 p-4">
        <span className="text-sm font-medium">비용 vs 이득</span>
        <CostBar
          label="공격 비용 (장비 + 전기)"
          value={r.attackCost}
          max={max}
          className="bg-rose-500"
          sub={`장비 ${formatUsd(r.hardwareCost)} · 전기 ${formatUsd(r.energyCost)}`}
        />
        <CostBar
          label="이중지불 이득 (최대 추정)"
          value={r.doubleSpendGain}
          max={max}
          className="bg-amber-500"
        />
        <CostBar
          label="정직 채굴 수익 (같은 장비 · 같은 시간)"
          value={r.honestRevenue}
          max={max}
          className="bg-emerald-500"
        />
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Metric label="공격 비용" value={formatUsd(r.attackCost)} tone="bad" />
        <Metric label="이중지불 이득" value={formatUsd(r.doubleSpendGain)} tone="accent" />
        <Metric
          label="비용 ÷ 이득"
          value={`${r.costToGain >= 10 ? Math.round(r.costToGain) : r.costToGain.toFixed(1)}배`}
          tone={r.costToGain >= 1 ? "good" : "bad"}
        />
      </div>

      <Card
        className={cn(
          "flex-row items-start gap-3 p-4",
          r.costToGain >= 1
            ? "border-emerald-500/40 bg-emerald-500/5"
            : "border-rose-500/40 bg-rose-500/5",
        )}
      >
        <ShieldCheck
          className={cn(
            "size-5 shrink-0",
            r.costToGain >= 1 ? "text-emerald-500" : "text-rose-500",
          )}
        />
        <p className="text-sm leading-relaxed">
          {r.costToGain >= 1 ? (
            <>
              공격 비용이 이득의{" "}
              <b className="text-emerald-600 dark:text-emerald-400">
                {r.costToGain >= 10
                  ? Math.round(r.costToGain)
                  : r.costToGain.toFixed(1)}
                배
              </b>
              다. 게다가 공격이 성공하면 신뢰가 무너져 BTC 가격이 폭락하고, 비트코인
              채굴에만 쓰이는 수십억 달러어치 장비와 보유 코인이 함께 휴지가 된다.{" "}
              <b>합리적 행위자라면 공격 대신 정직하게 채굴해 보상을 받는다.</b> 이것이
              작업증명이 경제적 유인으로 네트워크를 지키는 방식이다.
            </>
          ) : (
            <>
              이 극단적 설정에선 이득이 비용을 넘어선다. 하지만 공격이 성공하는 순간
              BTC 신뢰가 붕괴해 가격이 폭락하므로, 노린 이득 자체가 증발하고 보유
              자산·장비도 함께 파괴된다. 자기 파괴적 공격은 여전히 비합리적이다.
            </>
          )}
        </p>
      </Card>

      <ExplainCard
        title="공격자도 시스템의 인질이다"
        body="51% 공격의 진짜 방어선은 암호가 아니라 경제적 유인이다. 과반 해시파워를 갖출 정도의 투자자는 이미 네트워크의 최대 이해관계자다. 그가 네트워크를 공격해 신뢰를 깨면 자기 장비와 코인의 가치를 스스로 파괴하게 된다. 정직하게 채굴할 때 가장 큰 보상을 받도록 설계돼 있어, 공격은 늘 손해 보는 선택이 된다."
      />
    </div>
  );
}

function CostBar({
  label,
  value,
  max,
  className,
  sub,
}: {
  label: string;
  value: number;
  max: number;
  className: string;
  sub?: string;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono tabular-nums">{formatUsd(value)}</span>
      </div>
      <div className="bg-muted h-5 w-full overflow-hidden rounded-md">
        <div
          className={cn("h-full rounded-md transition-all", className)}
          style={{ width: `${Math.max(1, pct)}%` }}
        />
      </div>
      {sub && <span className="text-muted-foreground text-xs">{sub}</span>}
    </div>
  );
}
