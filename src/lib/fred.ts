import { toMacroSeries, type MacroSeries } from './series';

/** FRED observations API에서 시계열 하나를 받아 MacroSeries로 변환. */
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

  return toMacroSeries(history);
}
