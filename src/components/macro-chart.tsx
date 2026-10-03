'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ChartContainer } from '@/components/chart-container';
import { IndicatorCard } from '@/components/indicator-card';
import { LineSeries, useChart, type IChartApi, type ISeriesApi } from '@/hooks/use-chart';
import { withLivePoint, type LivePoint } from '@/lib/series';
import { cn, formatPct } from '@/lib/utils';

export type MacroLine = {
  label?: string;
  data: { time: string; value: number }[];
  color: string;
};

// 기간 탭. 기본은 '전체'라 탭을 건드리지 않으면 예전과 같은 그림이 나온다.
// 좁히는 쪽으로만 동작하므로 라우트가 내려보내는 기간(거시 최근 2년, stocks 2020-01-01부터,
// strategy 2020-08-01부터)이 이 표의 상한이다. 여기 없는 기간을 보고 싶으면 탭이 아니라
// 로더(src/lib/loaders/)가 `fetchYahooSeries`에 넘기는 기간을 고친다.
const RANGES = [
  { value: '1m', label: '1개월', days: 30 },
  { value: '6m', label: '6개월', days: 182 },
  { value: '1y', label: '1년', days: 365 },
  { value: 'all', label: '전체', days: Number.POSITIVE_INFINITY },
] as const;

type RangeKey = (typeof RANGES)[number]['value'];

/**
 * 관측 주기. 월간 시계열(FRED `FEDFUNDS`, CPI·M2)은 관측일이 매월 1일이고 그 달이 끝난 뒤에
 * 공표되므로, 최신 점이 거의 늘 30일보다 오래됐다. 그래서 월간이면 1개월 탭을 그리지 않고,
 * 마지막 두 점의 변화를 "전일"이 아니라 "전월"로 적는다.
 */
export type MacroFrequency = 'daily' | 'monthly';

const MONTHLY_HIDDEN: readonly RangeKey[] = ['1m'];

// 구간 안에 관측값이 하나도 없으면 빈 배열이다. 원본 전체를 돌려주면 좁힌 탭이 전 기간을
// 그리고, 전 기간 수익률이 좁힌 기간의 값처럼 찍힌다.
function sliceRange<T extends { time: string }>(points: T[], range: RangeKey): T[] {
  const days = RANGES.find((r) => r.value === range)?.days ?? Number.POSITIVE_INFINITY;
  if (!Number.isFinite(days)) return points;
  const cutoff = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
  const start = points.findIndex((p) => p.time >= cutoff);
  if (start === -1) return [];
  return start === 0 ? points : points.slice(start);
}

// %p(산술 차이) 표기. utils.ts의 표기 함수에 %p가 없어 여기 둔다. 부호 규칙은 formatPct와 같다.
function formatPp(n: number, digits: number): string {
  const text = Math.abs(n).toFixed(digits);
  const sign = !/[1-9]/.test(text) ? '' : n < 0 ? '−' : '+';
  return `${sign}${text}%p`;
}

