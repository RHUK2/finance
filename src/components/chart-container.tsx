'use client';

import { useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';

type Props = {
  containerRef: React.RefObject<HTMLDivElement | null>;
  onReset?: () => void;
};

// 예전에는 차트 위에 "클릭하여 차트 조작" 오버레이를 덮어 두고 한 번 누른 뒤에야 조작이
// 되게 했다. 막으려던 것은 모바일에서 차트가 세로 스크롤을 먹는 문제였는데, 그 대가로
// 데스크탑에서도 조작 전에 한 번씩 눌러야 했다. 차트가 열둘인 페이지에서는 열두 번이다.
//
// 지금은 그 문제를 lightweight-charts 쪽에서 막는다(`handleScroll.vertTouchDrag: false`,
// src/hooks/use-chart.ts). 세로 터치 드래그는 페이지로 흘러가고 확대는 핀치로 하므로
// 오버레이가 할 일이 없다. 터치 장치에만 확대 방법을 한 줄 남긴다.
export function ChartContainer({ containerRef, onReset }: Props) {
  const [coarse, setCoarse] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCoarse(window.matchMedia('(pointer: coarse)').matches);
  }, []);

  return (
    <div className='relative overflow-hidden border-y'>
      <div ref={containerRef} />
      {onReset && (
        <Button
          variant='ghost'
          size='icon'
          className='absolute top-2 left-2 z-10 size-6 bg-background/60 backdrop-blur-sm hover:bg-background/80'
          onClick={onReset}
        >
          <RotateCcw className='size-3' />
        </Button>
      )}
      {coarse && (
        <span className='pointer-events-none absolute right-2 bottom-2 rounded bg-background/70 px-2 py-1 text-3xs text-muted-foreground'>
          두 손가락으로 확대
        </span>
      )}
    </div>
  );
}
