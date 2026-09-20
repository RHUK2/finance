'use client';

import { useMemo, useState } from 'react';

import { Divide, Grid3x3, Spline } from 'lucide-react';

import { ControlSlider, ExplainCard, Metric, SectionIntro } from '@/components/simulation';
import { Card } from '@/components/ui/card';

import { CurveGrid } from './curve-grid';
import {
  CURVE_POINTS,
  N,
  P,
  REAL_CURVE_MIN_X,
  REAL_PX_RANGE,
  REAL_QX_RANGE,
  SECP256K1,
  inv,
  mod,
  realCurveY,
  realExample,
} from './models';

// 실수 곡선을 그리는 경로. 두 가지는 x = REAL_CURVE_MIN_X에서 y = 0으로 만나므로,
// 아래 가지를 오른쪽 끝에서 그 지점까지 그린 뒤 위 가지로 되돌아 나오면 한 붓에 이어진다.
// 순서를 뒤집으면 오른쪽 끝의 두 점이 직선으로 이어져 곡선이 끊겨 보인다.
//
// x를 SX배 늘려 그린다. 이 곡선은 y가 x보다 훨씬 빨리 자라서 실제 비율로 그리면
// 그림이 세로로 길쭉해져 카드 하나를 통째로 먹는다. 가로로 늘려도 점 덧셈의 기하
// (직선·세 번째 교점·x축 대칭)는 그대로 보인다.
// Q를 오른쪽 끝까지 밀어도 점이 곡선 밖으로 나가지 않도록 Q의 상한까지 그린다.
const REAL_MAX_X = REAL_QX_RANGE.max;
const SX = 2.2;
const REAL_PATH = (() => {
  const xs = Array.from({ length: 120 }, (_, i) => REAL_CURVE_MIN_X + ((REAL_MAX_X - REAL_CURVE_MIN_X) * i) / 119);
  const below = [...xs].reverse().map((x) => `${(x * SX).toFixed(3)},${realCurveY(x).toFixed(3)}`);
  const above = xs.map((x) => `${(x * SX).toFixed(3)},${(-realCurveY(x)).toFixed(3)}`);
  return `M ${below.join(' L ')} L ${above.join(' L ')}`;
})();

