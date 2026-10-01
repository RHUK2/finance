'use client';

import { useMemo } from 'react';
import { RotateCcw } from 'lucide-react';

import { MobileNavDrawer } from '@/components/mobile-nav-drawer';
import { MacroChart } from '@/components/macro-chart';
import { PageMain } from '@/components/page-main';
import { Button } from '@/components/ui/button';
import { CHART_SERIES } from '@/hooks/use-chart';
import { useRelativeTime } from '@/hooks/use-relative-time';
import { useStocks, type StockKey, type StocksData } from '@/hooks/use-stocks';
import { formatKrwPrice, formatUsdPrice } from '@/lib/utils';

// 종목이 열둘이라 차트마다 ref·useMemo를 손으로 늘어놓지 않고 이 표 하나에서 파생시킨다.
// 종목을 더하고 뺄 때 고칠 곳은 여기와 `src/lib/loaders/stocks.ts`의 SYMBOLS 둘이다.
// 훅의 `StocksData`·`StockKey`는 SYMBOLS에서 파생되므로 따로 고치지 않는다.
//
// currency는 표시용이다. 야후가 주는 통화를 그대로 믿지 않고 여기 적는 것은, 시세가
// 비는 동안에도 라벨의 단위가 흔들리지 않게 하려는 것이다.
// color는 카드마다 선을 가를 뿐 뜻이 없어 계열색 넷을 차례로 돌린다.
const STOCKS: {
  key: StockKey;
  title: string;
  currency: 'USD' | 'KRW';
  color: string;
  description: string;
}[] = [
  {
    key: 'tsla',
    title: '테슬라 (TSLA)',
    currency: 'USD',
    color: CHART_SERIES[0],
    description:
      '전기차·에너지 저장 사업과 자율주행 기대가 함께 반영되는 종목입니다. 실적보다 기대가 차지하는 몫이 커서 금리와 위험선호에 민감하게 움직입니다.',
  },
  {
    key: 'nvda',
    title: '엔비디아 (NVDA)',
    currency: 'USD',
    color: CHART_SERIES[1],
    description:
      'AI 가속기 시장을 사실상 독점해 온 반도체 설계사입니다. 데이터센터 투자 사이클의 방향을 가장 먼저 반영하는 종목으로 읽힙니다.',
  },
  {
    key: 'tsm',
    title: 'TSMC (TSM)',
    currency: 'USD',
    color: CHART_SERIES[2],
    description:
      '첨단 공정을 위탁 생산하는 파운드리입니다. 설계사들의 주문을 한 곳에서 받아 처리하므로 반도체 수요 전반의 온도계 역할을 합니다.',
  },
  {
    key: 'samsung',
    title: '삼성전자 (005930)',
    currency: 'KRW',
    color: CHART_SERIES[3],
    description:
      '메모리·파운드리·세트를 함께 하는 한국 대표 수출주입니다. 메모리 가격 사이클과 원/달러 환율이 실적에 크게 작용합니다.',
  },
  {
    key: 'hynix',
    title: 'SK하이닉스 (000660)',
    currency: 'KRW',
    color: CHART_SERIES[0],
    description: 'HBM을 포함한 메모리에 집중한 회사라 삼성전자보다 메모리 사이클에 더 직접적으로 반응합니다.',
  },
  {
    key: 'googl',
    title: '구글 (GOOGL)',
    currency: 'USD',
    color: CHART_SERIES[1],
    description:
      '검색 광고가 현금흐름의 축이고 클라우드·AI 투자가 비용의 축입니다. 광고 경기와 AI 투자 회수 속도가 함께 반영됩니다.',
  },
  {
    key: 'msft',
    title: '마이크로소프트 (MSFT)',
    currency: 'USD',
    color: CHART_SERIES[2],
    description:
      '기업용 소프트웨어 구독과 클라우드가 실적의 중심입니다. 경기 둔화 국면에도 매출이 비교적 덜 흔들리는 편으로 평가됩니다.',
  },
  {
    key: 'aapl',
    title: '애플 (AAPL)',
    currency: 'USD',
    color: CHART_SERIES[3],
    description:
      '하드웨어 교체 주기와 서비스 매출이 함께 움직이는 종목입니다. 중국 수요와 공급망 상황이 분기 실적을 좌우하는 경우가 많습니다.',
  },
  {
    key: 'meta',
    title: '메타 (META)',
    currency: 'USD',
    color: CHART_SERIES[0],
    description:
      '광고가 매출의 대부분이라 광고 경기에 직접 연동되고, AI·인프라 투자 규모가 이익률을 누르는 요인으로 작용합니다.',
  },
  {
    key: 'amzn',
    title: '아마존 (AMZN)',
    currency: 'USD',
    color: CHART_SERIES[1],
    description:
      '소매와 클라우드(AWS)가 성격이 다른 두 축입니다. 이익은 주로 클라우드에서 나와 소매 매출보다 클라우드 성장률에 더 민감합니다.',
  },
  {
    key: 'nke',
    title: '나이키 (NKE)',
    currency: 'USD',
    color: CHART_SERIES[2],
    description:
      '소비재 종목이라 기술주와 움직이는 이유가 다릅니다. 재고 수준과 중국 소비, 도매 대 직판 비중 변화가 주된 변수로 꼽힙니다.',
  },
  {
    key: 'spcx',
    title: '스페이스X (SPCX)',
    currency: 'USD',
    color: CHART_SERIES[3],
    description: '스페이스X 본주입니다. 2026년 6월 나스닥에 상장해 히스토리가 다른 종목보다 크게 짧습니다.',
  },
];

