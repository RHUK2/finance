'use client';

import { createContext, type ReactNode, type RefObject, useContext, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { Field as FieldPrimitive } from '@base-ui/react/field';

import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  StepForward,
  TriangleAlert,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Panel } from '@/components/panel';
import { type Tone, TONE_BORDER_SURFACE, TONE_TEXT } from '@/components/tone';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCountUp } from '@/hooks/use-count-up';
import { clamp, cn, formatUsd } from '@/lib/utils';

// 인터랙티브 시뮬레이션·설명 페이지(게임이론·소프트워·변동성 등)가 공유하는 UI 프리미티브.

// 행위자나 포지션의 격자. 상태별 배경색 className 배열을 받아 사각형으로 렌더링.
// 라운드마다 색이 바뀌며 transition-colors로 부드럽게 전환된다.
//
// orientation='column'은 칸을 위→아래, 다음 열 순서로 채운다. states가 어떤 기준으로
// 정렬돼 있고 상태 전이가 항상 앞에서부터 일어나는 시뮬레이션(임계값 캐스케이드 등)에서
// 경계가 수직선으로 전진해 보인다. 기본값 'row'는 기존 동작(행 우선, 반응형 열 수)이다.
// highlight[i]가 true면 그 칸에 링을 둘러 이번 라운드에 바뀐 칸을 짚어 준다.
function AgentGrid({
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
    <div className={cn('grid', orientation === 'column' ? 'gap-0.5 sm:gap-1' : 'gap-1')} style={style}>
      {states.map((c, i) => (
        <div
          key={i}
          className={cn(
            'aspect-square rounded-xs transition-colors duration-300',
            c,
            highlight?.[i] && 'ring-1 ring-foreground sm:ring-2',
          )}
        />
      ))}
    </div>
  );
}

