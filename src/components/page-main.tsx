'use client';

import { Button } from '@/components/ui/button';
import { ChevronUp } from 'lucide-react';
import { useEffect, useState } from 'react';

function scrollToTop(duration = 300) {
  const start = window.scrollY;
  const startTime = performance.now();
  function step(now: number) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    window.scrollTo(0, start * (1 - ease));
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

type Props = {
  children: React.ReactNode;
  /** 하단 상시 패널 등과 겹칠 때 스크롤-투-톱 버튼을 숨긴다 */
  hideScrollTop?: boolean;
};

export function PageMain({ children, hideScrollTop }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (hideScrollTop) return;
    function onScroll() {
      setVisible(window.scrollY > 300);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [hideScrollTop]);

  return (
    <main className='min-h-[calc(100dvh-3rem)] p-4 pb-16 sm:p-6 md:p-8 md:pb-8 lg:p-10'>
      {children}
      {!hideScrollTop && (
        <div className='fixed right-4 bottom-20 z-50 flex flex-col gap-2 md:bottom-4'>
          {visible && (
            <Button
              size='icon'
              variant='outline'
              className='h-12 w-12 rounded-full shadow-md'
              onClick={() => scrollToTop()}
            >
              <ChevronUp className='size-6' />
            </Button>
          )}
        </div>
      )}
    </main>
  );
}