function RangeTabs({
  value,
  onChange,
  frequency,
}: {
  value: RangeKey;
  onChange: (v: RangeKey) => void;
  frequency: MacroFrequency;
}) {
  const ranges = frequency === 'monthly' ? RANGES.filter((r) => !MONTHLY_HIDDEN.includes(r.value)) : RANGES;
  // 버튼 높이 24px(py-1)는 WCAG 2.5.8 최소 대상 크기다. py-0.5(20px)였을 때 360px 폭에서 탭 넷이
  // 2px 간격으로 붙어 손끝으로 옆 탭을 누르기 쉬웠다.
  return (
    <div className='flex shrink-0 gap-0.5 rounded-md bg-muted p-0.5'>
      {ranges.map((r) => (
        <button
          key={r.value}
          type='button'
          aria-pressed={value === r.value}
          onClick={() => onChange(r.value)}
          className={cn(
            'rounded px-2 py-1 text-3xs transition-colors',
            value === r.value ? 'bg-background font-semibold shadow-xs' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}

type Props = {
  title: string;
  currentLabel?: string;
  /** 마지막 두 점의 상대 변화율(%). `changeDiff`를 넘기면 쓰지 않는다. */
  changePercent?: number | null;
  /**
   * 변화를 비율이 아니라 산술 차이(%p)로 적는다. 스프레드처럼 0을 오가는 값은 상대 변화율의
   * 분모가 음수나 0이 되어 방향이 뒤집히거나 뜻이 없어진다. 넘기면 헤드라인의 변화와 기간 탭의
   * 구간 변화가 모두 `끝 − 시작`을 %p로 적는다. 값은 마지막 두 점의 차이다.
   */
  changeDiff?: { value: number | null; digits?: number };
  /** 관측 주기. 기본은 일봉(`daily`). */
  frequency?: MacroFrequency;
  /** 첫 데이터가 없는 채로 요청이 실패했다. 스켈레톤 대신 실패 문구를 보인다. */
  error?: boolean;
  lines?: MacroLine[];
  /**
   * 첫 선의 끝에 얹을 실시간 시세(`withLivePoint`). `lines`는 하루 한 번 바뀌는 히스토리 그대로 넘긴다.
   * 시세가 바뀌면 차트를 다시 만들지 않고 끝점만 옮겨서, 확대·이동해 둔 화면이 5분마다 풀리지 않는다.
   * 헤드라인 값(`currentLabel`·`changePercent`)은 호출부가 같은 점을 얹어(`withLive`) 계산한다.
   */
  live?: LivePoint | null;
  updatedLabel?: string;
  resetRef?: React.RefObject<(() => void) | null>;
  description?: string;
  /**
   * 커서가 놓인 지점의 값을 헤드라인에 찍을 때 쓰는 포매터. 넘기지 않으면 커서를 올려도
   * 헤드라인이 현재값 그대로다. 호출부가 통화·자릿수를 알고 있으므로 여기서 짐작하지 않는다.
   */
  formatValue?: (value: number) => string;
};

export function MacroChart({
  title,
  currentLabel,
  changePercent,
  changeDiff,
  frequency = 'daily',
  error,
  lines,
  live,
  updatedLabel,
  resetRef,
  description,
  formatValue,
}: Props) {
  const [range, setRange] = useState<RangeKey>('all');
  const [hover, setHover] = useState<{ time: string; value: number } | null>(null);

  // 차트를 만드는 기준은 히스토리(`base`)뿐이다. 시세까지 넣으면 5분마다 차트가 새로 만들어진다.
  const base = useMemo(() => lines?.map((l) => ({ ...l, data: sliceRange(l.data, range) })), [lines, range]);
  // 화면에 실제로 그려진 모양. 커서 값·구간 수익률·빈 구간 판정은 시세를 얹은 이쪽을 읽는다.
  const shown = useMemo(
    () => base?.map((l, i) => (i === 0 && live ? { ...l, data: withLivePoint(l.data, live) } : l)),
    [base, live],
  );

  // 커서 값은 첫 번째 선에서만 읽는다. 선이 여럿인 차트(국채 10Y·2Y·30Y, WTI·브렌트)는
  // 헤드라인이 가리키는 선을 첫 선으로 넘긴다. 그래야 둘이 어긋나지 않는다.
  // 구독은 차트를 만들 때 한 번 걸리므로, 끝점이 바뀐 뒤에도 최신 표를 읽게 ref로 둔다.
  const primaryRef = useRef(new Map<string, number>());
  useEffect(() => {
    primaryRef.current = new Map(shown?.[0]?.data.map((p) => [p.time, p.value]));
  }, [shown]);
  const primarySeries = useRef<ISeriesApi<'Line'> | null>(null);

  const setup = useCallback(
    (chart: IChartApi) => {
      primarySeries.current = null;
      if (!shown) return;
      shown.forEach((line, i) => {
        const series = chart.addSeries(LineSeries, {
          color: line.color,
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: true,
          ...(line.label ? { title: line.label } : {}),
        });
        series.setData(line.data);
        if (i === 0) primarySeries.current = series;
      });

      if (!formatValue) return;
      chart.subscribeCrosshairMove((param) => {
        const time = typeof param.time === 'string' ? param.time : null;
        const value = time != null ? primaryRef.current.get(time) : undefined;
        setHover(time != null && value != null ? { time, value } : null);
      });
    },
    [shown, formatValue],
  );

  const { containerRef, resetView } = useChart(setup, [base], { height: 240, resetRef });

  // 시세만 바뀌었으면 끝점 하나를 옮긴다. `withLivePoint`가 버리는 이른 시세는 여기서도 건너뛴다
  // (update는 마지막 봉보다 이른 시각을 받으면 예외를 던진다). 차트를 새로 만든 직후에는 setup이
  // 이미 얹어 그렸으므로 같은 점을 한 번 더 넣는 것이라 무해하다.
  useEffect(() => {
    const series = primarySeries.current;
    const last = base?.[0]?.data.at(-1);
    if (!series || !live || (last && live.time < last.time)) return;
    series.update(live);
  }, [base, live]);

  // 구간 수익률은 좁혔을 때만 보인다. '전체'에서는 헤드라인 옆 숫자가 예전처럼 전일 대비
  // 하나뿐이라, 탭을 건드리지 않은 화면은 이전과 같은 것을 말한다.
  const rangeChange = useMemo(() => {
    if (range === 'all') return null;
    const points = shown?.[0]?.data;
    if (!points || points.length < 2) return null;
    const first = points[0].value;
    const last = points[points.length - 1].value;
    if (changeDiff) return last - first;
    if (first === 0) return null;
    return ((last - first) / first) * 100;
  }, [shown, range, changeDiff]);

  const rangeLabel = RANGES.find((r) => r.value === range)?.label;
  const headlineValue = hover && formatValue ? formatValue(hover.value) : currentLabel;
  const change = changeDiff ? changeDiff.value : changePercent;
  const diffDigits = changeDiff?.digits ?? 2;
  // 방향은 화살표가 말하므로 크기만 적는다.
  const changeText = (v: number) => (changeDiff ? `${Math.abs(v).toFixed(diffDigits)}%p` : `${Math.abs(v)}%`);
  // 오르면 빨강(`text-up`), 내리면 파랑(`text-down`)이다. 이 색은 좋고 나쁨이 아니라 방향만 뜻한다
  // (globals.css 등락 색). 오르는 것이 좋은지는 자산마다 달라서(VIX·달러/원) 판정 색(good/bad)은 쓰지 않는다.
  // 찍히는 크기가 0이면(연준 기준금리가 동결된 달 등) 화살표 없이 '보합'으로 적고 흐리게 둔다.
  // 반올림해 0이 된 값도 같다.
  const changeTone = (text: string, value: number) =>
    !/[1-9]/.test(text) ? 'text-muted-foreground' : value > 0 ? 'text-up' : 'text-down';
  const rangeText =
    rangeChange == null
      ? null
      : changeDiff
        ? formatPp(rangeChange, diffDigits)
        : formatPct(rangeChange, 1, { plus: true });
  // 좁힌 탭에 관측값이 하나도 없다(갱신이 멈춘 일봉 등). 빈 차트만 두면 고장으로 읽힌다.
  const emptyRange = range !== 'all' && !!shown?.[0] && shown[0].data.length === 0;

  return (
    <IndicatorCard
      title={title}
      updatedLabel={updatedLabel}
      action={<RangeTabs value={range} onChange={setRange} frequency={frequency} />}
      ready={!!lines}
      error={error}
      headlineSkeletonClass='h-8 w-32'
      headline={
        <div>
          <div className='flex items-end gap-2'>
            <span className='text-2xl font-bold tabular-nums'>{headlineValue}</span>
            {change != null && (
              <span className={cn('mb-1 text-sm font-semibold', changeTone(changeText(change), change))}>
                {frequency === 'monthly' ? '전월' : '전일'}{' '}
                {/[1-9]/.test(changeText(change)) ? `${change > 0 ? '▲' : '▼'} ${changeText(change)}` : '보합'}
              </span>
            )}
            {rangeText != null && (
              <span className={cn('mb-1 text-sm', changeTone(rangeText, rangeChange ?? 0))}>
                {rangeLabel} {rangeText}
              </span>
            )}
          </div>
          {/* 커서가 올라간 동안에만 날짜가 뜬다. 평소에는 자리만 지켜 카드 높이가 흔들리지 않는다.
              상대시간은 서버 렌더와 하이드레이션 사이에 분이 넘어가면 텍스트가 어긋난다 */}
          <p className='h-4 text-3xs text-muted-foreground tabular-nums' suppressHydrationWarning>
            {hover
              ? `${hover.time} 기준`
              : emptyRange
                ? '이 기간에 관측값이 없습니다'
                : updatedLabel
                  ? `${updatedLabel} 갱신`
                  : ''}
          </p>
        </div>
      }
      height={240}
      chart={<ChartContainer containerRef={containerRef} onReset={resetView} />}
      description={description}
    />
  );
}
