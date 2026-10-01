'use client';

import { MobileNavDrawer } from '@/components/mobile-nav-drawer';
import { MacroChart } from '@/components/macro-chart';
import { PageMain } from '@/components/page-main';
import { Button } from '@/components/ui/button';
import { CHART_SERIES } from '@/hooks/use-chart';
import { useCommodities } from '@/hooks/use-commodities';
import { useRelativeTime } from '@/hooks/use-relative-time';
import { formatUsdPrice } from '@/lib/utils';
import { RotateCcw } from 'lucide-react';
import { useMemo, useRef } from 'react';

export function CommoditiesView() {
  const { data, isError } = useCommodities();
  // 첫 데이터 없이 요청이 실패한 상태. 이전 데이터가 있으면 옛 값을 그대로 보인다.
  const failed = isError && !data;

  const goldReset = useRef<(() => void) | null>(null);
  const oilReset = useRef<(() => void) | null>(null);
  const cornReset = useRef<(() => void) | null>(null);

  // 차트를 추가하면 이 배열에도 넣어야 "전체 스케일 초기화"가 함께 적용된다.
  const allResets = [goldReset, oilReset, cornReset];

  function resetAll() {
    allResets.forEach((r) => r.current?.());
  }

  const relTime = useRelativeTime(data?.fetchedAt);

  // lines 배열의 참조를 고정해 useChart가 리렌더마다 차트를 재생성하지 않게 한다
  // (useRelativeTime이 매분 리렌더를 일으키므로 인라인 배열이면 줌 상태까지 초기화된다).
  const chartLines = useMemo(() => {
    if (!data) return undefined;
    return {
      // 선 색은 카드·선을 가를 뿐 뜻이 없어 계열색에서 고른다.
      gold: [{ data: data.gold.history, color: CHART_SERIES[0] }],
      oil: [
        { label: 'WTI', data: data.wti.history, color: CHART_SERIES[3] },
        { label: '브렌트', data: data.brent.history, color: CHART_SERIES[2] },
      ],
      corn: [{ data: data.corn.history, color: CHART_SERIES[1] }],
    };
  }, [data]);

  return (
    <>
      <MobileNavDrawer />
      <PageMain>
        <div className='flex flex-col gap-3'>
          <div className='flex items-center'>
            <Button variant='outline' size='sm' onClick={resetAll}>
              <RotateCcw className='size-3.5' />
              <span className='text-xs'>전체 스케일 초기화</span>
            </Button>
          </div>
          <MacroChart
            title='금 (Gold)'
            currentLabel={data?.gold.current != null ? formatUsdPrice(data.gold.current) : '-'}
            formatValue={(v) => formatUsdPrice(v)}
            changePercent={data?.gold.changePercent ?? null}
            lines={chartLines?.gold}
            updatedLabel={relTime ?? undefined}
            error={failed}
            resetRef={goldReset}
            description='금 선물(COMEX), 대표적 안전자산. 상승은 달러 약세·인플레이션·지정학 불안 또는 실질금리 하락을, 하락은 위험선호 회복이나 실질금리 상승을 반영하는 경향이 있습니다.'
          />
          <MacroChart
            title='원유'
            currentLabel={data?.wti.current != null ? formatUsdPrice(data.wti.current) : '-'}
            formatValue={(v) => formatUsdPrice(v)}
            changePercent={data?.wti.changePercent ?? null}
            lines={chartLines?.oil}
            updatedLabel={relTime ?? undefined}
            error={failed}
            resetRef={oilReset}
            description='WTI(미국 기준)·브렌트(국제 기준) 원유 선물 가격. 상승은 수요 강세(경기 호조)나 공급 차질로 인플레 압력을 키우고, 하락은 수요 둔화(경기 위축)나 공급 과잉을 시사하는 경향이 있습니다.'
          />
          <MacroChart
            title='옥수수 (Corn)'
            currentLabel={data?.corn.current != null ? formatUsdPrice(data.corn.current) : '-'}
            formatValue={(v) => formatUsdPrice(v)}
            changePercent={data?.corn.changePercent ?? null}
            lines={chartLines?.corn}
            updatedLabel={relTime ?? undefined}
            error={failed}
            resetRef={cornReset}
            description='옥수수 선물(CBOT), 부셸당 달러 가격. 식품·바이오에탄올의 핵심 원자재입니다. 상승은 기상 악화·작황 부진이나 에너지 가격 상승에 따른 식량 인플레 압력을, 하락은 공급 안정을 시사하는 경향이 있습니다.'
          />
        </div>
      </PageMain>
    </>
  );
}
