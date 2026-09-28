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
// 이전·다음 알약과 겹쳐서, 그 페이지들이 버튼을 끄는 prop을 켜고 있었다. 데스크탑은
// 알약이 화면 가운데, 버튼이 오른쪽이라 겹치지 않는다.
export function PageMain({ children }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 300);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <main className='min-h-[calc(100dvh-3rem)] px-4 pt-4 pb-(--footer-clearance) [--footer-clearance:calc(4rem+env(safe-area-inset-bottom))] sm:px-6 sm:pt-6 md:p-8 md:pb-8 lg:p-10'>
      {children}
      {visible && (
        <Button
          size='icon'
          variant='outline'
          shape='pill'
          className='fixed right-4 bottom-4 z-20 hidden size-12 shadow-md md:flex'
          onClick={() => scrollToTop()}
        >
          <ChevronUp className='size-6' />
        </Button>
      )}
    </main>
  );
}