export function FiniteField() {
  const [a, setA] = useState(7);
  const aInv = inv(a, P);

  const [pxInput, setPxInput] = useState(-1);
  const [qxInput, setQxInput] = useState(2);
  const { px, py, qx, qy, l, rx, thirdY, sumY } = useMemo(() => realExample(pxInput, qxInput), [pxInput, qxInput]);

  // 직선은 세 점을 모두 품는 구간에 긋는다. 세 번째 교점이 Q보다 오른쪽에 놓이는
  // 조합이 있어서 P와 Q만 보고 양 끝을 잡으면 직선이 교점 앞에서 끊긴다.
  const lineFrom = Math.min(px, qx, rx) - 0.4;
  const lineTo = Math.max(px, qx, rx) + 0.4;
  // 세 번째 교점이 x축에 가까우면 그 점과 대칭점의 라벨이 겹친다. 그때만 P + Q 라벨을 아래로 내린다.
  const tight = Math.abs(thirdY - sumY) < 1.3;

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='먼저 실수 위에서 점 덧셈을 정의한다'>
        타원곡선의 점 덧셈은 숫자를 더하는 일이 아니다. 곡선 위의 두 점을 잇는 직선을 긋고, 그 직선이 곡선과 만나는 세
        번째 점을 찾고, 그 점을 x축에 대해 뒤집는다. 이 세 동작이 정의의 전부고, 이 모양이 뒤에서 식으로 번역된다.
      </SectionIntro>

      <Card className='flex flex-col gap-3 p-4'>
        <span className='flex items-center gap-1.5 text-sm font-semibold'>
          <Spline className='size-4 text-sky-500' />
          {SECP256K1.equation} 위의 P + Q
        </span>
        <ControlSlider
          label='P의 x좌표'
          hint='x를 정하면 y는 곡선이 정한다. 위쪽 가지의 점을 잡는다.'
          value={pxInput}
          onChange={setPxInput}
          min={REAL_PX_RANGE.min}
          max={REAL_PX_RANGE.max}
          step={0.1}
          format={(v) => `(${v.toFixed(2)}, ${realCurveY(v).toFixed(2)})`}
        />
        <ControlSlider
          label='Q의 x좌표'
          hint='P와 Q가 붙을수록 직선은 접선에 가까워진다. 두 범위를 떨어뜨려 둔 것이 그래서다.'
          value={qxInput}
          onChange={setQxInput}
          min={REAL_QX_RANGE.min}
          max={REAL_QX_RANGE.max}
          step={0.1}
          format={(v) => `(${v.toFixed(2)}, ${realCurveY(v).toFixed(2)})`}
        />
        <svg
          viewBox='-5.1 -5.4 11.2 10.8'
          className='mx-auto w-full max-w-lg'
          role='img'
          aria-label='실수 곡선 점 덧셈'
        >
          <line x1={-5.1} y1={0} x2={6.1} y2={0} className='stroke-muted' strokeWidth={0.04} />
          <line x1={0} y1={-5.4} x2={0} y2={5.4} className='stroke-muted' strokeWidth={0.04} />
          <path d={REAL_PATH} className='fill-none stroke-sky-500' strokeWidth={0.09} />

          {/* P와 Q를 잇는 직선. 세 번째 교점 너머까지 늘려 긋는다 */}
          <line
            x1={lineFrom * SX}
            y1={-(py + l * (lineFrom - px))}
            x2={lineTo * SX}
            y2={-(py + l * (lineTo - px))}
            className='stroke-amber-500'
            strokeDasharray='0.18 0.14'
            strokeWidth={0.07}
          />
          {/* 세 번째 교점에서 그 대칭점으로 내리는 수선 */}
          <line
            x1={rx * SX}
            y1={-thirdY}
            x2={rx * SX}
            y2={-sumY}
            className='stroke-emerald-500'
            strokeDasharray='0.18 0.14'
            strokeWidth={0.07}
          />

          <RealDot x={px * SX} y={py} label='P' dx={-0.75} dy={0.75} className='fill-sky-500' />
          <RealDot x={qx * SX} y={qy} label='Q' className='fill-sky-500' />
          <RealDot x={rx * SX} y={thirdY} label='세 번째 교점' dy={-0.55} className='fill-amber-500' />
          <RealDot x={rx * SX} y={sumY} label='P + Q' dy={tight ? 0.95 : -0.9} className='fill-emerald-500' />
        </svg>
        <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
          <Metric label='기울기 λ' value={l.toFixed(3)} sub='(y_Q − y_P) ÷ (x_Q − x_P)' />
          <Metric label='세 번째 교점의 x' value={rx.toFixed(3)} sub='λ² − x_P − x_Q' />
          <Metric
            label='P + Q'
            value={`(${rx.toFixed(2)}, ${sumY.toFixed(2)})`}
            tone='good'
            sub='세 번째 교점을 뒤집은 것'
          />
        </div>
        <p className='text-xs/relaxed text-muted-foreground'>
          P와 Q를 어디로 옮겨도 직선을 긋고, 세 번째 교점을 찾고, x축에 대해 뒤집는 세 동작은 같다. 여기 쓰인 식 셋(λ,
          λ² − x_P − x_Q, 그리고 뒤집기)이 이 페이지 끝까지 그대로 간다. 바뀌는 건 계산이 실수가 아니라 유한체에서
          일어난다는 것뿐이다.
        </p>
      </Card>

      <SectionIntro title='그 다음 무대를 유한체로 옮긴다'>
        암호에 쓰려면 값이 유한해야 하고 오차가 없어야 한다. 그래서 실수 대신 0부터 p−1까지의 정수만 남기고, 모든 연산
        뒤에 p로 나눈 나머지를 취한다. 덧셈과 곱셈은 그대로지만 나눗셈이 달라진다. 유한체에서 a로 나누는 것은 a의 역원,
        즉 곱해서 1이 되는 짝을 곱하는 것이다. 이 곱셈 하나로 나눗셈이 대체되기 때문에 위의 λ 식이 소수점 없이 성립한다.
      </SectionIntro>

      <Card className='flex flex-col gap-3 p-4'>
        <span className='flex items-center gap-1.5 text-sm font-semibold'>
          <Divide className='size-4 text-violet-500' />
          mod {P}에서 나눗셈은 역원 곱하기다
        </span>
        <ControlSlider
          label='a'
          hint={`a의 역원은 a와 곱해서 ${P}로 나눈 나머지가 1이 되는 수다. p가 소수라 0을 빼면 언제나 하나 존재한다.`}
          value={a}
          onChange={setA}
          min={1}
          max={P - 1}
          step={1}
          format={(v) => `${v}`}
        />
        <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
          <Metric label={`${a}의 역원`} value={`${aInv}`} tone='accent' />
          <Metric
            label='검산'
            value={`${a} × ${aInv} = ${a * aInv}`}
            sub={`${a * aInv} mod ${P} = ${mod(a * aInv, P)}`}
          />
          <Metric label={`1 ÷ ${a} mod ${P}`} value={`${aInv}`} sub='나눗셈의 결과가 곧 역원이다' />
        </div>
      </Card>

      <Card className='flex flex-col gap-3 p-4'>
        <span className='flex items-center gap-1.5 text-sm font-semibold'>
          <Grid3x3 className='size-4 text-emerald-500' />
          {SECP256K1.equation} mod {P}, 점 {CURVE_POINTS.length}개
        </span>
        <CurveGrid
          caption={`매끄러운 선이 아니라 흩어진 점 ${CURVE_POINTS.length}개다. 실수 곡선에서 보이던 x축 대칭은 여기에도 남아 있어, 어떤 점 (x, y)가 있으면 (x, ${P}−y)도 반드시 있다. 여기에 좌표가 없는 점 하나, 무한원점 O를 더하면 위수가 ${N}이 된다.`}
        />
      </Card>

      <ExplainCard
        icon={<Spline className='size-4 text-amber-500' />}
        title='실제 secp256k1은 얼마나 큰가'
        preview={`같은 식을 p = ${SECP256K1.p} 위에서 돌린다. 위수 n이 약 1.158 × 10⁷⁷이다.`}
        body={
          <>
            <p>
              비트코인이 쓰는 곡선은 식이 {SECP256K1.equation}으로 이 페이지와 똑같다. 다른 것은 무대의 크기뿐이다. p가{' '}
              {SECP256K1.p}이고 위수 n이 {SECP256K1.n}이다. 생성점 G의 x좌표는 {SECP256K1.gx}로 시작하는 64자리
              16진수다.
            </p>
            <p className='mt-2'>
              이 페이지에서 개인키가 고를 수 있는 값은 1부터 {N - 1}까지 {N - 1}개다. 실제 곡선에서는 그 개수가 원자
              개수를 훨씬 넘는다. 알고리즘은 한 글자도 달라지지 않고 크기만 바뀌는데, 그 크기가 곧 안전의 전부라는 것을
              마지막 탭에서 직접 보게 된다.
            </p>
          </>
        }
      />
    </div>
  );
}

function RealDot({
  x,
  y,
  label,
  className,
  dx = 0.2,
  dy = -0.25,
}: {
  x: number;
  y: number;
  label: string;
  className: string;
  /** 점끼리 가까울 때 라벨이 겹치지 않게 옮긴다 */
  dx?: number;
  dy?: number;
}) {
  return (
    <g>
      <circle cx={x} cy={-y} r={0.14} className={className} />
      <text x={x + dx} y={-y + dy} className='fill-foreground' fontSize={0.42} textAnchor={dx < 0 ? 'end' : 'start'}>
        {label}
      </text>
    </g>
  );
}