// ui/slider는 value를 배열로 받아야 썸을 하나만 그린다(숫자를 주면 [min, max]로 보고 둘을 그린다).
// onValueChange 쪽은 number | readonly number[]라 여기서 좁힌다. 이 파일의 슬라이더는 모두 단일 썸이다.
function sliderValue(v: number | readonly number[]) {
  return typeof v === 'number' ? v : v[0];
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
  const seekLabelId = useId();
  return (
    <div className='flex flex-col gap-2'>
      <div className='flex flex-wrap items-center gap-2'>
        <Button size='sm' onClick={onToggle} disabled={done}>
          {playing ? <Pause className='size-4' /> : <Play className='size-4' />}
          {playing ? '일시정지' : done ? '완료' : '재생'}
        </Button>
        <Button size='sm' variant='outline' onClick={onStep} disabled={playing || done}>
          <StepForward className='size-4' />한 {unit}
        </Button>
        <Button size='sm' variant='outline' onClick={onReset}>
          <RotateCcw className='size-4' />
          리셋
        </Button>
        <div className='ml-auto flex items-center gap-2'>
          <span className='text-sm text-muted-foreground tabular-nums'>
            {unit} {round}
            {seekable && ` / ${total}`}
          </span>
          <div className='flex overflow-hidden rounded-md border'>
            {speeds.map((s) => (
              <button
                key={s.ms}
                type='button'
                onClick={() => onSpeed(s.ms)}
                aria-pressed={speedMs === s.ms}
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
        <>
          {/* Base UI는 루트의 aria-label을 group div에 두고 range input으로 넘기지 않는다.
              aria-labelledby는 input까지 간다. */}
          <span id={seekLabelId} className='sr-only'>
            {unit} 이동
          </span>
          <Slider
            value={[round]}
            onValueChange={(v) => onSeek(sliderValue(v))}
            min={0}
            max={total}
            step={1}
            aria-labelledby={seekLabelId}
          />
        </>
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
  disabled,
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
  /**
   * 지금 조건에서 이 슬라이더가 결과를 바꾸지 못할 때 켠다. 숨기지 않는 이유는
   * 다른 조건에서는 살아난다는 사실이 설명의 일부이기 때문이다(CLAUDE.md 「시뮬레이션 공용
   * 프리미티브」의 "지금 조건에서 결과를 못 바꾸는 컨트롤").
   */
  disabled?: boolean;
}) {
  const labelId = useId();
  const log = scale === 'log';
  const ratio = log ? Math.log(max / min) : 0;
  const toTick = (v: number) => Math.round((LOG_TICKS * Math.log(v / min)) / ratio);
  const fromTick = (t: number) => min * Math.exp((ratio * t) / LOG_TICKS);

  // 한 칸씩 옮기는 버튼. 좁은 화면에서는 끌기만으로 원하는 값을 맞출 수 없다. 360px 폭에서
  // 0~100이면 한 칸이 3.6px이고, 로그 스케일은 구간에 따라 그보다 촘촘하다.
  // 한 칸의 크기를 끌기와 같게 두려고 로그에서도 눈금 하나를 옮긴다(값의 비율이 아니라).
  const nudge = (dir: 1 | -1) => {
    if (log) {
      const tick = Math.min(LOG_TICKS, Math.max(0, toTick(value) + dir));
      onChange(Number(fromTick(tick).toPrecision(4)));
      return;
    }
    const digits = (String(step).split('.')[1] ?? '').length;
    onChange(Number(Math.min(max, Math.max(min, value + dir * step)).toFixed(digits)));
  };

  return (
    <div className='flex flex-col gap-1.5'>
      {/* Slider는 data-disabled로 스스로 흐려지므로 래퍼에는 걸지 않는다. 라벨·힌트만 맞춘다. */}
      <div className={cn('flex items-center justify-between gap-2 text-sm', disabled && 'opacity-60')}>
        <span className='flex min-w-0 items-center gap-1.5 font-medium'>
          {icon}
          <span id={labelId} className='truncate'>
            {label}
          </span>
        </span>
        <span className='flex shrink-0 items-center gap-1'>
          <Button
            variant='outline'
            size='icon-sm'
            disabled={disabled || value <= min}
            onClick={() => nudge(-1)}
            className='text-muted-foreground'
            aria-label={`${label} 한 칸 줄이기`}
          >
            <Minus className='size-3.5' />
          </Button>
          <span className='min-w-20 text-center tabular-nums'>{format(value)}</span>
          <Button
            variant='outline'
            size='icon-sm'
            disabled={disabled || value >= max}
            onClick={() => nudge(1)}
            className='text-muted-foreground'
            aria-label={`${label} 한 칸 늘리기`}
          >
            <Plus className='size-3.5' />
          </Button>
        </span>
      </div>
      {/* 이름은 화면 라벨을, 값은 화면에 찍힌 표기를 읽게 한다. 로그 슬라이더의 손잡이 값은
          금액이 아니라 눈금 번호라 값 문구가 없으면 보조기술이 눈금을 읽는다. */}
      {log ? (
        <Slider
          min={0}
          max={LOG_TICKS}
          step={1}
          value={[toTick(value)]}
          onValueChange={(v) => onChange(fromTick(sliderValue(v)))}
          disabled={disabled}
          aria-labelledby={labelId}
          getAriaValueText={(_, t) => format(fromTick(t))}
        />
      ) : (
        <Slider
          min={min}
          max={max}
          step={step}
          value={[value]}
          onValueChange={(v) => onChange(sliderValue(v))}
          disabled={disabled}
          aria-labelledby={labelId}
          getAriaValueText={(_, v) => format(v)}
        />
      )}
      {hint && <p className={cn('text-xs text-muted-foreground', disabled && 'opacity-60')}>{hint}</p>}
    </div>
  );
}

// 값이 아직 없거나(분기 전, 재생 시작 전) 데이터가 없는 칸의 자리표시. 대시보드가 값 없음을
// 찍는 문자와 같게 둔다.
const EMPTY_VALUE = '-';

// 지표 카드. value가 null이면 값 자리에 흐린 자리표시를 찍고 tone은 무시한다. 칸을 지우지 않고
// 남겨 두는 것은 격자의 자리가 단계마다 같아야 어느 칸이 무엇인지 따라 읽을 수 있어서다.
export function Metric({
  label,
  value,
  tone,
  sub,
}: {
  label: string;
  value: string | null;
  tone?: Tone;
  sub?: string;
}) {
  return (
    <Panel className='gap-1'>
      <span className='text-xs text-muted-foreground'>{label}</span>
      <span
        className={cn(
          'text-xl font-semibold tabular-nums sm:text-2xl',
          value === null ? 'text-muted-foreground' : tone && TONE_TEXT[tone],
        )}
      >
        {value ?? EMPTY_VALUE}
      </span>
      {sub && <span className='text-xs text-muted-foreground'>{sub}</span>}
    </Panel>
  );
}

// 아이콘 + 한 줄 메시지로 결과를 알리는 배너. tone은 Metric과 같은 어휘(good/bad/accent)를 쓴다.
// 판정색은 면·테두리와 아이콘(호출부가 칠한다)에만 둔다. 문구는 기본 전경색이다.
//
// detail을 주면 두 줄 배너가 된다. children이 판정 한 줄, detail이 그 아래 근거 줄(흐린 글자)이다.
// 두 줄이면 아이콘을 첫 줄 높이에 맞춰 위로 붙인다. 가운데 정렬로 두면 아이콘이 두 줄 사이에
// 떠서 어느 줄의 표시인지 흐려진다.
export function StatusBanner({
  icon,
  tone,
  detail,
  children,
}: {
  icon?: React.ReactNode;
  tone?: Tone;
  detail?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex gap-2 rounded-md border p-3 text-sm font-medium',
        detail ? 'items-start' : 'items-center',
        tone ? TONE_BORDER_SURFACE[tone] : 'border-transparent bg-muted',
      )}
    >
      {detail ? (
        <>
          {icon && <span className='flex h-5 shrink-0 items-center'>{icon}</span>}
          <div className='flex min-w-0 flex-col gap-1'>
            <span>{children}</span>
            <div className='font-normal text-muted-foreground'>{detail}</div>
          </div>
        </>
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
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
  tone?: Tone;
  sub?: string;
}) {
  const animated = useCountUp(value);
  return <Metric label={label} value={format(animated)} tone={tone} sub={sub} />;
}

// 색 견본 + 라벨 범례 항목.
export function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className='flex items-center gap-1.5'>
      <span className={cn('size-3 rounded-xs', className)} />
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
    <Collapsible render={<Panel bleed className='group/explain' />}>
      <CollapsibleTrigger className='flex w-full items-start gap-2 p-4 text-left transition-colors hover:bg-muted/50'>
        <div className='flex-1'>
          <span className='flex items-center gap-1.5 font-semibold'>
            {icon}
            {title}
          </span>
          {preview && (
            <span className='mt-1 line-clamp-1 block text-sm text-muted-foreground group-data-open/explain:hidden'>
              {preview}
            </span>
          )}
        </div>
        <ChevronDown className='mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-data-open/explain:rotate-180' />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className='p-4 text-sm/relaxed text-muted-foreground'>{body}</div>
      </CollapsibleContent>
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

type SimTab = {
  value: string;
  label: React.ReactNode;
  node: React.ReactNode;
};

export function SimTabs({ tabs, defaultValue }: { tabs: SimTab[]; defaultValue: string }) {
  const isOdd = tabs.length % 2 === 1;
  return (
    <Tabs defaultValue={defaultValue}>
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
              'min-h-9 text-center whitespace-normal',
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
//
// Base UI Field로 감싸는 것은 라벨을 입력의 이름으로 잇기 위해서다. ui/input·ui/select의
// 트리거는 Field 안에 있으면 스스로 등록해 <label for>가 그쪽을 가리킨다. 등록할 입력이 없는
// 버튼 묶음(SegmentedControl)은 FieldLabelContext로 라벨 id를 받아 group의 이름으로 쓴다.
const FieldLabelContext = createContext<string | undefined>(undefined);

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const labelId = useId();
  return (
    <FieldPrimitive.Root className='flex flex-col gap-1.5'>
      <FieldPrimitive.Label id={labelId} className='text-sm font-medium'>
        {label}
      </FieldPrimitive.Label>
      <FieldLabelContext value={labelId}>{children}</FieldLabelContext>
    </FieldPrimitive.Root>
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
  const labelId = useContext(FieldLabelContext);
  return (
    <div
      role='group'
      aria-labelledby={labelId}
      className={cn('flex overflow-hidden rounded-md border', disabled && 'opacity-50')}
    >
      {options.map((o) => (
        <button
          key={String(o.value)}
          type='button'
          onClick={() => onChange(o.value)}
          disabled={disabled}
          aria-pressed={value === o.value}
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
    <Panel tone='accent' className='gap-2 text-sm/relaxed'>
      <span className={cn('flex items-center gap-1.5 font-semibold', TONE_TEXT.accent)}>
        <TriangleAlert className='size-4' />
        교육용 개념 시연
      </span>
      <p className='text-muted-foreground'>{children}</p>
    </Panel>
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
  const labelId = useId();
  return (
    <div className='flex items-center gap-2'>
      <span id={labelId} className='w-16 shrink-0 text-xs text-muted-foreground'>
        {label}
      </span>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio='none'
        className={cn('w-full', heightClass)}
        role='img'
        aria-labelledby={labelId}
      >
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

// 라벨 + 금액 + 수평 비교 막대 (max 대비 비율로 폭 결정). 총량 없는 개별 크기 비교용.
//
// icon은 라벨 앞 주제 아이콘. aside는 값 뒤에 흐린 글자로 붙는 보조 값이다(받은 액 뒤의
// "/ 청구액", 수수료 뒤의 크기처럼 같은 행의 두 번째 수). 막대 폭은 언제나 value가 정한다.
// 값이 0이면 폭도 0이다. 0보다 크면 1%를 남겨 아주 작은 값도 막대가 있다는 것이 보이게 한다.
export function CostBar({
  icon,
  label,
  value,
  max,
  className,
  sub,
  aside,
  format = formatUsd,
}: {
  icon?: React.ReactNode;
  label: string;
  value: number;
  max: number;
  className: string;
  sub?: string;
  aside?: React.ReactNode;
  format?: (v: number) => string;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className='flex flex-col gap-1'>
      <div className='flex items-baseline justify-between gap-2 text-xs'>
        <span className='flex min-w-0 items-center gap-1.5 text-muted-foreground'>
          {icon}
          {label}
        </span>
        <span className='shrink-0 tabular-nums'>
          {format(value)}
          {aside && <span className='text-muted-foreground'> {aside}</span>}
        </span>
      </div>
      <div className='h-5 w-full overflow-hidden rounded-md bg-muted'>
        <div
          className={cn('h-full rounded-md transition-all', className)}
          style={{ width: `${value > 0 ? Math.max(1, pct) : 0}%` }}
        />
      </div>
      {sub && <span className='text-xs text-muted-foreground'>{sub}</span>}
    </div>
  );
}

// 탭 섹션 상단 제목 + 설명.
export function SectionIntro({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className='text-lg font-semibold'>{title}</h2>
      <p className='mt-1 text-sm/relaxed text-muted-foreground'>{children}</p>
    </div>
  );
}

// 임계값 캐스케이드 시각화 한 벌. 채택 캐스케이드·홀더 딜레마·자연의 파워 프로젝션·
// 강제청산 연쇄가 공유한다. 넷 모두 개체를 하나의 정렬 축(임계값·확신도·투사력·청산 낙폭)
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
  outcome?: { tone?: Tone; text: string };
}) {
  return (
    <>
      <Panel className='gap-3'>
        {notice}
        {controls}
        <div className='flex flex-col gap-1.5'>
          <div className='flex items-center justify-between text-xs text-muted-foreground'>
            <span>{axisLabels[0]}</span>
            <span>{axisLabels[1]}</span>
          </div>
          <AgentGrid states={states} orientation='column' highlight={highlight} />
          <p className='text-xs text-muted-foreground'>{reading}</p>
        </div>
        <div className='flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground'>
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
      </Panel>

      <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>{metrics}</div>

      {/* 결론 한 줄은 다른 판정 배너와 같은 StatusBanner로 그린다(CLAUDE.md 「고르는 기준」). */}
      {outcome && <StatusBanner tone={outcome.tone}>{outcome.text}</StatusBanner>}
    </>
  );
}

// 하나의 총량이 여러 몫으로 갈리는 것을 보여 주는 가로 누적 막대 + 범례.
// 총량이 고정된 파이를 나누는 그림(자본구조, 지분 구성, 이익의 분배, 발전량 배분)에서 쓴다.
// 막대 폭은 value/total로만 정해지므로, 라벨의 단위는 호출하는 쪽이 정해서 넘긴다.
//
// 값이 0인 몫은 막대에서 빠진다. keepEmpty를 켜면 범례에는 남는다. 몫의 주인이 정해져 있어
// 0이 된 것 자체가 읽을거리인 그림(채널의 한쪽 잔고가 0)에서 쓴다. 기본은 범례에서도 뺀다.
export function StackedBar({
  segments,
  total,
  keepEmpty = false,
}: {
  segments: { label: string; value: number; className: string }[];
  total: number;
  keepEmpty?: boolean;
}) {
  // total이 0인 순간(발전량 0 등)에도 폭이 NaN이 되지 않게 막는다.
  const shown = total > 0 ? segments.filter((s) => s.value > 0) : [];
  const legend = keepEmpty ? segments : shown;
  return (
    <>
      <div className='flex h-8 w-full overflow-hidden rounded-md bg-muted'>
        {shown.map((s) => (
          <div
            key={s.label}
            title={s.label}
            className={cn('h-full transition-all', s.className)}
            style={{ width: `${(s.value / total) * 100}%` }}
          />
        ))}
      </div>
      <div className='flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground'>
        {legend.map((s) => (
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
  4: 'grid-cols-[1fr_2.25rem_2.25rem_2.25rem_2.25rem] sm:grid-cols-[1fr_4.5rem_4.5rem_4.5rem_4.5rem]',
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
    <Panel bleed>
      <div className='flex flex-col gap-1 p-4'>
        <span className='flex items-center gap-1.5 text-sm font-semibold'>
          {icon}
          {title}
        </span>
        <span className='text-xs text-muted-foreground'>항목을 누르면 표 아래에 설명이 열린다</span>
      </div>
      {/* 머리글은 눈으로 칸을 맞추는 줄이다. 보조기술에는 칸마다 머리글 이름을 붙여 읽히므로 숨긴다. */}
      <div aria-hidden className={cn(grid, 'border-y px-4 py-2 text-xs text-muted-foreground')}>
        {headers.map((h, i) => (
          <span key={h} className={i === 0 ? undefined : 'text-center'}>
            {h}
          </span>
        ))}
      </div>
      {rows.map((r) => (
        <button
          key={r.id}
          type='button'
          onClick={() => onSelect(r.id)}
          aria-pressed={selected === r.id}
          className={cn(
            grid,
            'border-b px-4 py-2.5 text-left text-sm transition-colors last:border-b-0',
            selected === r.id ? 'bg-muted' : 'hover:bg-muted/50',
          )}
        >
          <span className={cn('flex', r.icon ? 'items-center gap-2' : 'flex-col')}>
            {r.icon && <r.icon className='size-4 shrink-0 text-muted-foreground' />}
            {r.label}
            {r.sub && <span className='text-xs text-muted-foreground'>{r.sub}</span>}
          </span>
          {r.marks.map((m, i) => (
            <Mark key={i} state={m} header={headers[i + 1]} />
          ))}
        </button>
      ))}
    </Panel>
  );
}

// 아이콘은 lucide 기본값대로 aria-hidden이라, 칸의 뜻은 sr-only 문구로 따로 둔다. 잣대가 질문형인
// 표와 속성형인 표가 섞여 있어 문구는 어느 쪽에도 읽히는 예·아니오·일부로 둔다.
const MARK_TEXT: Record<MarkState, string> = { yes: '예', no: '아니오', partial: '일부' };
const MARK_TONE: Record<MarkState, Tone> = { yes: 'good', no: 'bad', partial: 'accent' };
const MARK_ICON: Record<MarkState, typeof Check> = { yes: Check, no: X, partial: Minus };

function Mark({ state, header }: { state: MarkState; header: string }) {
  const Icon = MARK_ICON[state];
  return (
    <span className='flex justify-center'>
      <span className='sr-only'>
        {header}: {MARK_TEXT[state]}
      </span>
      <Icon className={cn('size-4', TONE_TEXT[MARK_TONE[state]])} />
    </span>
  );
}

// 서사형 워크스루의 단계 컨트롤. 현재 단계의 제목·해설과 이동 버튼을 함께 들고
// 있다. RoundControls가 자동 재생·속도 조절이 달린 시뮬레이션용인
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
            type='button'
            aria-label={`${i}단계로 이동`}
            aria-current={i === step ? 'step' : undefined}
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

/** 요소가 화면에 조금이라도 걸쳐 있는가. 처음에는 false라 서버 렌더와 어긋나지 않는다. */
function useInView(ref: RefObject<Element | null>, of: (el: Element) => Element | null = (el) => el) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current && of(ref.current);
    if (!el) return;
    // 한 번에 여러 항목이 오면 뒤가 최신이다. 첫 항목만 읽으면 레이아웃이 연달아 바뀔 때 낡은 값에 멈춘다.
    const io = new IntersectionObserver((entries) => setInView(entries[entries.length - 1].isIntersecting));
    io.observe(el);
    return () => io.disconnect();
    // of는 호출부마다 고정된 화살표 함수라 의존성에서 뺀다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref]);
  return inView;
}

// 해설 패널은 본문 속 제자리에 두고 아무것도 고정하지 않는다. 대신 패널이 화면 밖으로
// 나갔는데 워크스루 섹션(패널의 부모)은 아직 보일 때만, 이전·다음 알약을 화면 아래에 띄운다.
//
// 예전에는 패널 전체를 sticky로 하단에 붙였다. sticky는 부모 윗변보다 위로 못 올라가서
// 부모가 화면 아래쪽에서 시작하면 패널이 고정선보다 밀려 내려가 모바일 하단 네비를
// 덮었고, 펼친 해설이 본문을 계속 가렸다. 워크스루 내내 필요한 것은 해설 전체가 아니라
// 다음 단계 버튼이라 고정하는 것을 한 줄로 줄였다.
//
// 알약은 모바일에서 화면 아래 가운데에 뜬다. 예전에는 오른쪽 아래에 떠 있던 맨 위로
// 버튼과 겹쳐서 이 패널을 쓰는 페이지가 그 버튼을 껐는데, 지금은 그 버튼이 하단 바
// 안으로 들어가(mobile-nav-drawer.tsx) 겹칠 면이 없다.
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
  const panel = useRef<HTMLDivElement>(null);
  const panelInView = useInView(panel);
  const sectionInView = useInView(panel, (el) => el.parentElement);
  const showPill = sectionInView && !panelInView;

  return (
    <>
      <div ref={panel}>
        <Panel bleed>
          <div className='flex items-center gap-2 px-3 py-2'>
            <span className='flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs leading-none font-semibold text-primary-foreground'>
              <span className='translate-y-px'>{step}</span>
            </span>
            <span className='flex-1 truncate font-semibold'>{title}</span>
          </div>
          <div className='flex flex-col gap-3 border-t p-3'>
            <p className='text-sm/relaxed text-muted-foreground'>{narration}</p>
            {slider}
            <StepControls step={step} total={total} onPrev={onPrev} onNext={onNext} onReset={onReset} onJump={onJump} />
          </div>
        </Panel>
      </div>
      {showPill &&
        createPortal(
          // 하단 네비(h-12, z-30) 바로 위. 네비와 겹치지 않으므로 z는 본문 위이기만 하면 된다.
          <div className='fixed bottom-[calc(3.5rem+var(--spacing-safe-bottom))] left-1/2 z-20 -translate-x-1/2 md:bottom-4'>
            <div className='flex items-center gap-1 rounded-full border bg-card p-1 shadow-xl'>
              <Button
                variant='ghost'
                size='icon'
                shape='pill'
                onClick={onPrev}
                disabled={step === 0}
                aria-label='이전 단계'
              >
                <ChevronLeft className='size-4' />
              </Button>
              <Button
                variant='ghost'
                size='sm'
                shape='pill'
                onClick={() => panel.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                className='max-w-48'
              >
                <span className='truncate'>
                  {step}/{total - 1} · {title}
                </span>
              </Button>
              <Button
                variant='ghost'
                size='icon'
                shape='pill'
                onClick={onNext}
                disabled={step === total - 1}
                aria-label='다음 단계'
              >
                <ChevronRight className='size-4' />
              </Button>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
