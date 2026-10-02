'use client';

import { useMemo, useState } from 'react';

import { ExplainerPage } from '@/components/explainer-page';
import { Card, CardContent } from '@/components/ui/card';
import { Field, SegmentedControl, SimTabs } from '@/components/simulation';
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
// 반드시 뒤처지므로 현재 연도에서 구한다. 시간대를 서울로 고정한다. 기기 시간대를 따르면
// 1월 1일 0~9시(KST)에 서버(UTC)와 브라우저가 서로 다른 해를 그려 하이드레이션이 어긋난다.
// 모듈 상수로 두지 않는 것도 같은 이유다. 오래 떠 있는 서버 인스턴스는 해가 바뀌어도 옛 값을 쥔다.
const SEOUL_YEAR = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Seoul', year: 'numeric' });

function currentYear(): number {
  return Number(SEOUL_YEAR.format(new Date()));
}

// 나라별 시작연도 슬라이더 상한
function maxYearFor(country: Country): number {
  const year = currentYear();
  // 한국은 시작 연도 슬라이더와 기준 시급 조회를 최저임금 표가 커버하는 해까지로 묶는다. 표를
  // 갱신하지 않은 해에는 표의 마지막 해 시급이 쓰이므로, 화면이 그 연도를 함께 적는다.
  // 미국 연방 최저임금은 2009년 이후 그대로라 표의 마지막 해를 넘겨도 값이 유효하다.
  return country === 'KR' ? Math.min(year, KR_WAGE_LAST_YEAR) : year;
}

const CONFIG: Record<
  Country,
  {
    label: string;
    currency: Currency;
    minYear: number;
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
    // M2 신계열(161Y006)은 2003년 10월에 시작한다. 기준점은 그 해 1월 이후 첫 관측이라 2003년이면
    // CPI는 1월, M2는 10월이 100이 되어 9개월 어긋난다. 두 선이 같은 달에서 출발하는 첫 해로 둔다.
    minYear: 2004,
    principal: 1_000_000,
    gapBaseYear: 2004,
    raceBaseYear: 2000,
    wageTable: KR_MIN_WAGE,
    envKey: 'ECOS_API_KEY',
    stockLabel: '주식 (코스피)',
  },
  US: {
    label: '미국',
    currency: '$',
    minYear: 1971,
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
  const query = country === 'US' ? us : kr;
  const data = query.data;
  // BTC 가격은 USD 기준. 미국은 그대로, 한국은 월별 환율로 원화 환산해 KRW 자산과 단위를 맞춘다.
  // useMemo로 참조를 고정해 하위 컴포넌트들의 useMemo·차트가 리렌더마다 무효화되지 않게 한다.
  const btc = useMemo(
    () => (country === 'US' ? btcQuery.data?.history : toKrw(btcQuery.data?.history, data?.fx?.history)),
    [country, btcQuery.data, data],
  );

  return (
    <ExplainerPage
      title='예금은 노동의 가치를 지켜주는가'
      intro={
        <>
          CPI(소비재 물가)·M2(통화량)·자산가격은 서로 다른 것을 측정한다. 예금 금리가 통화 팽창에 못 미치면, 저축한 과거
          노동의 구매력은 조용히 줄어든다. 어느 쪽이 얼마나 벌어지는지 데이터로 비교해 보자.
        </>
      }
    >
      <Field label='나라'>
        <SegmentedControl
          value={country}
          onChange={setCountry}
          options={(Object.keys(CONFIG) as Country[]).map((c) => ({ value: c, label: CONFIG[c].label }))}
        />
      </Field>

      {!data ? (
        <Card>
          <CardContent>
            <p className='text-sm text-muted-foreground'>
              {query.isError ? '데이터를 받지 못했다. 잠시 뒤 다시 시도한다.' : '데이터를 불러오는 중…'}
            </p>
          </CardContent>
        </Card>
      ) : data.available === false ? (
        <Card>
          <CardContent>
            <p className='text-sm text-muted-foreground'>
              {cfg.label} 데이터는 <code className='text-foreground'>{cfg.envKey}</code> 환경변수를 설정하면 표시된다.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Devices country={country} cfg={cfg} data={data} btc={btc} />
      )}

      <p className='border-t pt-4 text-xs/relaxed text-muted-foreground'>
        CPI는 통계청/BLS 정의에 따른 측정치이며, 통화 팽창·자산가격은 별개 지표다. 이 페이지는 특정 측정의 오류를
        단정하지 않고, 예금 금리와 통화·자산 지표 간의 격차를 보여준다. 예금 금리는 단기 안전금리(미국: 3개월 국채)
        근사이며, 자산 수익률은 배당·세금·거래비용을 제외한 가격 기준이다.
      </p>
    </ExplainerPage>
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
  const maxYear = maxYearFor(country);
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
            maxYear={maxYear}
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
            maxYear={maxYear}
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
