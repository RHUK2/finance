'use client';

import { CURVE_POINTS, P } from './models';

export type GridMark = { x: number; y: number; label?: string; className: string };

// 유한체 위의 곡선을 그리는 격자. 다섯 탭이 모두 이걸 쓴다.
//
// 화면 좌표는 위에서 아래로 커지고 수학 좌표는 아래에서 위로 커지므로 y를 뒤집는다.
// 뒤집지 않으면 x축 대칭(점 덧셈의 마지막 단계)이 위아래가 뒤바뀌어 보인다.
const flip = (y: number) => P - 1 - y;

export function CurveGrid({
  cells = [],
  marks = [],
  caption,
}: {
  /** 직선이 지나는 칸. 곡선 점이 아닌 것까지 포함한 흐린 자취다 */
  cells?: { x: number; y: number }[];
  marks?: GridMark[];
  caption?: string;
}) {
  return (
    <div className='flex flex-col gap-2'>
      <svg viewBox='-4 -4 51 51' className='mx-auto w-full max-w-md' role='img' aria-label='유한체 위의 곡선 격자'>
        <line x1={0} y1={flip(0) + 1.5} x2={P - 1} y2={flip(0) + 1.5} className='stroke-muted' strokeWidth={0.25} />
        <line x1={-1.5} y1={0} x2={-1.5} y2={P - 1} className='stroke-muted' strokeWidth={0.25} />

        {cells.map((c) => (
          <circle key={`c${c.x}-${c.y}`} cx={c.x} cy={flip(c.y)} r={0.45} className='fill-amber-500/35' />
        ))}

        {CURVE_POINTS.map((pt) => (
          <circle key={`p${pt.x}-${pt.y}`} cx={pt.x} cy={flip(pt.y)} r={0.8} className='fill-muted-foreground/45' />
        ))}

        {marks.map((m) => {
          // 오른쪽 절반의 점은 라벨을 왼쪽에 붙인다. 안 그러면 격자 밖으로 나가 잘린다.
          const left = m.x > P * 0.55;
          return (
            <g key={`m${m.label ?? ''}${m.x}-${m.y}`}>
              <circle cx={m.x} cy={flip(m.y)} r={1.6} className={m.className} />
              {m.label && (
                <text
                  x={m.x + (left ? -2.4 : 2.4)}
                  y={flip(m.y) - 1.8}
                  textAnchor={left ? 'end' : 'start'}
                  className='fill-foreground'
                  fontSize={3.2}
                >
                  {m.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {caption && <p className='text-muted-foreground text-xs/relaxed'>{caption}</p>}
    </div>
  );
}
