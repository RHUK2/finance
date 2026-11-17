import 'server-only';

import { cached } from '@/lib/cache';
import { dedupeByTime } from '@/lib/series';

export type FearGreedData = {
  fetchedAt: string;
  value: number;
  classification: string;
  history: { time: string; value: number }[];
};

async function fetchFearGreed(): Promise<FearGreedData> {
  const res = await fetch('https://api.alternative.me/fng/?limit=2000', {
    cache: 'no-store',
  });

  if (!res.ok) throw new Error(`Alternative.me error: ${res.status}`);

  const json = await res.json();
  const rows: {
    value: string;
    value_classification: string;
    timestamp: string;
  }[] = json.data ?? [];

  if (rows.length === 0) throw new Error('No fear & greed data');

  const valid = rows.filter(
    (row) =>
      Number.isFinite(Number(row.value)) &&
      row.value.trim() !== '' &&
      Number.isFinite(new Date(Number(row.timestamp) * 1000).getTime()),
  );
  const points = dedupeByTime(
    valid
      .map((row) => ({
        time: new Date(Number(row.timestamp) * 1000).toISOString().slice(0, 10),
        value: Number(row.value),
        classification: row.value_classification,
      }))
      .sort((a, b) => a.time.localeCompare(b.time)),
  );
  if (points.length === 0) throw new Error('No valid fear & greed data');
  const history = points.map(({ time, value }) => ({ time, value }));

  return {
    fetchedAt: new Date().toISOString(),
    value: history[history.length - 1].value,
    classification: points[points.length - 1].classification,
    history,
  };
}

export const loadFearGreed = () => cached('fear-greed', fetchFearGreed);
