'use client';

import { ChevronDown, Pause, Play, RotateCcw, StepForward, TriangleAlert } from 'lucide-react';

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
export function SegmentedControl<T extends string | boolean>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className='flex overflow-hidden rounded-md border'>
      {options.map((o) => (
        <button
          key={String(o.value)}
          onClick={() => onChange(o.value)}
          className={cn(
            'flex-1 px-2 py-1.5 text-sm transition-colors',
            value === o.value ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
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

// 임계값 캐스케이드 시각화 한 벌. 채택 캐스케이드·홀더 딜레마·자연의 파워 프로젝션이
// 공유한다. 세 시뮬레이션 모두 행위자를 하나의 축(임계값·확신도·투사력) 오름차순으로
// 정렬해 두므로 상태가 바뀐 집합이 언제나 격자 앞에서부터의 연속 구간이 되고, 그
// 경계의 위치가 곧 진행률이 된다(docs/adr/0001 참조). 축 라벨·읽는 법·범례·궤적
// 스파크라인이 함께 있어야 그 경계가 읽히므로 한 컴포넌트로 묶었다.
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
