import { ArrowDown } from 'lucide-react';

import { cn } from '@/lib/utils';

// 단계적 변환 과정을 세로 파이프라인으로 시각화. 박스(값) 사이에 연산(op) 화살표.
// split은 한 연산이 둘로 쪼개지는 출력(예: 개인키 + 체인코드, 받는 사람 + 잔돈)을 나란히 보여준다.
//
// tone은 상자의 범주(비밀·공개, 입력·결과)를 테두리 색으로 가른다. 범주에는 좋고 나쁨의 뜻이
// 없으므로 계열색(series-*)을 쓴다.
type BoxTone = 'series-1' | 'series-2' | 'series-3' | 'series-4';
type Box = { label: string; value: React.ReactNode; tone?: BoxTone };

export type PipeItem = ({ kind: 'box' } & Box) | { kind: 'split'; boxes: Box[] } | { kind: 'op'; label: string };

function BoxCell({ label, value, tone }: Box) {
  return (
    <div
      className={cn(
        'flex flex-col gap-1 rounded-md bg-muted p-3',
        tone && 'border',
        tone === 'series-1' && 'border-series-1/40',
        tone === 'series-2' && 'border-series-2/40',
        tone === 'series-3' && 'border-series-3/40',
        tone === 'series-4' && 'border-series-4/40',
      )}
    >
      <span className='text-xs text-muted-foreground'>{label}</span>
      <code className='font-mono text-xs break-all'>{value}</code>
    </div>
  );
}

export function Pipeline({ items }: { items: PipeItem[] }) {
  return (
    <div className='flex flex-col items-stretch gap-1.5'>
      {items.map((it, i) =>
        it.kind === 'op' ? (
          <div key={i} className='flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground'>
            <ArrowDown className='size-3.5 shrink-0' />
            {it.label}
          </div>
        ) : it.kind === 'split' ? (
          <div key={i} className='grid grid-cols-1 gap-1.5 sm:grid-cols-2'>
            {it.boxes.map((b, j) => (
              <BoxCell key={j} {...b} />
            ))}
          </div>
        ) : (
          <BoxCell key={i} {...it} />
        ),
      )}
    </div>
  );
}
