import 'server-only';

import { assertNonEmpty, fetchJson } from '@/lib/fetch-json';
import { cached } from '@/lib/cache';
import { dedupeByTime } from '@/lib/series';

export type FearGreedData = {
  fetchedAt: string;
  value: number;
  classification: string;
  history: { time: string; value: number }[];
};

async function fetchFearGreed(): Promise<FearGreedData> {
  const json = await fetchJson<{ data: { value: string; value_classification: string; timestamp: string }[] }>(
    'https://api.alternative.me/fng/?limit=2000',
    `Alternative.me`,
  );
  const rows: {
    value: string;
    value_classification: string;
    timestamp: string;
  }[] = json.data ?? [];

  assertNonEmpty(rows, 'Alternative.me');

  if (
    rows.some(
      (row) => !(Number(row.timestamp) > 0) || !Number.isFinite(new Date(Number(row.timestamp) * 1000).getTime()),
    )
  ) {
    throw new Error('No valid fear & greed data');
  }
  const points = dedupeByTime(
    rows
      .filter((row) => typeof row.value === 'string' && row.value.trim() !== '' && Number.isFinite(Number(row.value)))
      .map((row) => ({
        time: new Date(Number(row.timestamp) * 1000).toISOString().slice(0, 10),
        value: Number(row.value),
        classification: row.value_classification,
      }))
      .sort((a, b) => a.time.localeCompare(b.time)),
  );
  assertNonEmpty(points, 'Alternative.me');
  const latestTime = points[points.length - 1].time;
  if (rows.some((row) => new Date(Number(row.timestamp) * 1000).toISOString().slice(0, 10) > latestTime)) {
    throw new Error('No valid fear & greed data');
  }
  const history = points.map(({ time, value }) => ({ time, value }));

  return {
    fetchedAt: new Date().toISOString(),
    value: history[history.length - 1].value,
    classification: points[points.length - 1].classification,
    history,
  };
}

export const loadFearGreed = () => cached('fear-greed', fetchFearGreed);
