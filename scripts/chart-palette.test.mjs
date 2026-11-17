import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import ts from 'typescript';

// 클라이언트 훅을 실행하지 않고 선언만 읽는다. 팔레트가 계산식으로 바뀌면 검사도 함께 고친다.
const source = ts.createSourceFile(
  'use-chart.ts',
  readFileSync(new URL('../src/hooks/use-chart.ts', import.meta.url), 'utf8'),
  ts.ScriptTarget.Latest,
  true,
);
const css = readFileSync(new URL('../src/app/globals.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

function palette(name) {
  const declaration = source.statements
    .filter(ts.isVariableStatement)
    .flatMap((statement) => [...statement.declarationList.declarations])
    .find((node) => node.name.getText(source) === name);
  assert.ok(declaration?.initializer, `${name} 선언이 있어야 한다`);
  const initializer = declaration.initializer;
  return ts.isAsExpression(initializer) ? initializer.expression : initializer;
}

function hex(node) {
  assert.ok(node && ts.isStringLiteral(node), '팔레트는 문자열 리터럴이어야 한다');
  assert.match(node.text, /^#[\da-f]{6}$/i);
  return node.text.toLowerCase();
}

function oklchToHex(value) {
  const match = /^oklch\(([\d.]+)(%)?\s+([\d.]+)\s+([\d.]+)\)$/.exec(value.trim());
  assert.ok(match, `지원하지 않는 토큰 색 표현: ${value}`);
  const lightness = Number(match[1]) / (match[2] ? 100 : 1);
  const chroma = Number(match[3]);
  const hue = (Number(match[4]) * Math.PI) / 180;
  const a = chroma * Math.cos(hue);
  const b = chroma * Math.sin(hue);
  // OKLab → linear sRGB. 색역 밖 채널은 자르고 sRGB 전달 함수를 적용한 뒤 8비트로 반올림한다.
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const rgb = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  return `#${rgb
    .map((channel) => {
      const encoded = channel <= 0.0031308 ? 12.92 * channel : 1.055 * channel ** (1 / 2.4) - 0.055;
      return Math.round(Math.max(0, Math.min(1, encoded)) * 255)
        .toString(16)
        .padStart(2, '0');
    })
    .join('')}`;
}

test('차트 판정·계열 팔레트가 globals.css 토큰의 sRGB 값과 일치한다', () => {
  const tone = palette('CHART_TONE');
  const series = palette('CHART_SERIES');
  assert.ok(ts.isObjectLiteralExpression(tone));
  assert.ok(ts.isArrayLiteralExpression(series));
  assert.equal(tone.properties.length, 3);
  assert.equal(series.elements.length, 4);
  const pairs = tone.properties.map((property) => {
    assert.ok(ts.isPropertyAssignment(property));
    return [`${property.name.getText(source)}-surface`, hex(property.initializer)];
  });
  pairs.push(...series.elements.map((element, index) => [`series-${index + 1}`, hex(element)]));
  for (const [token, color] of pairs) {
    const declarations = [...css.matchAll(new RegExp(`--${token}\\s*:\\s*([^;{}]+);`, 'g'))];
    assert.ok(declarations.length > 0, `--${token} 선언이 있어야 한다`);
    // 모드별 덮어쓰기가 생겨도 고정 팔레트와 어긋나는 선언을 놓치지 않는다.
    for (const [, value] of declarations) {
      assert.equal(color, oklchToHex(value), `--${token}: globals.css와 use-chart.ts를 함께 갱신해야 한다`);
    }
  }
});
