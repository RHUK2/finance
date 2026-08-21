'use client';

import Link from 'next/link';

import { useMemo, useState } from 'react';

import { AppHeader } from '@/components/app-header';
import { PageMain } from '@/components/page-main';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SimTabs } from '@/components/simulation';
import { useBitcoinHistorical } from '@/hooks/use-crypto';
import { useRelativeTime } from '@/hooks/use-relative-time';
import { useInflationData, useInflationDataKr, type InflationData } from '@/hooks/use-inflation';
import { KR_MIN_WAGE, KR_WAGE_LAST_YEAR, US_MIN_WAGE, toKrw } from '@/lib/inflation-models';

import { AssetRaceChart } from './asset-race-chart';
import { CollapseCalculator } from './collapse-calculator';
import { CpiM2GapChart } from './cpi-m2-gap-chart';
import { LaborHours } from './labor-hours';
import type { Currency } from './components';

type Country = 'US' | 'KR';

// 시작연도 슬라이더의 상한이자 "오늘 최저임금"을 고를 기준연도. 해마다 손으로 올리면
// 반드시 뒤처지므로 현재 연도에서 구한다(연도 단위라 서버·클라이언트 값이 갈리지 않는다).
const CURRENT_YEAR = new Date().getFullYear();

const CONFIG: Record<
  Country,
  {
    label: string;
    currency: Currency;
    minYear: number;
    maxYear: number;
    principal: number;
    gapBaseYear: number;
    raceBaseYear: number;
    wageTable: { year: number; wage: number }[];
    envKey: string;
    stockLabel: string;
  }
> = {
  KR: {
    label: '한국',
    currency: '₩',
    minYear: 2003, // M2 신계열(161Y006) 시작연도에 맞춤
    // 최저임금 표가 커버하는 해까지만. 한국 최저임금은 매년 바뀌므로 표보다 앞선 연도를
    // 고를 수 있게 두면 작년 시급을 "오늘 최저임금"으로 쓰게 된다.
    maxYear: Math.min(CURRENT_YEAR, KR_WAGE_LAST_YEAR),
    principal: 1_000_000,
    gapBaseYear: 2003,
    raceBaseYear: 2000,
    wageTable: KR_MIN_WAGE,
    envKey: 'ECOS_API_KEY',
    stockLabel: '주식 (코스피)',
  },
  US: {
    label: '미국',
    currency: '$',
    minYear: 1971,
    // 연방 최저임금은 2009년 이후 그대로라 표의 마지막 해를 넘겨도 값이 유효하다.
    maxYear: CURRENT_YEAR,
    principal: 10_000,
    gapBaseYear: 1971,
    raceBaseYear: 2015,
    wageTable: US_MIN_WAGE,
    envKey: 'FRED_API_KEY',
    stockLabel: '주식 (나스닥)',
  },
};

export function InflationView() {
  const [country, setCountry] = useState<Country>('KR');
  const us = useInflationData();
  const kr = useInflationDataKr();
  const btcQuery = useBitcoinHistorical();

  const cfg = CONFIG[country];
  const data = country === 'US' ? us.data : kr.data;
  // BTC 가격은 USD 기준. 미국은 그대로, 한국은 월별 환율로 원화 환산해 KRW 자산과 단위를 맞춘다.
  // useMemo로 참조를 고정해 하위 컴포넌트들의 useMemo·차트가 리렌더마다 무효화되지 않게 한다.
  const btc = useMemo(
    () => (country === 'US' ? btcQuery.data?.history : toKrw(btcQuery.data?.history, data?.fx?.history)),
    [country, btcQuery.data, data],
  );

  return (
    <>
      <AppHeader breadcrumbs={[{ label: '구매력 붕괴' }]} />
      <PageMain>
        <div className='mx-auto flex max-w-5xl flex-col gap-4'>
          <div>
            <h1 className='text-xl font-semibold'>예금은 노동의 가치를 지켜주는가</h1>
            <p className='text-muted-foreground mt-1 text-sm'>
              CPI(소비재 물가)·M2(통화량)·자산가격은 서로 다른 것을 측정한다. 예금 금리가 통화 팽창에 못 미치면, 저축한
              과거 노동의 구매력은 조용히 줄어든다. 어느 쪽이 얼마나 벌어지는지 데이터로 비교해 보자. 여기서 기준으로
              쓰는 M2가 애초에 어떻게 불어나는지는{' '}
              <Link href='/money-creation' className='underline underline-offset-2'>
                신용창조
              </Link>{' '}
              페이지에서 다룬다.
            </p>
          </div>

          <div className='flex gap-2'>
            {(Object.keys(CONFIG) as Country[]).map((c) => (
              <Button key={c} size='sm' variant={country === c ? 'default' : 'outline'} onClick={() => setCountry(c)}>
                {CONFIG[c].label}
              </Button>
            ))}
          </div>

          {!data ? (
            <Card>
              <CardContent className='text-muted-foreground text-sm'>데이터를 불러오는 중…</CardContent>
            </Card>
          ) : data.available === false ? (
            <Card>
              <CardContent className='text-muted-foreground text-sm'>
                {cfg.label} 데이터는 <code className='text-foreground'>{cfg.envKey}</code> 환경변수를 설정하면 표시된다.
              </CardContent>
            </Card>
          ) : (
            <Devices country={country} cfg={cfg} data={data} btc={btc} />
          )}

          <p className='text-muted-foreground border-t pt-4 text-xs/relaxed'>
            CPI는 통계청/BLS 정의에 따른 측정치이며, 통화 팽창·자산가격은 별개 지표다. 이 페이지는 특정 측정의 오류를
            단정하지 않고, 예금 금리와 통화·자산 지표 간의 격차를 보여준다. M2는 2021년 정의가 변경되었고, 예금 금리는
            단기 안전금리(미국: 3개월 국채) 근사이며, 자산 수익률은 배당·세금·거래비용을 제외한 가격 기준이다.
          </p>
        </div>
      </PageMain>
    </>
  );
}

function Devices({
  country,
  cfg,
  data,
  btc,
}: {
  country: Country;
  cfg: (typeof CONFIG)[Country];
  data: InflationData;
  btc?: { time: string; value: number }[];
}) {
  const updatedLabel = useRelativeTime(data.fetchedAt);
  const tabs = [
    {
      value: 'collapse',
      label: '구매력 붕괴 계산기',
      node: (
        <div className='flex flex-col gap-4'>
          <CollapseCalculator
            data={data}
            btc={btc}
            currency={cfg.currency}
            minYear={cfg.minYear}
            maxYear={cfg.maxYear}
            amount={cfg.principal}
            stockLabel={cfg.stockLabel}
          />
          <CpiM2GapChart data={data} baseYear={cfg.gapBaseYear} updatedLabel={updatedLabel} />
        </div>
      ),
    },
    {
      value: 'labor',
      label: '노동시간 환산',
      node: (
        <div className='flex flex-col gap-4'>
          <LaborHours
            data={data}
            btc={btc}
            currency={cfg.currency}
            minYear={cfg.minYear}
            maxYear={cfg.maxYear}
            wageTable={cfg.wageTable}
            stockLabel={cfg.stockLabel}
          />
          <AssetRaceChart
            data={data}
            btc={btc}
            baseYear={cfg.raceBaseYear}
            stockLabel={cfg.stockLabel}
            updatedLabel={updatedLabel}
          />
        </div>
      ),
    },
  ];

  return <SimTabs key={country} tabs={tabs} defaultValue='collapse' />;
}
