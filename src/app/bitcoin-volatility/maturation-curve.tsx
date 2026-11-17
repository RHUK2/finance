'use client';

import { useMemo } from 'react';

import { ChartContainer } from '@/components/chart-container';
import { ExplainCard, SectionIntro } from '@/components/simulation';
import { Panel } from '@/components/panel';
import { Skeleton } from '@/components/ui/skeleton';
import { CHART_SERIES, LineSeries, useChart } from '@/hooks/use-chart';
import { useBitcoinHistorical } from '@/hooks/use-crypto';
import { rollingVolatility } from '@/lib/bitcoin-models';
import { formatPct } from '@/lib/utils';

const WINDOW = 90;

export function MaturationCurve() {
  const { data, isError } = useBitcoinHistorical();

  const vol = useMemo(() => {
    if (!data) return [];
    return rollingVolatility(data.history, WINDOW);
  }, [data]);

  const { containerRef, resetView } = useChart(
    (chart) => {
      const series = chart.addSeries(LineSeries, {
        color: CHART_SERIES[0],
        lineWidth: 2,
        priceLineVisible: false,
      });
      series.setData(vol);
    },
    [vol],
    { height: 300, timeVisible: true },
  );

  const current = vol[vol.length - 1]?.value;

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='성숙 곡선: 실현 변동성은 추세적으로 하락한다'>
        지금까지의 이야기가 맞다면, 비트코인이 자산으로 자리를 잡아갈수록 실현 변동성은 점점 줄어야 한다. 실제로
        2015년부터 비트코인의 실현 변동성(90일 기준, 연 단위로 환산)을 그려 보면, 2017~2020년에 100%를 훌쩍 넘던 값이
        사이클을 거듭할수록 한 단계씩 낮아진다.
      </SectionIntro>

      <Panel className='gap-3'>
        <div className='flex items-baseline justify-between'>
          <span className='text-sm font-medium'>실현 변동성 (90일 기준, 연 환산)</span>
          {current != null && (
            <span className='text-lg font-semibold text-series-1 tabular-nums'>{formatPct(current, 0)}</span>
          )}
        </div>
        {!data && isError ? (
          <p className='text-sm text-muted-foreground'>가격 데이터를 받지 못했다. 잠시 뒤 다시 시도한다.</p>
        ) : !data ? (
          <Skeleton className='h-[300px] w-full' />
        ) : (
          <ChartContainer containerRef={containerRef} onReset={resetView} />
        )}
      </Panel>

      <ExplainCard
        title='이야기와 데이터가 만나는 지점'
        preview='성공 확률 상승은 실현 변동성 하락을 설명하는 한 가지 가설이다.'
        body='앞 탭의 모델에서는 성공 확률이 높아질수록 같은 크기의 확률 변화가 만드는 상대적인 가격 변화가 작아진다. 이는 실현 변동성 하락을 설명하는 한 가지 가설이다. 실패 쪽으로 향하는 경우까지 실현 변동성 하락을 보장하는 모델은 아니며, 실제 실현 변동성의 하락만으로 성공 확률이 높아졌다고 단정할 수도 없다.'
      />
    </div>
  );
}
