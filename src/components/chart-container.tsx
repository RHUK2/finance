'use client';

import { useEffect, useRef, useState } from 'react';
import { MousePointer2, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';

type Props = {
  containerRef: React.RefObject<HTMLDivElement | null>;
  onReset?: () => void;
};

// 차트는 한 번 눌러서 깨우기 전에는 조작을 받지 않는다. 오버레이가 막는 것은 두 가지다.
// 페이지를 넘기려고 차트 위에서 휠을 굴렸을 때 화면이 아니라 차트가 확대되는 것, 그리고
// 스크롤 중에 차트를 스치면서 축이 흔들리는 것. 둘 다 의도하지 않은 첫 조작이다.
//
// 깨운 차트는 바깥을 누르면 다시 잠긴다. 그래서 페이지를 내리다 실수로 건드릴 위험이
// 차트 하나에만, 그것도 깨어 있는 동안만 생긴다.
//
// 오버레이가 있어도 useChart의 handleScroll.vertTouchDrag는 false로 둔다. 깨운 뒤에
// 세로로 넘기려는 손짓까지 차트가 먹으면 그 차트를 지나칠 방법이 없어진다.
export function ChartContainer({ containerRef, onReset }: Props) {
  const [isTouch, setIsTouch] = useState(false);
  const [active, setActive] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsTouch(window.matchMedia('(pointer: coarse)').matches);
  }, []);

  useEffect(() => {
    if (!active) return;

    const eventType = isTouch ? 'touchstart' : 'mousedown';

    function handleOutside(e: Event) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setActive(false);
      }
    }

    document.addEventListener(eventType, handleOutside, { passive: true });
    return () => document.removeEventListener(eventType, handleOutside);
  }, [active, isTouch]);

  return (
    <div ref={wrapperRef} className='relative overflow-hidden border-y'>
      <div ref={containerRef} />
      {onReset && (
        <Button
          variant='ghost'
          size='icon'
          aria-label='차트 스케일 초기화'
          className='absolute top-2 left-2 z-10 size-6 bg-background/60 backdrop-blur-sm hover:bg-background/80'
          onClick={onReset}
        >
          <RotateCcw className='size-3' />
        </Button>
      )}
      {!active && (
        // 포인터 전용 가드다. 캔버스에 키보드 조작이 없어 키보드로 깨워도 할 수 있는 것이 없으므로
        // 탭 정지로 만들지 않고, 누를 수 없는 안내 문구를 보조기술이 읽지 않게 숨긴다.
        <div
          aria-hidden='true'
          className='absolute inset-0 z-10 flex cursor-pointer items-center justify-center bg-black/20 backdrop-blur-[1px] transition-opacity'
          onClick={() => setActive(true)}
        >
          <div className='flex flex-col items-center gap-1.5 rounded-xl border border-white/20 bg-black/50 px-5 py-3 text-white/80 backdrop-blur-sm'>
            <MousePointer2 className='size-4' />
            <span className='text-xs font-medium'>{isTouch ? '탭하여 차트 조작' : '클릭하여 차트 조작'}</span>
          </div>
        </div>
      )}
    </div>
  );
}
