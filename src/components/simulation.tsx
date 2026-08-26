'use client';

import { type ReactNode, useState } from 'react';

import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Minus,
  Pause,
  Play,
  RotateCcw,
  StepForward,
  TriangleAlert,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCountUp } from '@/hooks/use-count-up';
import { clamp, cn, formatUsd } from '@/lib/utils';

// 인터랙티브 시뮬레이션·설명 페이지(게임이론·소프트워·변동성 등)가 공유하는 UI 프리미티브.

// 에이전트 격자. 상태별 배경색 className 배열을 받아 사각형으로 렌더링.
// 라운드마다 색이 바뀌며 transition-colors로 부드럽게 전환된다.
//
// orientation='column'은 칸을 위→아래, 다음 열 순서로 채운다. states가 어떤 기준으로
// 정렬돼 있고 상태 전이가 항상 앞에서부터 일어나는 시뮬레이션(임계값 캐스케이드 등)에서
// 경계가 수직선으로 전진해 보인다. 기본값 'row'는 기존 동작(행 우선, 반응형 열 수)이다.
// highlight[i]가 true면 그 칸에 링을 둘러 이번 라운드에 바뀐 칸을 짚어 준다.
export function AgentGrid({
  states,
  orientation = 'row',
  rows = 6,
  highlight,
}: {
  states: string[];
  orientation?: 'row' | 'column';
  rows?: number;
  highlight?: boolean[];
}) {
  const style =
    orientation === 'column'
      ? {
          gridAutoFlow: 'column' as const,
          gridTemplateRows: `repeat(${rows}, auto)`,
          gridAutoColumns: 'minmax(0, 1fr)',
        }
      : { gridTemplateColumns: 'repeat(auto-fill, minmax(13px, 1fr))' };
  return (
    // 열 우선 격자는 열 수가 고정(=칸 수/rows)이라 좁은 화면에서 칸이 크게 줄어든다.
    // 모바일에서는 간격을 좁혀 칸에 폭을 더 주고, 강조 링도 칸을 삼키지 않게 얇게 쓴다.
    <div className={cn('grid', orientation === 'column' ? 'gap-[2px] sm:gap-1' : 'gap-1')} style={style}>
      {states.map((c, i) => (
        <div
          key={i}
          className={cn(
            'aspect-square rounded-[3px] transition-colors duration-300',
            c,
            highlight?.[i] && 'ring-foreground ring-1 sm:ring-2',
          )}
        />
      ))}
    </div>
  );
}

const DEFAULT_SPEEDS = [
  { label: '0.5×', ms: 1100 },
  { label: '1×', ms: 600 },
  { label: '2×', ms: 280 },
];

