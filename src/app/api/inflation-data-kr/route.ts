import { NextResponse } from 'next/server';

import { cached } from '@/lib/cache';
import { toMacroSeries, type MacroSeries } from '@/lib/series';

export const dynamic = 'force-dynamic';

const START = '199601'; // 기준금리 시계열 시작 시점에 맞춤
const STAT = {
  // ⚠️ 통계표코드/항목코드는 ECOS "통계코드검색"으로 검증 후 확정할 것.
  //    한국은행이 표를 개편하면 코드가 바뀔 수 있다.
  cpi: { stat: '901Y009', item: '0' }, // 소비자물가지수(총지수)
  m2: { stat: '161Y006', item: 'BBHA00' }, // M2(광의통화, 평잔·원계열) 신계열, 2003~
  deposit: { stat: '722Y001', item: '0101000' }, // 한국은행 기준금리(단기 안전금리 근사, 미국 TB3MS에 대응)
  stock: { stat: '901Y014', item: '1070000' }, // KOSPI 종가(월), 배당 제외
  house: { stat: '901Y062', item: 'P63A' }, // KB 주택매매가격지수(총지수)
  fx: { stat: '731Y004', item: '0000001/0000100' }, // 원/미국달러 환율(매매기준율, 월평균자료). USD 자산의 원화 환산용. item2=0000100(평균자료)
} as const;

function endMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
}

async function fetchSeries(key: string, stat: string, item: string): Promise<MacroSeries> {
  const url = `https://ecos.bok.or.kr/api/StatisticSearch/${key}/json/kr/1/100000/${stat}/M/${START}/${endMonth()}/${item}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`ECOS ${stat} error: ${res.status}`);

  const data = await res.json();
  const rows = (data?.StatisticSearch?.row ?? []) as {
    TIME: string;
    DATA_VALUE: string;
  }[];
  const history = rows
    .filter((r) => r.DATA_VALUE != null && r.DATA_VALUE !== '')
    .map((r) => ({
      time: `${r.TIME.slice(0, 4)}-${r.TIME.slice(4, 6)}-01`,
      value: Number(r.DATA_VALUE),
    }));

  return toMacroSeries(history);
}

export async function GET() {
  try {
    // 키가 없으면 500 대신 `available: false`를 돌려주고, 화면은 한국 데이터 없이 미국만
    // 그린다. 필수로 만들면 키가 없는 환경에서 구매력 붕괴 페이지 전체가 죽는다.
    // FRED 키를 읽는 두 라우트도 같은 분기를 갖는다.
    //
    // 이 응답은 cached() 바깥에서 돌려준다. 키 부재는 데이터가 아니라 설정 상태라,
    // 캐시에 넣으면 키를 넣고 배포해도 TTL(하루) 동안 안내 카드가 그대로 나온다.
    const key = process.env.ECOS_API_KEY;
    if (!key) {
      return NextResponse.json({ fetchedAt: new Date().toISOString(), available: false });
    }

    const data = await cached('inflation-data-kr', async () => {
      // 여섯을 Promise.all로 함께 받으므로 하나만 실패해도 이 라우트가 통째로 500이 된다.
      // 위 STAT의 통계표 코드는 한국은행 개편으로 바뀔 수 있고, 그때 한 코드가 죽으면
      // 나머지 다섯도 함께 죽는다(같은 함정과 이유는 src/lib/fred.ts).
      const [cpi, m2, deposit, stock, house, fx] = await Promise.all([
        fetchSeries(key, STAT.cpi.stat, STAT.cpi.item),
        fetchSeries(key, STAT.m2.stat, STAT.m2.item),
        fetchSeries(key, STAT.deposit.stat, STAT.deposit.item),
        fetchSeries(key, STAT.stock.stat, STAT.stock.item),
        fetchSeries(key, STAT.house.stat, STAT.house.item),
        fetchSeries(key, STAT.fx.stat, STAT.fx.item),
      ]);

      return {
        fetchedAt: new Date().toISOString(),
        available: true,
        cpi,
        m2,
        deposit,
        stock,
        house,
        fx,
      };
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('inflation-data-kr fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch ECOS data' }, { status: 500 });
  }
}
