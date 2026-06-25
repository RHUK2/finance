"use client";

import { useMemo, useState } from "react";

import { Battery, Bitcoin, Wind, Zap } from "lucide-react";

import { AppHeader } from "@/components/app-header";
import { PageMain } from "@/components/page-main";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

const fmt = (n: number) => `${Math.round(n)} GW`;

// 막대 세그먼트와 범례를 한 곳에서 정의 — 색·라벨이 항상 동기화된다.
const SEGMENTS = [
  { key: "demandMet", className: "bg-emerald-500", label: "수요 충당" },
  { key: "absorbed", className: "bg-amber-500", label: "채굴 흡수" },
  { key: "curtailed", className: "bg-rose-500/60", label: "버려짐" },
] as const;

export function GridBatteryView() {
  const [generation, setGeneration] = useState(70);
  const [demand, setDemand] = useState(45);
  const [minerCapacity, setMinerCapacity] = useState(25);
  const [minersOn, setMinersOn] = useState(true);

  const sim = useMemo(() => {
    const demandMet = Math.min(demand, generation);
    const shortage = Math.max(0, demand - generation);
    const surplus = Math.max(0, generation - demand);
    const absorbed = minersOn ? Math.min(surplus, minerCapacity) : 0;
    const curtailed = surplus - absorbed;
    const used = demandMet + absorbed;
    const efficiency = generation > 0 ? (used / generation) * 100 : 100;
    const minerUtil = minerCapacity > 0 ? (absorbed / minerCapacity) * 100 : 0;
    return { demandMet, shortage, surplus, absorbed, curtailed, efficiency, minerUtil };
  }, [generation, demand, minerCapacity, minersOn]);

  // 막대는 총 발전량(generation)을 100%로 보고 세 세그먼트로 나눈다.
  const seg = (v: number) => (generation > 0 ? (v / generation) * 100 : 0);

  return (
    <>
      <AppHeader breadcrumbs={[{ label: "전력망 배터리" }]} />
      <PageMain>
        <div className="mx-auto flex max-w-5xl flex-col gap-4">
          <div>
            <h1 className="text-xl font-semibold">
              비트코인은 전력망의 배터리다
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              전기는 저장이 어려워 발전과 수요가 실시간으로 맞아야 한다. 비트코인
              채굴은 잉여 전력을 흡수했다가 수요가 늘면 즉시 양보하는 &lsquo;유연
              부하&rsquo;로, 버려질 에너지를 수익으로 바꿔 전력망 효율을 높인다.
              아래 슬라이더로 직접 확인해 보자. (단위는 개념용 예시)
            </p>
          </div>

          {/* 컨트롤 */}
          <Card className="gap-4 p-4">
            <ControlSlider
              icon={<Wind className="size-4 text-sky-500" />}
              label="재생에너지 발전량"
              value={generation}
              onChange={setGeneration}
            />
            <ControlSlider
              icon={<Zap className="size-4 text-emerald-500" />}
              label="전력 수요"
              value={demand}
              onChange={setDemand}
            />
            <ControlSlider
              icon={<Bitcoin className="size-4 text-amber-500" />}
              label="채굴 부하 용량 (최대 흡수)"
              value={minerCapacity}
              onChange={setMinerCapacity}
              max={60}
            />
            <div className="flex items-center justify-between border-t pt-3">
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <Battery className="size-4 text-amber-500" />
                채굴 부하 연결
              </span>
              <Button
                variant={minersOn ? "default" : "outline"}
                size="sm"
                onClick={() => setMinersOn((v) => !v)}
              >
                {minersOn ? "ON — 잉여 흡수 중" : "OFF — 잉여 방치"}
              </Button>
            </div>
          </Card>

          {/* 시각화: 발전량 분배 막대 */}
          <Card className="gap-3 p-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium">발전 전력의 분배</span>
              <span className="text-muted-foreground text-xs">
                총 발전량 {fmt(generation)}
              </span>
            </div>
            <div className="bg-muted flex h-8 w-full overflow-hidden rounded-md">
              {SEGMENTS.map((s) => (
                <Segment
                  key={s.key}
                  pct={seg(sim[s.key])}
                  className={s.className}
                  title={`${s.label} ${fmt(sim[s.key])}`}
                />
              ))}
            </div>
            <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs">
              {SEGMENTS.map((s) => (
                <Legend
                  key={s.key}
                  className={s.className}
                  label={`${s.label} ${fmt(sim[s.key])}`}
                />
              ))}
            </div>
            {sim.shortage > 0 && (
              <p className="rounded-md bg-rose-500/10 px-3 py-2 text-xs text-rose-600 dark:text-rose-400">
                ⚠ 공급 부족 {fmt(sim.shortage)} — 발전량이 수요에 못 미친다.
                이때 채굴 부하는 즉시 차단되어 전력을 가정·산업에 양보한다.
              </p>
            )}
          </Card>

          {/* 지표 카드 */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric label="버려지는 전력" value={fmt(sim.curtailed)} tone="bad" />
            <Metric label="채굴 흡수량" value={fmt(sim.absorbed)} tone="accent" />
            <Metric
              label="전력망 효율"
              value={`${Math.round(sim.efficiency)}%`}
              tone="good"
            />
            <Metric label="채굴 가동률" value={`${Math.round(sim.minerUtil)}%`} />
          </div>

          {/* 설명 프로즈 */}
          <ExplainCard
            icon={<Wind className="size-4 text-sky-500" />}
            title="문제: 전기는 저장이 어렵다"
            body="태양광·풍력 같은 재생에너지는 햇빛과 바람에 따라 들쭉날쭉 생산된다. 그런데 전력망은 발전과 수요가 매 순간 정확히 일치해야 한다. 수요보다 많이 생산된 전기는 마땅히 저장할 곳이 없어 그냥 버려진다(curtailment). 송전망이 닿지 않는 오지의 가스전에서 태워 없애는 플레어링도 같은 낭비다."
          />
          <ExplainCard
            icon={<Bitcoin className="size-4 text-amber-500" />}
            title="비트코인 채굴 = 유연 부하"
            body="채굴기는 어디서든 즉시 켜고 끌 수 있는 전력 수요다. 평소엔 버려질 잉여 전력을 흡수해 채굴 수익으로 바꾸고, 가정·산업 수요가 치솟으면 1초 만에 가동을 멈춰 전력을 양보한다. 전력망 운영자 입장에선 언제든 조절 가능한 &lsquo;수요 반응(demand response)&rsquo; 자원인 셈이다."
          />
          <ExplainCard
            icon={<Battery className="size-4 text-emerald-500" />}
            title="그리드 배터리처럼, 더 싸게"
            body="배터리는 잉여를 저장했다 되돌려주지만 비싸고 용량도 제한적이다. 채굴은 전기를 되돌려주진 않는 대신, 버려질 에너지를 곧장 돈으로 바꾼다. 덕분에 발전소는 남는 전기로도 수익을 내 투자 회수가 빨라지고, 좌초될 뻔한 에너지가 경제성을 얻는다. 결과적으로 버려지는 전력은 줄고, 재생에너지 발전에 대한 투자 유인은 커진다."
          />
        </div>
      </PageMain>
    </>
  );
}

function ControlSlider({
  icon,
  label,
  value,
  onChange,
  max = 100,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  onChange: (v: number) => void;
  max?: number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 font-medium">
          {icon}
          {label}
        </span>
        <span className="font-mono tabular-nums">{fmt(value)}</span>
      </div>
      <Slider
        min={0}
        max={max}
        step={1}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
      />
    </div>
  );
}

function Segment({
  pct,
  className,
  title,
}: {
  pct: number;
  className: string;
  title: string;
}) {
  if (pct <= 0) return null;
  return (
    <div
      className={cn("h-full transition-all", className)}
      style={{ width: `${pct}%` }}
      title={title}
    />
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("size-3 rounded-sm", className)} />
      {label}
    </span>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "good" | "bad" | "accent";
}) {
  return (
    <Card className="gap-1 p-4">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span
        className={cn(
          "font-mono text-2xl font-semibold tabular-nums",
          tone === "good" && "text-emerald-600 dark:text-emerald-400",
          tone === "bad" && "text-rose-600 dark:text-rose-400",
          tone === "accent" && "text-amber-600 dark:text-amber-400",
        )}
      >
        {value}
      </span>
    </Card>
  );
}

function ExplainCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <Card className="gap-2 p-4">
      <span className="flex items-center gap-1.5 font-semibold">
        {icon}
        {title}
      </span>
      <p className="text-muted-foreground text-sm leading-relaxed">{body}</p>
    </Card>
  );
}
