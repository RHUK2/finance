'use client';

import { useEffect, useState } from 'react';
import { ChevronUp } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { scrollToTop } from '@/lib/scroll';

type Props = {
  children: React.ReactNode;
};

// 맨 위로 버튼은 데스크탑에만 뜬다. 모바일에서는 하단 바가 같은 버튼을 자기 안에 갖는다
// (mobile-nav-drawer.tsx). 예전에는 모바일에서도 오른쪽 아래에 떠 있었는데 워크스루의
// 이전·다음 알약과 겹쳐서, 그 페이지들이 버튼을 끄는 prop을 켜고 있었다. 데스크탑에서
// 화면 아래에 뜨는 워크스루 독(simulation.tsx StepDock)은 이 버튼 자리를 비워 둔다.
export function PageMain({ children }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 300);
    }
    // 스크롤이 복원된 채 열린 페이지는 한 번 굴리기 전에는 scroll 이벤트가 오지 않는다.
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <main className='px-4 pt-4 pb-(--footer-clearance) [--footer-clearance:calc(4rem+var(--spacing-safe-bottom))] sm:px-6 sm:pt-6 md:p-8 md:pb-8 lg:p-10'>
      {children}
      {visible && (
        <Button
          size='icon'
          variant='outline'
          shape='pill'
          className='fixed right-4 bottom-4 z-20 hidden size-12 shadow-md md:flex'
          onClick={() => scrollToTop()}
          aria-label='맨 위로'
        >
          <ChevronUp className='size-6' />
        </Button>
      )}
    </main>
  );
}
