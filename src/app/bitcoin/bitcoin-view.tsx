'use client';

import { useRef } from 'react';
import { RotateCcw } from 'lucide-react';

import { AppHeader } from '@/components/app-header';
import { FearGreedChart } from '@/components/fear-greed-chart';
import { MayerMultipleChart } from '@/components/mayer-multiple-chart';
import { MvrvZScoreChart } from '@/components/mvrv-zscore-chart';
import { PageMain } from '@/components/page-main';
import { PiCycleChart } from '@/components/pi-cycle-chart';
import { PuellMultipleChart } from '@/components/puell-multiple-chart';
import { RainbowChart } from '@/components/rainbow-chart';
import { Button } from '@/components/ui/button';
import { useBitcoinHistorical, useFearGreed, useMvrv } from '@/hooks/use-crypto';
import { useRelativeTime } from '@/hooks/use-relative-time';

export function BitcoinView() {
  const { data: fearGreed } = useFearGreed();
  const { data: mvrv } = useMvrv();
  const { data: historical } = useBitcoinHistorical();

  const fearGreedReset = useRef<(() => void) | null>(null);
  const mvrvZScoreReset = useRef<(() => void) | null>(null);
  const mayerReset = useRef<(() => void) | null>(null);
  const puellReset = useRef<(() => void) | null>(null);
  const rainbowReset = useRef<(() => void) | null>(null);
  const piCycleReset = useRef<(() => void) | null>(null);

  // 차트를 추가하면 이 배열에도 넣어야 "전체 스케일 초기화"가 함께 적용된다.
  const allResets = [fearGreedReset, mvrvZScoreReset, mayerReset, puellReset, rainbowReset, piCycleReset];

  function resetAll() {
    allResets.forEach((r) => r.current?.());
  }

  const fearGreedRelTime = useRelativeTime(fearGreed?.fetchedAt);
  const mvrvRelTime = useRelativeTime(mvrv?.fetchedAt);
  const historicalRelTime = useRelativeTime(historical?.fetchedAt);

  return (
    <>
      <AppHeader breadcrumbs={[{ label: '비트코인 차트' }]} />
      <PageMain>
        <div className='flex flex-col gap-3'>
          <div className='flex items-center'>
            <Button variant='outline' size='sm' onClick={resetAll}>
              <RotateCcw className='size-3.5' />
              <span className='text-xs'>전체 스케일 초기화</span>
            </Button>
          </div>
          <FearGreedChart data={fearGreed} resetRef={fearGreedReset} updatedLabel={fearGreedRelTime ?? undefined} />
          <MvrvZScoreChart data={mvrv} resetRef={mvrvZScoreReset} updatedLabel={mvrvRelTime ?? undefined} />
          <MayerMultipleChart data={historical} resetRef={mayerReset} updatedLabel={historicalRelTime ?? undefined} />
          <PuellMultipleChart data={historical} resetRef={puellReset} updatedLabel={historicalRelTime ?? undefined} />
          <RainbowChart data={historical} resetRef={rainbowReset} updatedLabel={historicalRelTime ?? undefined} />
          <PiCycleChart data={historical} resetRef={piCycleReset} updatedLabel={historicalRelTime ?? undefined} />
        </div>
      </PageMain>
    </>
  );
}
