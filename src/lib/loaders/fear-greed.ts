import 'server-only';

import { cached } from '@/lib/cache';

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

  const history = rows
    .map((row) => ({
      time: new Date(Number(row.timestamp) * 1000).toISOString().slice(0, 10),
      value: Number(row.value),
    }))
    .reverse();

  return {
    fetchedAt: new Date().toISOString(),
    value: history[history.length - 1].value,
    classification: rows[0].value_classification,
    history,
  };
}

export const loadFearGreed = () => cached('fear-greed', fetchFearGreed);
