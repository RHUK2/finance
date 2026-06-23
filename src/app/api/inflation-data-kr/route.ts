import { NextResponse } from "next/server";

// cache-config.ts ENDPOINTS["inflation-data-kr"]와 동기화.
export const revalidate = 86400;

const START = "199601"; // 예금금리 시계열 시작 시점에 맞춤
const STAT = {
  // ⚠️ 통계표코드/항목코드는 ECOS "통계코드검색"으로 검증 후 확정할 것.
  //    한국은행이 표를 개편하면 코드가 바뀔 수 있다.
  cpi: { stat: "901Y009", item: "0" }, // 소비자물가지수(총지수)
  m2: { stat: "161Y006", item: "BBHA00" }, // M2(광의통화, 평잔·원계열) 신계열, 2003~
  deposit: { stat: "722Y001", item: "0101000" }, // 한국은행 기준금리 — 단기 안전금리 근사(미국 TB3MS에 대응)
  stock: { stat: "901Y014", item: "1070000" }, // KOSPI 종가(월), 배당 제외
  house: { stat: "901Y062", item: "P63A" }, // KB 주택매매가격지수(총지수)
} as const;

type Series = {
  history: { time: string; value: number }[];
  current: number | null;
  changePercent: number | null;
};

function endMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
}

async function fetchSeries(
  key: string,
  stat: string,
  item: string,
): Promise<Series> {
  const url = `https://ecos.bok.or.kr/api/StatisticSearch/${key}/json/kr/1/100000/${stat}/M/${START}/${endMonth()}/${item}`;
  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error(`ECOS ${stat} error: ${res.status}`);

  const data = await res.json();
  const rows = (data?.StatisticSearch?.row ?? []) as {
    TIME: string;
    DATA_VALUE: string;
  }[];
  const history = rows
    .filter((r) => r.DATA_VALUE != null && r.DATA_VALUE !== "")
    .map((r) => ({
      time: `${r.TIME.slice(0, 4)}-${r.TIME.slice(4, 6)}-01`,
      value: Number(r.DATA_VALUE),
    }));

  const last = history[history.length - 1];
  const prev = history[history.length - 2];
  const changePercent =
    last && prev && prev.value !== 0
      ? Number((((last.value - prev.value) / prev.value) * 100).toFixed(2))
      : null;

  return { history, current: last?.value ?? null, changePercent };
}

export async function GET() {
  const key = process.env.ECOS_API_KEY;
  if (!key) {
    return NextResponse.json({
      fetchedAt: new Date().toISOString(),
      available: false,
    });
  }

  try {
    const [cpi, m2, deposit, stock, house] = await Promise.all([
      fetchSeries(key, STAT.cpi.stat, STAT.cpi.item),
      fetchSeries(key, STAT.m2.stat, STAT.m2.item),
      fetchSeries(key, STAT.deposit.stat, STAT.deposit.item),
      fetchSeries(key, STAT.stock.stat, STAT.stock.item),
      fetchSeries(key, STAT.house.stat, STAT.house.item),
    ]);

    return NextResponse.json({
      fetchedAt: new Date().toISOString(),
      available: true,
      cpi,
      m2,
      deposit,
      stock,
      house,
    });
  } catch (error) {
    console.error("inflation-data-kr fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch ECOS data" },
      { status: 500 },
    );
  }
}
