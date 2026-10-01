'use client';

import { MobileNavDrawer } from '@/components/mobile-nav-drawer';
import { MacroChart } from '@/components/macro-chart';
import { PageMain } from '@/components/page-main';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CHART_SERIES } from '@/hooks/use-chart';
import { useEconomy, useFred } from '@/hooks/use-economy';
import { useRelativeTime } from '@/hooks/use-relative-time';
import { formatKrwPrice, formatPct } from '@/lib/utils';
import { RotateCcw } from 'lucide-react';
import { useMemo, useRef, type ReactNode } from 'react';

/** FRED 데이터가 필요한 차트. 키가 없어 데이터를 못 받으면 안내 카드로 대체한다. */
function FredGate({ available, title, children }: { available: boolean; title: string; children: ReactNode }) {
  if (available) return children;
  return (
    <Card>
      <CardContent>
        <p className='text-sm text-muted-foreground'>
          {title} · <code className='text-foreground'>FRED_API_KEY</code> 환경변수를 설정하면 표시됩니다.
        </p>
      </CardContent>
    </Card>
  );
}

export function EconomyView() {
  const ecoQuery = useEconomy();
  const fredQuery = useFred();
  const eco = ecoQuery.data;
  const fred = fredQuery.data;
  // 첫 데이터 없이 요청이 실패한 상태. 이전 데이터가 있으면 옛 값을 그대로 보인다.
  const ecoFailed = ecoQuery.isError && !eco;
  const fredFailed = fredQuery.isError && !fred;

  // 로딩 중(undefined)에는 차트를 렌더해 스켈레톤을 보이고, 명시적으로 unavailable일 때만 대체한다.
  // 요청 실패도 키 부재가 아니므로 안내 카드가 아니라 차트 카드의 실패 문구로 보인다.
  const fredAvailable = fred?.available !== false;

  const dxyReset = useRef<(() => void) | null>(null);
  const us10yReset = useRef<(() => void) | null>(null);
  const vixReset = useRef<(() => void) | null>(null);
  const fedFundsReset = useRef<(() => void) | null>(null);
  const nasdaqReset = useRef<(() => void) | null>(null);
  const kospiReset = useRef<(() => void) | null>(null);
  const usdkrwReset = useRef<(() => void) | null>(null);
  const yieldSpreadReset = useRef<(() => void) | null>(null);

  // 차트를 추가하면 이 배열에도 넣어야 "전체 스케일 초기화"가 함께 적용된다.
  const allResets = [
    usdkrwReset,
    dxyReset,
    kospiReset,
    nasdaqReset,
    vixReset,
    fedFundsReset,
    us10yReset,
    yieldSpreadReset,
  ];

  function resetAll() {
    allResets.forEach((r) => r.current?.());
  }

  const ecoRelTime = useRelativeTime(eco?.fetchedAt);
  const fredRelTime = useRelativeTime(fred?.fetchedAt);

  // 스프레드는 FRED `T10Y2Y`(DGS10 − DGS2) 한 출처다. 변화는 %p 차이로 적는다(changeDiff).
  const yieldSpread = fred?.spread;
  const spreadDiff = useMemo(() => {
    const h = yieldSpread?.history;
    if (!h || h.length < 2) return null;
    return Number((h[h.length - 1].value - h[h.length - 2].value).toFixed(2));
  }, [yieldSpread]);

  // lines 배열의 참조를 고정해 useChart가 리렌더마다 차트를 재생성하지 않게 한다
  // (useRelativeTime이 매분 리렌더를 일으키므로 인라인 배열이면 줌 상태까지 초기화된다).
  const chartLines = useMemo(() => {
    if (!eco) return undefined;
    return {
      // 선 색은 카드를 가를 뿐 뜻이 없어 계열색에서 고른다(판정색을 쓰면 VIX가 나쁜 선으로 읽힌다).
      usdkrw: [{ data: eco.usdkrw.history, color: CHART_SERIES[0] }],
      dxy: [{ data: eco.dxy.history, color: CHART_SERIES[3] }],
      kospi: [{ data: eco.kospi.history, color: CHART_SERIES[1] }],
      nasdaq: [{ data: eco.nasdaq.history, color: CHART_SERIES[0] }],
      vix: [{ data: eco.vix.history, color: CHART_SERIES[2] }],
      // 헤드라인이 10Y라 10Y가 첫 선이다(MacroChart는 커서 값·구간 수익률을 첫 선에서 읽는다).
      // FRED 2Y는 10년치가 오므로 야후 10Y·30Y의 구간(2년)에 맞춰 잘라 x축을 맞춘다.
      treasury: [
        { label: '10Y', data: eco.us10y.history, color: CHART_SERIES[3] },
        ...(fred?.us2y
          ? [
              {
                label: '2Y',
                data: fred.us2y.history.filter((p) => p.time >= (eco.us10y.history[0]?.time ?? '')),
                color: CHART_SERIES[0],
              },
            ]
          : []),
        { label: '30Y', data: eco.us30y.history, color: CHART_SERIES[1] },
      ],
    };
  }, [eco, fred]);

  const fedFundsLines = useMemo(
    () => (fred?.fedFunds ? [{ data: fred.fedFunds.history, color: CHART_SERIES[0] }] : undefined),
    [fred],
  );

  const yieldSpreadLines = useMemo(
    () => (yieldSpread ? [{ data: yieldSpread.history, color: CHART_SERIES[2] }] : undefined),
    [yieldSpread],
  );

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

          {/* 차트가 여덟이라 넓은 화면에서는 2열로 접는다. 세로로만 쌓으면 마지막 차트까지
              가는 동안 앞 차트가 화면에서 사라져 비교가 기억에 기대게 된다 */}
          <div className='grid gap-3 xl:grid-cols-2'>
            <MacroChart
              title='달러/원 (USD/KRW)'
              currentLabel={eco?.usdkrw.current != null ? formatKrwPrice(eco.usdkrw.current) : '-'}
              formatValue={(v) => formatKrwPrice(v)}
              changePercent={eco?.usdkrw.changePercent ?? null}
              lines={chartLines?.usdkrw}
              updatedLabel={ecoRelTime ?? undefined}
              error={ecoFailed}
              resetRef={usdkrwReset}
              description='달러 대비 원화 환율. 상승(원화 약세)하면 수입 물가가 오르고 외국인 자금 유출 압력이 커지며, 하락(원화 강세)하면 수입 물가 안정·외국인 자금 유입 신호로 읽힙니다. 달러 강세(DXY) 국면에 동조해 오르는 경향이 있습니다.'
            />

            <MacroChart
              title='달러인덱스'
              currentLabel={eco?.dxy.current?.toFixed(2) ?? '-'}
              formatValue={(v) => v.toFixed(2)}
              changePercent={eco?.dxy.changePercent ?? null}
              lines={chartLines?.dxy}
              updatedLabel={ecoRelTime ?? undefined}
              error={ecoFailed}
              resetRef={dxyReset}
              description='달러의 주요 6개 통화 대비 강세를 나타내는 지수. 상승하면 신흥국 자산·원자재·비트코인 등 위험자산에서 자금 유출 압력이 커지고, 하락하면 위험자산·원자재로 유동성이 유입되는 경향이 있습니다.'
            />

            <MacroChart
              title='코스피'
              currentLabel={
                eco?.kospi.current != null
                  ? eco.kospi.current.toLocaleString('ko-KR', {
                      maximumFractionDigits: 2,
                    })
                  : '-'
              }
              formatValue={(v) => v.toLocaleString('ko-KR', { maximumFractionDigits: 2 })}
              changePercent={eco?.kospi.changePercent ?? null}
              lines={chartLines?.kospi}
              updatedLabel={ecoRelTime ?? undefined}
              error={ecoFailed}
              resetRef={kospiReset}
              description='한국 증시 대표 지수. 수출 대형주(반도체·자동차) 비중이 높아 상승은 글로벌 경기 호조·위험선호를, 하락은 경기 둔화나 원화 약세 우려를 반영하는 경향이 있습니다.'
            />

            <MacroChart
              title='나스닥'
              currentLabel={
                eco?.nasdaq.current != null
                  ? eco.nasdaq.current.toLocaleString('en-US', {
                      maximumFractionDigits: 2,
                    })
                  : '-'
              }
              formatValue={(v) => v.toLocaleString('en-US', { maximumFractionDigits: 2 })}
              changePercent={eco?.nasdaq.changePercent ?? null}
              lines={chartLines?.nasdaq}
              updatedLabel={ecoRelTime ?? undefined}
              error={ecoFailed}
              resetRef={nasdaqReset}
              description='미국 기술주 중심의 나스닥 종합지수. 상승은 위험선호 확대와 풍부한 유동성(완화 기대)을, 하락은 긴축·경기 우려에 따른 위험회피를 반영하는 경향이 있습니다.'
            />

            <MacroChart
              title='VIX 변동성지수'
              currentLabel={eco?.vix.current?.toFixed(2) ?? '-'}
              formatValue={(v) => v.toFixed(2)}
              changePercent={eco?.vix.changePercent ?? null}
              lines={chartLines?.vix}
              updatedLabel={ecoRelTime ?? undefined}
              error={ecoFailed}
              resetRef={vixReset}
              description="S&P 500 옵션 시장이 예상하는 30일 변동성, '공포지수'. 상승할수록 시장 불안이 커지며(20 이상 불안, 30 이상 극도의 공포), 낮게 유지되면 시장이 안정·낙관 국면임을 뜻합니다."
            />

            <FredGate available={fredAvailable} title='연준 기준금리'>
              <MacroChart
                title='연준 기준금리'
                currentLabel={fred?.fedFunds?.current != null ? formatPct(fred.fedFunds.current, 2) : '-'}
                formatValue={(v) => formatPct(v, 2)}
                changePercent={fred?.fedFunds?.changePercent ?? null}
                frequency='monthly'
                lines={fedFundsLines}
                updatedLabel={fredRelTime ?? undefined}
                error={fredFailed}
                resetRef={fedFundsReset}
                description='연방준비제도가 설정하는 단기 금리 목표. 인상은 긴축 국면으로 유동성을 죄어 위험자산에 불리하고, 인하는 완화 신호로 유동성 공급 기대를 높여 위험자산에 우호적입니다.'
              />
            </FredGate>

            <MacroChart
              title='미국 국채금리'
              currentLabel={eco?.us10y.current != null ? formatPct(eco.us10y.current, 2) : '-'}
              formatValue={(v) => formatPct(v, 2)}
              changePercent={eco?.us10y.changePercent ?? null}
              lines={chartLines?.treasury}
              updatedLabel={ecoRelTime ?? undefined}
              error={ecoFailed}
              resetRef={us10yReset}
              description='미국 장기 국채의 수익률. 상승하면 무위험 수익률이 올라 주식·비트코인 등 위험자산의 상대 매력이 낮아지고, 하락은 경기 침체 우려 또는 완화 기대 신호로 해석됩니다.'
            />

            <FredGate available={fredAvailable} title='수익률 곡선 스프레드 (10Y−2Y)'>
              <MacroChart
                title='수익률 곡선 스프레드 (10Y−2Y)'
                currentLabel={yieldSpread?.current != null ? `${yieldSpread.current.toFixed(2)}%p` : '-'}
                formatValue={(v) => `${v.toFixed(2)}%p`}
                changeDiff={{ value: spreadDiff }}
                lines={yieldSpreadLines}
                updatedLabel={fredRelTime ?? undefined}
                error={fredFailed}
                resetRef={yieldSpreadReset}
                description='미국 10년물−2년물 국채 금리의 차이. 0 아래로 역전(하락)되면 역사적으로 경기침체 선행 신호로, 다시 0 위로 상승(정상화)하면 침체 임박 또는 완화 사이클 진입 신호로 읽힙니다.'
              />
            </FredGate>
          </div>
        </div>
      </PageMain>
    </>
  );
}
