'use client';

import { cn } from '@/lib/utils';

import { CURVE_POINTS, P } from './models';

export type MarkColor = 'series-1' | 'series-2' | 'warn' | 'good' | 'bad';
export type GridMark = { x: number; y: number; label?: string; color: MarkColor };

// 색은 키로 받아 여기서 클래스로 바꾼다. 호출부가 'fill-series-1' 같은 문자열을 넘기면 십자선에 쓸
// stroke 짝을 만들 길이 없다. 런타임에 이어 붙인 클래스명은 Tailwind가 훑지 못해 CSS가 안 나온다.
const MARK_FILL: Record<MarkColor, string> = {
  'series-1': 'fill-series-1',
  'series-2': 'fill-series-2',
  warn: 'fill-warn-surface',
  good: 'fill-good-surface',
  bad: 'fill-bad-surface',
};
const MARK_STROKE: Record<MarkColor, string> = {
  'series-1': 'stroke-series-1',
  'series-2': 'stroke-series-2',
  warn: 'stroke-warn-surface',
  good: 'stroke-good-surface',
  bad: 'stroke-bad-surface',
};

// 유한체 위의 곡선을 그리는 격자. 다섯 탭이 모두 이걸 쓴다.
//
// 화면 좌표는 위에서 아래로 커지고 수학 좌표는 아래에서 위로 커지므로 y를 뒤집는다.
// 뒤집지 않으면 x축 대칭(점 덧셈의 마지막 단계)이 위아래가 뒤바뀌어 보인다.
const flip = (y: number) => P - 1 - y;

// 격자 한 칸이 1인데 곡선 점끼리 가장 가까운 간격이 정확히 1칸이다(x = 13·35·38 열의 y = 21과 22).
// 반지름이 0.5를 넘으면 그 세 쌍이 서로를 잡아먹어 한 덩어리로 보이므로 전부 0.5 안쪽으로 잡는다.
// 곡선 점이 직선 고리보다 작은 것도 의도다. 그래야 둘이 같은 칸에 놓인 교점에서 점이 고리 안에
// 들어앉아 둘 다 보인다. 반대로 잡으면 점이 고리를 덮어 교점 표시가 사라진다.
const R_POINT = 0.34;
const R_CELL = 0.44;
const R_MARK = 0.5;

const TICKS = [0, 10, 20, 30, 40];

export function CurveGrid({
  cells = [],
  marks = [],
  caption,
}: {
  /** 직선이 지나는 칸. 곡선 점이 아닌 것까지 포함한 자취다 */
  cells?: { x: number; y: number }[];
  marks?: GridMark[];
  caption?: string;
}) {
  return (
    <div className='flex flex-col gap-2'>
      <svg
        viewBox='-4 -3.5 50.5 49.5'
        className='mx-auto w-full max-w-2xl'
        role='img'
        aria-label='유한체 위의 곡선 격자'
      >
        {/* 모눈. 10칸마다 굵게 그어 좌표를 눈으로 셀 수 있게 한다 */}
        {Array.from({ length: P }, (_, v) => (
          <g
            key={`g${v}`}
            className={v % 10 === 0 ? 'stroke-muted-foreground/30' : 'stroke-muted-foreground/10'}
            strokeWidth={0.07}
          >
            <line x1={v} y1={0} x2={v} y2={P - 1} />
            <line x1={0} y1={flip(v)} x2={P - 1} y2={flip(v)} />
          </g>
        ))}
        <rect
          x={0}
          y={0}
          width={P - 1}
          height={P - 1}
          className='fill-none stroke-muted-foreground/40'
          strokeWidth={0.15}
        />

        {TICKS.map((t) => (
          <g key={`t${t}`} className='fill-muted-foreground'>
            <text x={t} y={P + 1.6} fontSize={2} textAnchor='middle'>
              {t}
            </text>
            <text x={-1.2} y={flip(t) + 0.7} fontSize={2} textAnchor='end'>
              {t}
            </text>
          </g>
        ))}
        <text x={P + 1.2} y={P - 1} fontSize={2.2} className='fill-muted-foreground'>
          x
        </text>
        <text x={-1.2} y={-1.4} fontSize={2.2} textAnchor='end' className='fill-muted-foreground'>
          y
        </text>

        {/* 직선이 지나는 칸은 속 빈 고리로 그린다. 곡선 점과 같은 칸에 겹쳐도 둘 다 보이고,
            그 겹친 칸이 곧 교점이라 "칸 여럿 중 셋"이 그림에서 그대로 읽힌다. */}
        {cells.map((c) => (
          <circle
            key={`c${c.x}-${c.y}`}
            cx={c.x}
            cy={flip(c.y)}
            r={R_CELL}
            className='fill-none stroke-warn-surface/70'
            strokeWidth={0.14}
          />
        ))}

        {CURVE_POINTS.map((pt) => (
          <circle key={`p${pt.x}-${pt.y}`} cx={pt.x} cy={flip(pt.y)} r={R_POINT} className='fill-muted-foreground/70' />
        ))}

        {/* 강조점에서 두 축으로 내리는 십자선. 좌표를 눈금에서 바로 읽게 해 주되 흐리게 긋는다.
            이게 진해지면 곡선보다 십자선이 먼저 눈에 들어온다. */}
        {marks.map((m) => (
          <g
            key={`x${m.label ?? ''}${m.x}-${m.y}`}
            className={MARK_STROKE[m.color]}
            strokeWidth={0.1}
            strokeDasharray='0.7 0.7'
            opacity={0.35}
          >
            <line x1={m.x} y1={flip(m.y)} x2={m.x} y2={P - 1} />
            <line x1={m.x} y1={flip(m.y)} x2={0} y2={flip(m.y)} />
          </g>
        ))}

        {marks.map((m) => {
          // 오른쪽 절반의 점은 라벨을 왼쪽에 붙인다. 안 그러면 격자 밖으로 나가 잘린다.
          const left = m.x > P * 0.55;
          return (
            <g key={`m${m.label ?? ''}${m.x}-${m.y}`}>
              {/* 배경색 테두리는 점을 키우는 게 아니라 이웃한 곡선 점과의 사이를 벌려 준다 */}
              <circle
                cx={m.x}
                cy={flip(m.y)}
                r={R_MARK}
                className={cn(MARK_FILL[m.color], 'stroke-background')}
                strokeWidth={0.12}
              />
              {m.label && (
                <text
                  x={m.x + (left ? -1.4 : 1.4)}
                  y={flip(m.y) - 1.3}
                  textAnchor={left ? 'end' : 'start'}
                  fontSize={1.8}
                  strokeWidth={0.8}
                  className='fill-foreground stroke-background [paint-order:stroke]'
                >
                  {m.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {caption && <p className='text-xs/relaxed text-muted-foreground'>{caption}</p>}
    </div>
  );
}
