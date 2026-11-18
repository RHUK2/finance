import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';

import { CoinJoin } from './coinjoin';

const fixture = vi.hoisted(() => ({ participants: 5 }));
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return { ...actual, useState: (initial: unknown) => actual.useState(initial === 5 ? fixture.participants : initial) };
});

it.each([2, 5, 10])('aligns every SVG endpoint with the %i participant rows', (count) => {
  fixture.participants = count;
  const html = renderToStaticMarkup(createElement(CoinJoin));
  const svg = html.match(/<svg[^>]*aria-label="참가자[^]*?<\/svg>/)?.[0];
  expect(svg).toBeDefined();
  const height = Number(svg!.match(/height="(\d+)"/)?.[1]);
  // h-8 rows (32px) with gap-1.5 (6px), excluding the labels above the rows.
  expect(height).toBe(count * 32 + (count - 1) * 6);
  const lines = [...svg!.matchAll(/<line[^>]*y1="(\d+)"[^>]*y2="(\d+)"/g)];
  const centers = Array.from({ length: count }, (_, i) => 32 / 2 + i * (32 + 6));
  expect(lines.map((m) => Number(m[1]))).toEqual(centers);
  expect(lines.map((m) => Number(m[2])).sort((a, b) => a - b)).toEqual(centers);
});
