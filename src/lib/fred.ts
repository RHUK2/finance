import 'server-only';

import { toMacroSeries, type MacroSeries } from './series';

/**
 * FRED observations API에서 시계열 하나를 받아 MacroSeries로 변환.
 *
 * ⚠️ 새 시리즈를 추가하기 전에 `series` 엔드포인트로 유효성을 먼저 확인할 것.
 * FRED는 시리즈를 폐기한다(금 `GOLDAMGBD228NLBM`, Wilshire 5000 `WILL5000IND`가
 * 그렇게 사라졌다). 호출부(`loaders/fred`, `loaders/inflation-data`)가 `Promise.all`로
 * 여러 시리즈를 함께 받으므로, 하나만 폐기돼도 라우트 전체가 갱신되지 않는다. 캐시에 값이
 * 없으면 500이고, 있으면 마지막 성공 값을 계속 내보내 갱신시각만 늘어난다(src/lib/cache.ts).
 * 관측값이 하나도 없는 응답도 같은 실패로 본다. 빈 값을 캐시에 넣으면 하루 동안 빈 차트가 신선한 값으로 남는다.
 */
export async function fetchFredSeries(
  seriesId: string,
  apiKey: string,
  observationStart: string,
): Promise<MacroSeries> {
  const params = new URLSearchParams({
    series_id: seriesId,
    api_key: apiKey,
    file_type: 'json',
    observation_start: observationStart,
  });
  const res = await fetch(`https://api.stlouisfed.org/fred/series/observations?${params}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`FRED ${seriesId} error: ${res.status}`);

  const data = await res.json();
  const history = (data.observations as { date: string; value: string }[])
    .filter((o) => o.value !== '.')
    .map((o) => ({ time: o.date, value: Number(o.value) }));
  if (history.length === 0) throw new Error(`FRED ${seriesId}: 빈 시계열`);

  return toMacroSeries(history);
}