function formatPrice(value: number, currency: 'USD' | 'KRW'): string {
  return currency === 'KRW' ? formatKrwPrice(value) : formatUsdPrice(value);
}

export function StocksView() {
  const { data, isError } = useStocks();
  // 첫 데이터 없이 요청이 실패한 상태. 이전 데이터가 있으면 옛 값을 그대로 보인다.
  const failed = isError && !data;

  // 훅을 반복문에서 부를 수 없으므로 ref 대신 같은 모양의 객체를 한 번 만들어 쓴다.
  // useChart는 `resetRef.current`에 초기화 함수를 꽂기만 하므로 이걸로 충분하다.
  const resetRefs = useMemo(
    () =>
      Object.fromEntries(STOCKS.map((s) => [s.key, { current: null as (() => void) | null }])) as Record<
        StockKey,
        { current: (() => void) | null }
      >,
    [],
  );

  function resetAll() {
    Object.values(resetRefs).forEach((r) => r.current?.());
  }

  const relTime = useRelativeTime(data?.fetchedAt);

  // lines 배열의 참조를 고정해 useChart가 리렌더마다 차트를 재생성하지 않게 한다
  // (useRelativeTime이 매분 리렌더를 일으키므로 인라인 배열이면 줌 상태까지 초기화된다).
  const chartLines = useMemo(() => {
    if (!data) return undefined;
    return Object.fromEntries(STOCKS.map((s) => [s.key, [{ data: data[s.key].history, color: s.color }]])) as Record<
      StockKey,
      { data: { time: string; value: number }[]; color: string }[]
    >;
  }, [data]);

  const series = (key: StockKey) => (data ? (data[key as keyof StocksData] as StocksData['tsla']) : undefined);

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
          {/* 종목이 열둘이라 넓은 화면에서는 2열로 접는다. 세로로만 쌓으면 마지막 종목까지
              가는 동안 앞 종목이 화면에서 사라져 비교가 기억에 기대게 된다 */}
          <div className='grid gap-3 xl:grid-cols-2'>
            {STOCKS.map((stock) => {
              const current = series(stock.key)?.current;
              return (
                <MacroChart
                  key={stock.key}
                  title={stock.title}
                  currentLabel={current != null ? formatPrice(current, stock.currency) : '-'}
                  changePercent={series(stock.key)?.changePercent ?? null}
                  lines={chartLines?.[stock.key]}
                  updatedLabel={relTime ?? undefined}
                  error={failed}
                  resetRef={resetRefs[stock.key]}
                  description={stock.description}
                  formatValue={(v) => formatPrice(v, stock.currency)}
                />
              );
            })}
          </div>
        </div>
      </PageMain>
    </>
  );
}
