import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';

import { CoinJoin, COINJOIN_ROW_GAP, COINJOIN_ROW_HEIGHT, COINJOIN_ROW_STRIDE } from './coinjoin';

it.each([2, 5, 10])('aligns every SVG endpoint with the %i participant rows', (count) => {
  const html = renderToStaticMarkup(createElement(CoinJoin, { initialParticipants: count }));
  const svg = html.match(/<svg[^>]*aria-label="참가자[^]*?<\/svg>/)?.[0];
  expect(svg).toBeDefined();
  expect(svg).toContain('class="w-24 shrink-0 self-end"');
  expect(html).toContain('class="flex items-stretch justify-between gap-4"');
  // 머리글은 행 위에 남기고, SVG는 두 열의 맨 아래에 맞춘다.
  const columns = [
    ...html.matchAll(
      /<div class="([^"]*)"><span class="([^"]*)">(입력|동일 금액 출력)<\/span>((?:<div[^>]*>[^<]*<\/div>)+)<\/div>/g,
    ),
  ];
  expect(columns).toHaveLength(2);
  expect(COINJOIN_ROW_STRIDE).toBe(COINJOIN_ROW_HEIGHT + COINJOIN_ROW_GAP);
  for (const [, columnClass, headerClass, , rows] of columns) {
    expect(columnClass).toBe('flex flex-1 flex-col gap-1.5');
    expect(headerClass).toBe('text-center text-xs text-muted-foreground');
    expect(COINJOIN_ROW_GAP).toBe(1.5 * 4);
    const rowClasses = [...rows.matchAll(/<div[^>]*class="([^"]*)"/g)];
    expect(rowClasses).toHaveLength(count);
    for (const [, rowClass] of rowClasses) {
      expect(rowClass.split(' ')).toContain('h-8');
      expect(COINJOIN_ROW_HEIGHT).toBe(8 * 4);
    }
  }
  const height = Number(svg!.match(/height="(\d+)"/)?.[1]);
  // h-8 rows (32px) with gap-1.5 (6px), excluding the labels above the rows.
  expect(height).toBe(count * 32 + (count - 1) * 6);
  expect(svg).toContain(`viewBox="0 0 100 ${height}"`);
  const lines = [...svg!.matchAll(/<line[^>]*y1="(\d+)"[^>]*y2="(\d+)"/g)];
  const centers = Array.from({ length: count }, (_, i) => 32 / 2 + i * (32 + 6));
  expect(lines.map((m) => Number(m[1]))).toEqual(centers);
  expect(lines.map((m) => Number(m[2])).sort((a, b) => a - b)).toEqual(centers);
});
