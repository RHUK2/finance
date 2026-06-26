"use client";

import { useCallback, useMemo, useState } from "react";

import { Diamond, Zap } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import {
  AgentGrid,
  ControlSlider,
  ExplainCard,
  Metric,
  RoundControls,
  SectionIntro,
} from "./components";
import {
  type Holder,
  type HodlState,
  buildHolders,
  hodlStep,
  initialHodlState,
} from "./models";
import { useRoundEngine } from "./use-round-engine";

const N = 180;
const SEED = 777;
const SHOCK = 0.15; // 외생 공포 충격 -15%

export function HodlDilemma() {
  const [meanConviction, setMeanConviction] = useState(0.5);
  const [speedMs, setSpeedMs] = useState(600);

  const holders = useMemo(
    () => buildHolders(N, meanConviction, SEED),
    [meanConviction],
  );

  return (
    <div className="flex flex-col gap-4">
      <SectionIntro title="홀더의 딜레마 — 던질까, 버틸까">
        모두가 버티면(HODL) 가격은 지켜지지만, 누군가 던지기 시작하면 하락이 또
        다른 매도를 부른다. 확신이 약한 손은 작은 하락에도 패닉 매도하고, 그
        매도가 가격을 더 끌어내려 연쇄 청산을 일으킨다. 재생을 누르면 첫 박자에{" "}
        <b>−15% 공포 충격</b>이 가해진다. 평균 확신도에 따라 시장이 붕괴하는지,
        흡수하는지 지켜보자.
      </SectionIntro>

      <Card className="gap-4 p-4">
        <ControlSlider
          icon={<Diamond className="size-4 text-emerald-500" />}
          label="얼마나 잘 버티나 (평균 확신도)"
          hint="가격이 떨어져도 안 던지고 버티는 정도. 높일수록 다이아몬드손이 많아 작은 충격은 흡수하고, 낮추면 약한 손이 먼저 던져 연쇄 매도가 터진다."
          value={meanConviction}
          onChange={setMeanConviction}
          min={0.2}
          max={0.9}
          step={0.01}
          format={(v) => `${Math.round(v * 100)}%`}
        />
      </Card>

      {/* key로 확신도 분포 변경 시 리마운트 → 초기화 */}
      <HodlSim
        key={meanConviction}
        holders={holders}
        speedMs={speedMs}
        onSpeed={setSpeedMs}
      />

      <ExplainCard
        title="버티기는 조정 게임이다"
        body="비트코인 보유자 전체로 보면 '모두 버티기'가 모두에게 최선의 균형이다. 하지만 각자는 '남들이 던지기 전에 내가 먼저 던질까'라는 유혹에 노출돼 있다 — 뱅크런과 같은 구조다. 공급량이 고정돼 새로 찍어낼 수 없고, 장기 보유자(다이아몬드손) 비중이 커질수록 유통 물량이 줄어 같은 충격에도 가격이 덜 흔들린다. 확신의 분포가 곧 네트워크의 회복탄력성이다."
      />
    </div>
  );
}

type Sim = { state: HodlState; history: number[] };

function HodlSim({
  holders,
  speedMs,
  onSpeed,
}: {
  holders: Holder[];
  speedMs: number;
  onSpeed: (ms: number) => void;
}) {
  const init = (): Sim => ({ state: initialHodlState(N), history: [100] });
  const [sim, setSim] = useState<Sim>(init);

  // 첫 박자(round 0)에 외생 충격을 주입하고, 이후 라운드는 순수 전파만 한다.
  // 새 매도가 끊기면 false를 반환해 엔진이 스스로 멈춘다.
  const step = useCallback(() => {
    const shock = sim.state.round === 0 ? SHOCK : 0;
    const next = hodlStep(sim.state, holders, shock);
    setSim({ state: next, history: [...sim.history, next.price] });
    return shock > 0 || next.newSellers > 0;
  }, [holders, sim]);

  const engine = useRoundEngine(step, speedMs);

  const { state, history } = sim;
  const soldCount = state.sold.filter(Boolean).length;
  const holding = N - soldCount;
  const states = state.sold.map((s) => (s ? "bg-rose-500" : "bg-emerald-500"));

  const collapsed = state.round > 0 && soldCount > N * 0.5;
  const survived = state.round > 0 && soldCount <= N * 0.1;

  return (
    <>
      <Card className="gap-3 p-4">
        <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <Zap className="size-3.5 text-rose-500" />
          첫 박자에 외생 공포 충격{" "}
          <span className="font-mono font-medium text-rose-600 dark:text-rose-400">
            −{Math.round(SHOCK * 100)}%
          </span>{" "}
          자동 적용
        </div>
        <RoundControls
          playing={engine.playing}
          onToggle={engine.toggle}
          onStep={step}
          onReset={() => {
            engine.pause();
            setSim(init());
          }}
          round={state.round}
          speedMs={speedMs}
          onSpeed={onSpeed}
        />
        <AgentGrid states={states} />
        <PriceLine history={history} />
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Metric
          label="가격 (시작 100)"
          value={state.price.toFixed(1)}
          tone={
            state.price < 60 ? "bad" : state.price >= 95 ? "good" : undefined
          }
        />
        <Metric label="매도자" value={`${soldCount}`} tone="bad" />
        <Metric label="버티는 손" value={`${holding}`} tone="good" />
      </div>

      {(collapsed || survived) && (
        <p
          className={cn(
            "rounded-md px-3 py-2 text-xs",
            collapsed
              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
          )}
        >
          {collapsed
            ? "💥 데스 스파이럴 — 매도가 매도를 부르며 가격이 붕괴했다. 약한 손의 비중이 높을수록 작은 충격도 연쇄 청산으로 번진다."
            : "💎 다이아몬드손이 충격을 흡수했다. 확신이 강한 보유자가 던지지 않으니 매도가 더 번지지 않고 첫 충격 선에서 멈췄다."}
        </p>
      )}
    </>
  );
}

// 가격 추이 (0~100) SVG 라인.
function PriceLine({ history }: { history: number[] }) {
  const W = 100;
  const H = 40;
  const pts = history.map((price, i) => {
    const x = history.length <= 1 ? 0 : (i / (history.length - 1)) * W;
    const y = H - (Math.max(0, Math.min(100, price)) / 100) * H;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const last = history[history.length - 1];
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground w-16 shrink-0 text-xs">가격</span>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="h-10 w-full"
      >
        <polyline
          points={pts.join(" ")}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          className={cn(last < 60 ? "text-rose-500" : "text-emerald-500")}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}