// 재생 컨트롤: 재생/일시정지 · 한 스텝 · 리셋 · 속도.
// unit으로 진행 단위 명칭("라운드"·"스텝"), speeds로 속도 프리셋을 바꿀 수 있다.
//
// total과 onSeek을 함께 주면 스크러버 슬라이더가 붙는다. 궤적을 미리 계산해 두는
// 결정론적 시뮬레이션에서 라운드를 앞뒤로 왕복하며 볼 수 있다. 둘 중 하나라도
// 없으면 슬라이더 없이 기존 동작 그대로다.
export function RoundControls({
  playing,
  onToggle,
  onStep,
  onReset,
  round,
  speedMs,
  onSpeed,
  done,
  unit = '라운드',
  speeds = DEFAULT_SPEEDS,
  total,
  onSeek,
}: {
  playing: boolean;
  onToggle: () => void;
  onStep: () => void;
  onReset: () => void;
  round: number;
  speedMs: number;
  onSpeed: (ms: number) => void;
  done?: boolean;
  unit?: string;
  speeds?: { label: string; ms: number }[];
  total?: number;
  onSeek?: (round: number) => void;
}) {
  const seekable = total !== undefined && onSeek !== undefined && total > 0;
  return (
    <div className='flex flex-col gap-2'>
      <div className='flex flex-wrap items-center gap-2'>
        <Button size='sm' onClick={onToggle} disabled={done} className='gap-1.5'>
          {playing ? <Pause className='size-4' /> : <Play className='size-4' />}
          {playing ? '일시정지' : done ? '완료' : '재생'}
        </Button>
        <Button size='sm' variant='outline' onClick={onStep} disabled={playing || done} className='gap-1.5'>
          <StepForward className='size-4' />한 {unit}
        </Button>
        <Button size='sm' variant='outline' onClick={onReset} className='gap-1.5'>
          <RotateCcw className='size-4' />
          리셋
        </Button>
        <div className='ml-auto flex items-center gap-2'>
          <span className='text-muted-foreground text-sm tabular-nums'>
            {unit} {round}
            {seekable && ` / ${total}`}
          </span>
          <div className='flex overflow-hidden rounded-md border'>
            {speeds.map((s) => (
              <button
                key={s.ms}
                onClick={() => onSpeed(s.ms)}
                className={cn(
                  'px-2 py-1 text-xs tabular-nums transition-colors',
                  speedMs === s.ms ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      {seekable && (
        <Slider
          value={[round]}
          onValueChange={([v]) => onSeek(v)}
          min={0}
          max={total}
          step={1}
          aria-label={`${unit} 이동`}
        />
      )}
    </div>
  );
}

// 로그 스케일 슬라이더가 쓰는 손잡이 눈금 수. 값이 아니라 위치를 이 정수로 잡고
// min~max 사이를 로그 등간격으로 매핑한다.
const LOG_TICKS = 240;

// 슬라이더 컨트롤 한 줄: 라벨 + 포맷된 값 + 슬라이더.
//
// scale='log'는 min~max가 여러 자릿수에 걸칠 때 쓴다. 선형 슬라이더는 범위가
// $1M~$1T처럼 넓으면 의미 있는 구간이 왼쪽 몇 픽셀에 뭉쳐 손잡이를 조금만 밀어도
// 값이 수십억씩 튄다. 로그 스케일은 자릿수당 같은 폭을 줘서 전 구간을 고르게 만진다.
// min은 0보다 커야 한다.
export function ControlSlider({
  icon,
  label,
  hint,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  scale = 'linear',
  format,
}: {
  icon?: React.ReactNode;
  label: string;
  hint?: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  scale?: 'linear' | 'log';
  format: (v: number) => string;
}) {
  const log = scale === 'log';
  const ratio = log ? Math.log(max / min) : 0;
  const toTick = (v: number) => Math.round((LOG_TICKS * Math.log(v / min)) / ratio);
  const fromTick = (t: number) => min * Math.exp((ratio * t) / LOG_TICKS);

  return (
    <div className='flex flex-col gap-1.5'>
      <div className='flex items-center justify-between text-sm'>
        <span className='flex items-center gap-1.5 font-medium'>
          {icon}
          {label}
        </span>
        <span className='tabular-nums'>{format(value)}</span>
      </div>
      {log ? (
        <Slider
          min={0}
          max={LOG_TICKS}
          step={1}
          value={[toTick(value)]}
          onValueChange={([t]) => onChange(fromTick(t))}
        />
      ) : (
        <Slider min={min} max={max} step={step} value={[value]} onValueChange={([v]) => onChange(v)} />
      )}
      {hint && <p className='text-muted-foreground text-xs'>{hint}</p>}
    </div>
  );
}

// 지표 카드.
export function Metric({
  label,
  value,
  tone,
  sub,
}: {
  label: string;
  value: string;
  tone?: 'good' | 'bad' | 'accent';
  sub?: string;
}) {
  return (
    <Card className='gap-1 p-4'>
      <span className='text-muted-foreground text-xs'>{label}</span>
      <span
        className={cn(
          'text-xl font-semibold tabular-nums sm:text-2xl',
          tone === 'good' && 'text-emerald-600 dark:text-emerald-400',
          tone === 'bad' && 'text-rose-600 dark:text-rose-400',
          tone === 'accent' && 'text-amber-600 dark:text-amber-400',
        )}
      >
        {value}
      </span>
      {sub && <span className='text-muted-foreground text-xs'>{sub}</span>}
    </Card>
  );
}

// 아이콘 + 한 줄 메시지로 결과를 알리는 배너. tone은 Metric과 같은 어휘(good/bad/accent)를 쓴다.
export function StatusBanner({
  icon,
  tone,
  children,
}: {
  icon?: React.ReactNode;
  tone?: 'good' | 'bad' | 'accent';
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-md border p-3 text-sm font-medium',
        tone === 'good' && 'border-emerald-500/40 bg-emerald-500/5',
        tone === 'bad' && 'border-rose-500/40 bg-rose-500/5',
        tone === 'accent' && 'border-amber-500/40 bg-amber-500/5',
        !tone && 'bg-muted border-transparent',
      )}
    >
      {icon}
      {children}
    </div>
  );
}

// 숫자 값이 useCountUp으로 애니메이션되는 Metric.
export function StatCard({
  label,
  value,
  format,
  tone,
  sub,
}: {
  label: string;
  value: number;
  format: (n: number) => string;
  tone?: 'good' | 'bad' | 'accent';
  sub?: string;
}) {
  const animated = useCountUp(value);
  return <Metric label={label} value={format(animated)} tone={tone} sub={sub} />;
}

// 색 견본 + 라벨 범례 항목.
export function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className='flex items-center gap-1.5'>
      <span className={cn('size-3 rounded-[3px]', className)} />
      {label}
    </span>
  );
}

// 설명 카드 (프로즈). 접이식. preview는 접힌 상태에서 보이는 맛보기 한 줄.
export function ExplainCard({
  icon,
  title,
  body,
  preview,
}: {
  icon?: React.ReactNode;
  title: string;
  body: React.ReactNode;
  preview?: string;
}) {
  return (
    <Collapsible asChild>
      <Card className='group/explain gap-0 p-0'>
        <CollapsibleTrigger className='hover:bg-muted/50 flex w-full items-start gap-2 p-4 text-left transition-colors'>
          <div className='flex-1'>
            <span className='flex items-center gap-1.5 font-semibold'>
              {icon}
              {title}
            </span>
            {preview && (
              <span className='text-muted-foreground mt-1 line-clamp-1 block text-sm group-data-[state=open]/explain:hidden'>
                {preview}
              </span>
            )}
          </div>
          <ChevronDown className='text-muted-foreground mt-0.5 size-4 shrink-0 transition-transform group-data-[state=open]/explain:rotate-180' />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className='text-muted-foreground p-4 text-sm/relaxed'>{body}</div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

// 시뮬레이션 페이지 공용 탭. 반응형: 모바일 2열(라벨 줄바꿈), 데스크탑 탭 수만큼 한 줄.
// 탭 수가 홀수면 마지막 탭이 모바일에서 한 줄을 꽉 채운다.
const MD_GRID_COLS: Record<number, string> = {
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-4',
  5: 'md:grid-cols-5',
  6: 'md:grid-cols-6',
};

export type SimTab = {
  value: string;
  label: React.ReactNode;
  node: React.ReactNode;
};

export function SimTabs({ tabs, defaultValue }: { tabs: SimTab[]; defaultValue: string }) {
  const isOdd = tabs.length % 2 === 1;
  return (
    <Tabs defaultValue={defaultValue} className='gap-4'>
      <TabsList
        className={cn(
          'grid w-full grid-cols-2 group-data-horizontal/tabs:h-auto',
          MD_GRID_COLS[tabs.length] ?? 'md:grid-cols-4',
        )}
      >
        {tabs.map((t, i) => (
          <TabsTrigger
            key={t.value}
            value={t.value}
            className={cn(
              'min-h-9 py-1.5 text-center leading-tight whitespace-normal',
              isOdd && i === tabs.length - 1 && 'col-span-2 md:col-span-1',
            )}
          >
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((t) => (
        <TabsContent key={t.value} value={t.value}>
          {t.node}
        </TabsContent>
      ))}
    </Tabs>
  );
}

// 라벨 + 입력 컨트롤(Select·Input 등)을 세로로 묶는 폼 필드.
export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className='flex flex-col gap-1.5'>
      <span className='text-sm font-medium'>{label}</span>
      {children}
    </div>
  );
}

// 세그먼트형 토글 버튼 그룹. 값 하나를 고르는 라디오 대체.
// disabled는 지금 조건에서 이 선택이 결과를 바꾸지 못할 때 쓴다. 컨트롤을 숨기지 않는 이유는
// 다른 조건에서는 살아난다는 사실 자체가 설명의 일부이기 때문이다.
export function SegmentedControl<T extends string | boolean>({
  options,
  value,
  onChange,
  disabled,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  disabled?: boolean;
}) {
  return (
    <div className={cn('flex overflow-hidden rounded-md border', disabled && 'opacity-50')}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          onClick={() => onChange(o.value)}
          disabled={disabled}
          className={cn(
            'flex-1 px-2 py-1.5 text-sm transition-colors',
            value === o.value ? 'bg-primary text-primary-foreground' : !disabled && 'hover:bg-muted',
            disabled && 'cursor-not-allowed',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// "교육용 개념 시연" 경고 카드. 개념 시연 페이지들이 공통으로 쓰는 틀.
export function IllustrativeDisclaimer({ children }: { children: React.ReactNode }) {
  return (
    <Card className='gap-2 border-amber-500/40 bg-amber-500/5 p-4 text-sm/relaxed'>
      <span className='flex items-center gap-1.5 font-semibold text-amber-600 dark:text-amber-400'>
        <TriangleAlert className='size-4' />
        교육용 개념 시연
      </span>
      <p className='text-muted-foreground'>{children}</p>
    </Card>
  );
}

// 값 배열을 폴리라인으로 그리는 작은 SVG 스파크라인.
// min/max를 주면 고정 스케일(범위 밖은 잘라냄), 없으면 데이터 범위에 맞춰 자동 스케일.
//
// cursor(인덱스)를 주면 values 전체를 흐리게 깔고 0..cursor 구간만 진하게 그린 뒤
// 현재 지점에 세로 마커를 세운다. 궤적을 미리 계산해 두는 시뮬레이션에서 곡선의
// 최종 모양을 첫 프레임부터 보여 주려는 용도다. 없으면 기존처럼 전 구간을 그린다.
export function Sparkline({
  values,
  label,
  className,
  min,
  max,
  heightClass = 'h-8',
  cursor,
}: {
  values: number[];
  label: string;
  className: string;
  min?: number;
  max?: number;
  heightClass?: string;
  cursor?: number;
}) {
  const W = 100;
  const H = 32;
  const lo = min ?? Math.min(...values);
  const hi = max ?? Math.max(...values);
  const span = hi - lo || 1;
  const xy = values.map((v, i) => {
    const x = values.length <= 1 ? 0 : (i / (values.length - 1)) * W;
    const y = H - ((clamp(v, lo, hi) - lo) / span) * H;
    return [x, y] as const;
  });
  const fmt = (pts: readonly (readonly [number, number])[]) =>
    pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const at = cursor === undefined ? undefined : xy[clamp(cursor, 0, xy.length - 1)];
  return (
    <div className='flex items-center gap-2'>
      <span className='text-muted-foreground w-16 shrink-0 text-xs'>{label}</span>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio='none' className={cn('w-full', heightClass)}>
        {at && (
          <polyline
            points={fmt(xy)}
            fill='none'
            stroke='currentColor'
            strokeWidth={1.5}
            className={cn(className, 'opacity-25')}
            vectorEffect='non-scaling-stroke'
          />
        )}
        <polyline
          points={fmt(at ? xy.slice(0, clamp(cursor ?? 0, 0, xy.length - 1) + 1) : xy)}
          fill='none'
          stroke='currentColor'
          strokeWidth={1.5}
          className={className}
          vectorEffect='non-scaling-stroke'
        />
        {at && (
          <line
            x1={at[0]}
            y1={0}
            x2={at[0]}
            y2={H}
            stroke='currentColor'
            strokeWidth={1}
            className={cn(className, 'opacity-60')}
            vectorEffect='non-scaling-stroke'
          />
        )}
      </svg>
    </div>
  );
}

// 라벨 + USD 금액 + 수평 비교 막대 (max 대비 비율로 폭 결정).
export function CostBar({
  label,
  value,
  max,
  className,
  sub,
  format = formatUsd,
}: {
  label: string;
  value: number;
  max: number;
  className: string;
  sub?: string;
  format?: (v: number) => string;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className='flex flex-col gap-1'>
      <div className='flex items-baseline justify-between text-xs'>
        <span className='text-muted-foreground'>{label}</span>
        <span className='tabular-nums'>{format(value)}</span>
      </div>
      <div className='bg-muted h-5 w-full overflow-hidden rounded-md'>
        <div className={cn('h-full rounded-md transition-all', className)} style={{ width: `${Math.max(1, pct)}%` }} />
      </div>
      {sub && <span className='text-muted-foreground text-xs'>{sub}</span>}
    </div>
  );
}

// 탭 섹션 상단 제목 + 설명.
export function SectionIntro({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className='text-lg font-semibold'>{title}</h2>
      <p className='text-muted-foreground mt-1 text-sm/relaxed'>{children}</p>
    </div>
  );
}

// 임계값 캐스케이드 시각화 한 벌. 채택 캐스케이드·홀더 딜레마·자연의 파워 프로젝션·
// 강제청산 연쇄가 공유한다. 넷 모두 개체를 하나의 축(임계값·확신도·투사력·청산 낙폭)
// 오름차순으로 정렬해 두므로 상태가 바뀐 집합이 언제나 격자 앞에서부터의 연속 구간이
// 되고, 그 경계의 위치가 곧 진행률이 된다(docs/adr/0001 참조. 강제청산 연쇄의 칸을
// 행위자라 부르지 않는 이유는 0003). 축 라벨·읽는 법·범례·궤적 스파크라인이 함께
// 있어야 그 경계가 읽히므로 한 컴포넌트로 묶었다. 재생 배선은 useTrajectoryPlayer.
export function CascadeStage({
  notice,
  controls,
  axisLabels,
  states,
  highlight,
  reading,
  legend,
  legendNote,
  curve,
  metrics,
  outcome,
}: {
  notice?: React.ReactNode;
  controls: React.ReactNode;
  axisLabels: [string, string];
  states: string[];
  highlight?: boolean[];
  reading: React.ReactNode;
  legend: React.ReactNode;
  legendNote?: string;
  curve: {
    values: number[];
    cursor: number;
    label: string;
    className: string;
    min?: number;
    max?: number;
  };
  metrics: React.ReactNode;
  outcome?: { tone?: 'good' | 'bad' | 'accent'; text: string };
}) {
  return (
    <>
      <Card className='gap-3 p-4'>
        {notice}
        {controls}
        <div className='flex flex-col gap-1.5'>
          <div className='text-muted-foreground flex items-center justify-between text-xs'>
            <span>{axisLabels[0]}</span>
            <span>{axisLabels[1]}</span>
          </div>
          <AgentGrid states={states} orientation='column' highlight={highlight} />
          <p className='text-muted-foreground text-xs'>{reading}</p>
        </div>
        <div className='text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs'>
          {legend}
          {legendNote && <span className='ml-auto'>{legendNote}</span>}
        </div>
        <Sparkline
          values={curve.values}
          cursor={curve.cursor}
          label={curve.label}
          className={curve.className}
          min={curve.min}
          max={curve.max}
          heightClass='h-12'
        />
      </Card>

      <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>{metrics}</div>

      {outcome && (
        <p
          className={cn(
            'rounded-md px-3 py-2 text-xs',
            outcome.tone === 'good' && 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
            outcome.tone === 'bad' && 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
            outcome.tone === 'accent' && 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
            !outcome.tone && 'bg-muted text-muted-foreground',
          )}
        >
          {outcome.text}
        </p>
      )}
    </>
  );
}

// 하나의 총량이 여러 몫으로 갈리는 것을 보여 주는 가로 누적 막대 + 범례.
// 총량이 고정된 파이를 나누는 그림(자본구조, 지분 구성, 이익의 분배, 발전량 배분)에서 쓴다.
// 막대 폭은 value/total로만 정해지므로, 라벨의 단위는 호출하는 쪽이 정해서 넘긴다.
export function StackedBar({
  segments,
  total,
}: {
  segments: { label: string; value: number; className: string }[];
  total: number;
}) {
  // total이 0인 순간(발전량 0 등)에도 폭이 NaN이 되지 않게 막는다.
  const shown = total > 0 ? segments.filter((s) => s.value > 0) : [];
  return (
    <>
      <div className='bg-muted flex h-8 w-full overflow-hidden rounded-md'>
        {shown.map((s) => (
          <div
            key={s.label}
            title={s.label}
            className={cn('h-full transition-all', s.className)}
            style={{ width: `${(s.value / total) * 100}%` }}
          />
        ))}
      </div>
      <div className='text-muted-foreground flex flex-wrap gap-x-4 gap-y-1.5 text-xs'>
        {shown.map((s) => (
          <Legend key={s.label} className={s.className} label={s.label} />
        ))}
      </div>
    </>
  );
}

// 여러 대상을 같은 잣대로 재는 비교표. 행을 누르면 어느 행이 골라졌는지 알려 주고,
// 고른 행의 설명은 호출하는 쪽이 표 아래에 따로 그린다.
// marks의 길이는 columns의 길이와 같아야 한다.
export type MarkState = 'yes' | 'no' | 'partial';

export type MarkRow = {
  id: string;
  label: string;
  sub?: string;
  icon?: React.ComponentType<{ className?: string }>;
  marks: MarkState[];
};

const MARK_TABLE_COLS: Record<number, string> = {
  2: 'grid-cols-[1fr_3rem_3rem] sm:grid-cols-[1fr_4rem_4rem]',
  3: 'grid-cols-[1fr_2.5rem_2.5rem_2.5rem] sm:grid-cols-[1fr_4rem_4rem_4rem]',
};

export function MarkTable({
  title,
  icon,
  headers,
  rows,
  selected,
  onSelect,
}: {
  title: string;
  icon: React.ReactNode;
  headers: [string, ...string[]];
  rows: MarkRow[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  // 첫 열은 대상 이름이라 남는 폭을 전부 가져가고, 나머지 잣대 열은 좁은 고정폭을 나눠 쓴다.
  // Tailwind는 소스에 그대로 적힌 문자열만 훑으므로 열 수별 클래스를 미리 적어 둔다.
  const grid = cn('grid items-center gap-x-2', MARK_TABLE_COLS[headers.length - 1]);

  return (
    <Card className='gap-0 overflow-hidden p-0'>
      <div className='flex flex-col gap-1 p-4'>
        <span className='flex items-center gap-1.5 text-sm font-semibold'>
          {icon}
          {title}
        </span>
        <span className='text-muted-foreground text-xs'>항목을 누르면 표 아래에 설명이 열린다</span>
      </div>
      <div className={cn(grid, 'text-muted-foreground border-y px-4 py-2 text-xs')}>
        {headers.map((h, i) => (
          <span key={h} className={i === 0 ? undefined : 'text-center'}>
            {h}
          </span>
        ))}
      </div>
      {rows.map((r) => (
        <button
          key={r.id}
          onClick={() => onSelect(r.id)}
          className={cn(
            grid,
            'border-b px-4 py-2.5 text-left text-sm transition-colors last:border-b-0',
            selected === r.id ? 'bg-muted' : 'hover:bg-muted/50',
          )}
        >
          <span className={cn('flex', r.icon ? 'items-center gap-2' : 'flex-col')}>
            {r.icon && <r.icon className='text-muted-foreground size-4 shrink-0' />}
            {r.label}
            {r.sub && <span className='text-muted-foreground text-xs'>{r.sub}</span>}
          </span>
          {r.marks.map((m, i) => (
            <Mark key={i} state={m} />
          ))}
        </button>
      ))}
    </Card>
  );
}

function Mark({ state }: { state: MarkState }) {
  return (
    <span className='flex justify-center'>
      {state === 'yes' ? (
        <Check className='size-4 text-emerald-600 dark:text-emerald-400' />
      ) : state === 'no' ? (
        <X className='size-4 text-rose-600 dark:text-rose-400' />
      ) : (
        <Minus className='size-4 text-amber-600 dark:text-amber-400' />
      )}
    </span>
  );
}

// 서사형 워크스루의 단계 컨트롤. 화면 아래에 붙어 현재 단계의 제목·해설과 이동
// 버튼을 함께 들고 있다. RoundControls가 자동 재생·속도 조절이 달린 시뮬레이션용인
// 반면 이쪽은 사용자가 직접 넘기는 정해진 수의 단계를 위한 것이다.
// 신용창조와 달러 패권이 함께 쓴다.
function StepControls({
  step,
  total,
  onPrev,
  onNext,
  onReset,
  onJump,
}: {
  step: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onReset: () => void;
  onJump: (i: number) => void;
}) {
  return (
    <div className='flex flex-wrap items-center gap-2'>
      <Button variant='outline' size='sm' onClick={onPrev} disabled={step === 0}>
        <ChevronLeft className='size-4' /> 이전
      </Button>
      <Button size='sm' onClick={onNext} disabled={step === total - 1}>
        다음 단계 <ChevronRight className='size-4' />
      </Button>
      <Button variant='ghost' size='sm' onClick={onReset} disabled={step === 0}>
        <RotateCcw className='size-4' /> 리셋
      </Button>
      <div className='ml-auto flex items-center gap-1.5'>
        {Array.from({ length: total }, (_, i) => (
          <button
            key={i}
            aria-label={`${i}단계로 이동`}
            onClick={() => onJump(i)}
            className={cn(
              'size-2.5 rounded-full transition-colors',
              i === step ? 'bg-primary' : 'bg-muted hover:bg-muted-foreground/40',
            )}
          />
        ))}
      </div>
    </div>
  );
}

export function StepPanel({
  step,
  total,
  title,
  narration,
  onPrev,
  onNext,
  onReset,
  onJump,
  slider,
}: {
  step: number;
  total: number;
  title: string;
  narration: string;
  onPrev: () => void;
  onNext: () => void;
  onReset: () => void;
  onJump: (i: number) => void;
  slider?: ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className='sticky bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-40 md:bottom-4'>
      <Card className='bg-card gap-0 overflow-hidden p-0 shadow-xl'>
        <button
          type='button'
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className='hover:bg-muted/40 flex w-full items-center gap-2 px-3 py-2 text-left transition-colors'
        >
          <span className='bg-primary text-primary-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-xs leading-none font-semibold'>
            <span className='translate-y-px'>{step}</span>
          </span>
          <span className='flex-1 truncate font-semibold'>{title}</span>
          <ChevronDown className={cn('size-4 shrink-0 transition-transform', open && 'rotate-180')} />
        </button>
        {open && (
          <div className='flex flex-col gap-3 border-t p-3'>
            <p className='text-muted-foreground text-sm/relaxed'>{narration}</p>
            {slider}
            <StepControls step={step} total={total} onPrev={onPrev} onNext={onNext} onReset={onReset} onJump={onJump} />
          </div>
        )}
      </Card>
    </div>
  );
}
